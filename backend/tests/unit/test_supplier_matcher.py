"""
Testes unitários para o SupplierMatcher
"""
import pytest
from unittest.mock import MagicMock
from app.services.supplier_matcher import SupplierMatcher
from app.models.supplier import Supplier
from app.models.invoice import Invoice


class TestSupplierMatcher:
    """Testes para o serviço de fuzzy matching de fornecedores"""

    @pytest.fixture
    def mock_db_session(self):
        """Mock da sessão do banco de dados"""
        session = MagicMock()

        # Mock de fornecedores existentes
        suppliers = [
            MagicMock(
                id=1,
                name="Microsoft Corporation",
                cnpj="12.345.678/0001-90",
                category="Tecnologia",
                is_active=True
            ),
            MagicMock(
                id=2,
                name="Apple Inc",
                cnpj="98.765.432/0001-10",
                category="Tecnologia",
                is_active=True
            ),
            MagicMock(
                id=3,
                name="João da Silva Consultoria ME",
                cnpj="11.222.333/0001-44",
                category="Consultoria",
                is_active=True
            )
        ]

        # Mock de faturas existentes
        invoices = [
            MagicMock(
                supplier_name="Microsoft Corp",
                supplier_cnpj="12.345.678/0001-90",
                category="Tecnologia"
            ),
            MagicMock(
                supplier_name="Joao Silva Consultoria",
                supplier_cnpj="11.222.333/0001-44",
                category="Consultoria"
            )
        ]

        # Configurar mocks de query
        session.query.return_value.filter.return_value.all.return_value = suppliers
        session.query.return_value.filter.return_value.count.return_value = len(suppliers)
        session.query.return_value.count.return_value = len(suppliers)

        # Mock específico para Supplier
        def supplier_query_side_effect(model):
            if model == Supplier:
                mock_query = MagicMock()
                mock_query.filter.return_value.all.return_value = suppliers
                mock_query.filter.return_value.count.return_value = len(suppliers)
                mock_query.count.return_value = len(suppliers)
                return mock_query
            elif model == Invoice:
                mock_query = MagicMock()
                mock_query.filter.return_value.all.return_value = invoices
                mock_query.filter.return_value.filter.return_value.all.return_value = invoices
                mock_query.filter.return_value.count.return_value = len(invoices)
                mock_query.count.return_value = len(invoices)
                return mock_query

        session.query.side_effect = supplier_query_side_effect

        return session

    @pytest.fixture
    def supplier_matcher(self, mock_db_session):
        """Fixture para o SupplierMatcher"""
        return SupplierMatcher(mock_db_session)

    def test_normalize_text(self, supplier_matcher):
        """Testa normalização de texto"""
        # Texto com acentos e caracteres especiais
        text_with_accents = "João & Cia LTDA"
        normalized = supplier_matcher._normalize_text(text_with_accents)
        assert "joao" in normalized.lower()
        assert "cia" in normalized.lower()

        # Texto com palavras de parada
        text_with_stop_words = "Microsoft Corporation LTDA"
        normalized = supplier_matcher._normalize_text(text_with_stop_words)
        assert "microsoft corporation" in normalized

        # Texto vazio
        assert supplier_matcher._normalize_text("") == ""
        assert supplier_matcher._normalize_text(None) == ""

    def test_find_by_cnpj_exact_match(self, supplier_matcher):
        """Testa busca por CNPJ exato"""
        # Força o cache com dados de teste
        supplier_matcher._suppliers_cache = [
            {
                'supplier_id': 1,
                'name': 'Microsoft Corporation',
                'cnpj': '12.345.678/0001-90',
                'category': 'Tecnologia',
                'normalized_name': 'microsoft corporation'
            }
        ]

        # CNPJ formatado
        result = supplier_matcher._find_by_cnpj("12.345.678/0001-90", supplier_matcher._suppliers_cache)
        assert result is not None
        assert result['score'] == 100
        assert result['match_type'] == 'exact_cnpj'

        # CNPJ sem formatação
        result = supplier_matcher._find_by_cnpj("12345678000190", supplier_matcher._suppliers_cache)
        assert result is not None
        assert result['score'] == 100

        # CNPJ não encontrado
        result = supplier_matcher._find_by_cnpj("99.999.999/0001-99", supplier_matcher._suppliers_cache)
        assert result is None

    def test_fuzzy_match_by_name(self, supplier_matcher):
        """Testa fuzzy matching por nome"""
        # Força o cache com dados de teste
        supplier_matcher._suppliers_cache = [
            {
                'supplier_id': 1,
                'name': 'Microsoft Corporation',
                'cnpj': '12.345.678/0001-90',
                'category': 'Tecnologia',
                'normalized_name': 'microsoft corporation'
            },
            {
                'supplier_id': 2,
                'name': 'Apple Inc',
                'cnpj': '98.765.432/0001-10',
                'category': 'Tecnologia',
                'normalized_name': 'apple inc'
            }
        ]

        # Nome similar
        matches = supplier_matcher._fuzzy_match_by_name(
            "Microsoft Corp",
            supplier_matcher._suppliers_cache,
            limit=5
        )

        assert len(matches) > 0
        assert matches[0]['name'] == 'Microsoft Corporation'
        assert matches[0]['score'] >= 70  # Score mínimo

        # Nome com erro de digitação
        matches = supplier_matcher._fuzzy_match_by_name(
            "Microsofte Corporation",
            supplier_matcher._suppliers_cache,
            limit=5
        )

        assert len(matches) > 0
        best_match = matches[0]
        assert best_match['name'] == 'Microsoft Corporation'

    def test_find_matching_suppliers_cnpj_priority(self, supplier_matcher):
        """Testa que busca por CNPJ tem prioridade"""
        # Mock do método _get_suppliers_cache
        supplier_matcher._suppliers_cache = [
            {
                'supplier_id': 1,
                'name': 'Microsoft Corporation',
                'cnpj': '12.345.678/0001-90',
                'category': 'Tecnologia',
                'normalized_name': 'microsoft corporation'
            }
        ]

        matches = supplier_matcher.find_matching_suppliers(
            supplier_name="Apple Inc",  # Nome diferente
            supplier_cnpj="12.345.678/0001-90",  # CNPJ que bate com Microsoft
            limit=5
        )

        # Deve retornar Microsoft por conta do CNPJ
        assert len(matches) == 1
        assert matches[0]['name'] == 'Microsoft Corporation'
        assert matches[0]['score'] == 100

    def test_suggest_supplier_merge(self, supplier_matcher):
        """Testa sugestão de merge de fornecedores"""
        # Mock do método find_matching_suppliers para retornar match com score alto
        supplier_matcher.find_matching_suppliers = MagicMock(return_value=[
            {
                'supplier_id': 1,
                'name': 'Microsoft Corporation',
                'cnpj': '12.345.678/0001-90',
                'score': 95,
                'match_reason': 'Fuzzy matching (ratio)',
                'match_type': 'fuzzy_ratio'
            }
        ])

        suggestion = supplier_matcher.suggest_supplier_merge(
            supplier_name="Microsoft Corp",
            supplier_cnpj="12.345.678/0001-90"
        )

        assert suggestion is not None
        assert suggestion['suggested_merge'] is True
        assert suggestion['confidence'] in ['high', 'medium']

        # Teste com score baixo (não deve sugerir merge)
        supplier_matcher.find_matching_suppliers = MagicMock(return_value=[
            {
                'supplier_id': 1,
                'name': 'Microsoft Corporation',
                'score': 70,  # Score baixo
                'match_reason': 'Fuzzy matching (ratio)',
                'match_type': 'fuzzy_ratio'
            }
        ])

        suggestion = supplier_matcher.suggest_supplier_merge(
            supplier_name="Some Random Company",
            supplier_cnpj=""
        )

        assert suggestion is None

    def test_create_or_get_supplier_existing(self, supplier_matcher, mock_db_session):
        """Testa criação/busca de fornecedor com correspondência existente"""
        # Mock do find_matching_suppliers para retornar match forte
        supplier_matcher.find_matching_suppliers = MagicMock(return_value=[
            {
                'supplier_id': 1,
                'name': 'Microsoft Corporation',
                'cnpj': '12.345.678/0001-90',
                'score': 95,
                'match_reason': 'Fuzzy matching (ratio)',
                'match_type': 'fuzzy_ratio'
            }
        ])

        # Mock do fornecedor existente
        existing_supplier = MagicMock(spec=Supplier)
        existing_supplier.name = "Microsoft Corporation"
        existing_supplier.cnpj = "12.345.678/0001-90"

        mock_db_session.query.return_value.filter.return_value.first.return_value = existing_supplier

        supplier_data = {
            'name': 'Microsoft Corp',
            'cnpj': '12.345.678/0001-90',
            'email': 'contact@microsoft.com'
        }

        supplier, is_new, matching_info = supplier_matcher.create_or_get_supplier(
            supplier_data=supplier_data,
            auto_merge=True
        )

        assert supplier == existing_supplier
        assert is_new is False
        assert matching_info['matched'] is True
        assert matching_info['match_score'] == 95

    def test_create_or_get_supplier_new(self, supplier_matcher, mock_db_session):
        """Testa criação de novo fornecedor"""
        # Mock sem correspondências
        supplier_matcher.find_matching_suppliers = MagicMock(return_value=[])

        supplier_data = {
            'name': 'New Company LTDA',
            'cnpj': '99.888.777/0001-66',
            'email': 'contact@newcompany.com'
        }

        supplier, is_new, matching_info = supplier_matcher.create_or_get_supplier(
            supplier_data=supplier_data,
            auto_merge=False
        )

        assert is_new is True
        assert matching_info['matched'] is False
        assert matching_info['created_new'] is True

    def test_deduplicate_and_rank(self, supplier_matcher):
        """Testa remoção de duplicatas e ranking"""
        matches = [
            {
                'supplier_id': 1,
                'name': 'Microsoft Corp',
                'score': 85,
                'match_type': 'fuzzy_ratio'
            },
            {
                'supplier_id': 1,  # Duplicata
                'name': 'Microsoft Corporation',
                'score': 90,
                'match_type': 'exact_cnpj'
            },
            {
                'supplier_id': 2,
                'name': 'Apple Inc',
                'score': 75,
                'match_type': 'fuzzy_partial'
            }
        ]

        result = supplier_matcher._deduplicate_and_rank(matches, limit=5)

        # Deve remover duplicatas
        assert len(result) == 2

        # Deve manter o de maior score
        microsoft_match = next((m for m in result if m['supplier_id'] == 1), None)
        assert microsoft_match['score'] == 90

        # Deve estar ordenado por score
        assert result[0]['score'] >= result[1]['score']

    def test_update_supplier_if_needed(self, supplier_matcher):
        """Testa atualização de fornecedor existente"""
        # Mock do fornecedor existente
        existing_supplier = MagicMock(spec=Supplier)
        existing_supplier.name = "Microsoft Corporation"
        existing_supplier.email = None  # Campo vazio
        existing_supplier.phone = "(11) 99999-9999"  # Campo preenchido

        new_data = {
            'email': 'contact@microsoft.com',  # Deve atualizar
            'phone': '(11) 88888-8888',  # Não deve atualizar (já preenchido)
            'address': 'New Address'  # Deve atualizar
        }

        updated_fields = supplier_matcher._update_supplier_if_needed(existing_supplier, new_data)

        # Deve atualizar email e address
        assert 'email' in updated_fields
        assert 'address' in updated_fields
        # Não deve atualizar phone
        assert 'phone' not in updated_fields

    def test_get_supplier_statistics(self, supplier_matcher, mock_db_session):
        """Testa geração de estatísticas"""
        stats = supplier_matcher.get_supplier_statistics()

        assert 'total_suppliers' in stats
        assert 'active_suppliers' in stats
        assert 'suppliers_with_cnpj' in stats
        assert 'total_invoices' in stats
        assert 'unique_supplier_names' in stats

    def test_error_handling_empty_db(self, mock_db_session):
        """Testa comportamento com banco vazio"""
        # Mock de banco vazio
        mock_db_session.query.return_value.filter.return_value.all.return_value = []
        mock_db_session.query.return_value.count.return_value = 0

        matcher = SupplierMatcher(mock_db_session)

        matches = matcher.find_matching_suppliers(
            supplier_name="Any Company",
            supplier_cnpj="12.345.678/0001-90"
        )

        assert matches == []

    def test_count_invoices_for_supplier(self, supplier_matcher, mock_db_session):
        """Testa contagem de faturas por fornecedor"""
        # Mock da contagem
        mock_db_session.query.return_value.filter.return_value.count.return_value = 5
        mock_db_session.query.return_value.filter.return_value.filter.return_value.count.return_value = 3

        # Sem CNPJ
        count = supplier_matcher._count_invoices_for_supplier("Microsoft Corporation")
        assert count == 5

        # Com CNPJ
        count = supplier_matcher._count_invoices_for_supplier("Microsoft Corporation", "12.345.678/0001-90")
        assert count == 3

    @pytest.mark.parametrize("target_name,expected_matches", [
        ("Microsoft Corporation", ["Microsoft Corp", "Microsoft Ltda"]),
        ("João da Silva", ["Joao Silva", "J. Silva"]),
        ("Apple Inc", ["Apple Incorporated", "Apple"]),
        ("Completely Different Name", [])
    ])
    def test_fuzzy_matching_scenarios(self, supplier_matcher, target_name, expected_matches):
        """Testa diferentes cenários de fuzzy matching"""
        # Mock do cache com fornecedores de teste
        test_suppliers = [
            {
                'supplier_id': 1,
                'name': 'Microsoft Corp',
                'cnpj': '12.345.678/0001-90',
                'category': 'Tecnologia',
                'normalized_name': supplier_matcher._normalize_text('Microsoft Corp')
            },
            {
                'supplier_id': 2,
                'name': 'Microsoft Ltda',
                'cnpj': '98.765.432/0001-10',
                'category': 'Tecnologia',
                'normalized_name': supplier_matcher._normalize_text('Microsoft Ltda')
            },
            {
                'supplier_id': 3,
                'name': 'Joao Silva',
                'cnpj': '11.222.333/0001-44',
                'category': 'Consultoria',
                'normalized_name': supplier_matcher._normalize_text('Joao Silva')
            },
            {
                'supplier_id': 4,
                'name': 'J. Silva',
                'cnpj': '44.555.666/0001-77',
                'category': 'Consultoria',
                'normalized_name': supplier_matcher._normalize_text('J. Silva')
            }
        ]

        supplier_matcher._suppliers_cache = test_suppliers

        matches = supplier_matcher._fuzzy_match_by_name(target_name, test_suppliers, limit=10)

        # Verifica se encontrou as correspondências esperadas
        if expected_matches:
            assert len(matches) > 0
            found_names = [match['name'] for match in matches]

            # Verifica se pelo menos uma das correspondências esperadas foi encontrada
            assert any(expected in found_names for expected in expected_matches)
        else:
            # Para nomes completamente diferentes, pode não encontrar nada ou ter score baixo
            assert len(matches) == 0 or all(match['score'] < 50 for match in matches)

    def test_cache_management(self, supplier_matcher):
        """Testa gerenciamento de cache"""
        # Cache inicial deve estar vazio
        assert supplier_matcher._suppliers_cache is None

        # Força carregamento do cache
        suppliers = supplier_matcher._get_suppliers_cache()
        assert suppliers is not None
        assert supplier_matcher._suppliers_cache is not None

        # Limpa cache
        supplier_matcher._clear_cache()
        assert supplier_matcher._suppliers_cache is None