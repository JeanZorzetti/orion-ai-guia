"""
Testes unitários para o DataCleaner
"""
import pytest
from app.services.data_cleaner import DataCleaner


class TestDataCleaner:
    """Testes para o serviço de limpeza de dados"""

    @pytest.fixture
    def data_cleaner(self):
        """Fixture para o DataCleaner"""
        return DataCleaner()

    def test_clean_supplier_name(self, data_cleaner):
        """Testa limpeza de nome de fornecedor"""
        # Nome com espaços extras e caracteres especiais
        messy_name = "  EMPRESA     DE    teste    LTDA.  "
        cleaned = data_cleaner.clean_supplier_name(messy_name)
        assert cleaned == "Empresa De Teste LTDA"

        # Nome com caracteres unicode
        unicode_name = "Ção & Companhia LTDA"
        cleaned = data_cleaner.clean_supplier_name(unicode_name)
        assert "ção" in cleaned.lower()

        # Nome vazio
        assert data_cleaner.clean_supplier_name("") == ""
        assert data_cleaner.clean_supplier_name(None) == ""

    def test_clean_cnpj(self, data_cleaner):
        """Testa limpeza de CNPJ"""
        # CNPJ sem formatação
        raw_cnpj = "12345678000190"
        cleaned = data_cleaner.clean_cnpj(raw_cnpj)
        assert cleaned == "12.345.678/0001-90"

        # CNPJ já formatado
        formatted_cnpj = "12.345.678/0001-90"
        cleaned = data_cleaner.clean_cnpj(formatted_cnpj)
        assert cleaned == formatted_cnpj

        # CNPJ com caracteres extras
        messy_cnpj = "  12.345.678/0001-90  "
        cleaned = data_cleaner.clean_cnpj(messy_cnpj)
        assert cleaned == "12.345.678/0001-90"

        # CNPJ inválido (tamanho incorreto)
        invalid_cnpj = "123456"
        cleaned = data_cleaner.clean_cnpj(invalid_cnpj)
        assert cleaned == ""

        # CNPJ None ou vazio
        assert data_cleaner.clean_cnpj("") == ""
        assert data_cleaner.clean_cnpj(None) == ""

    def test_clean_invoice_number(self, data_cleaner):
        """Testa limpeza de número de nota fiscal"""
        # Número com espaços
        messy_number = "  nf-001  "
        cleaned = data_cleaner.clean_invoice_number(messy_number)
        assert cleaned == "NF-001"

        # Número com caracteres especiais
        special_number = "NF/001@2023"
        cleaned = data_cleaner.clean_invoice_number(special_number)
        assert cleaned == "NF/001.2023"  # Remove @ mas mantém / e .

        # Número muito longo (deve ser truncado)
        long_number = "A" * 100
        cleaned = data_cleaner.clean_invoice_number(long_number)
        assert len(cleaned) <= 50

    def test_clean_date(self, data_cleaner):
        """Testa limpeza de datas"""
        # Data brasileira
        br_date = "15/01/2023"
        cleaned = data_cleaner.clean_date(br_date)
        assert cleaned == "2023-01-15"

        # Data com formato diferente
        alt_date = "15-01-2023"
        cleaned = data_cleaner.clean_date(alt_date)
        assert cleaned == "2023-01-15"

        # Data americana (ISO)
        iso_date = "2023-01-15"
        cleaned = data_cleaner.clean_date(iso_date)
        assert cleaned == "2023-01-15"

        # Data inválida
        invalid_date = "32/13/2023"
        cleaned = data_cleaner.clean_date(invalid_date)
        assert cleaned == ""

        # Data muito antiga (deve ser rejeitada)
        old_date = "01/01/1980"
        cleaned = data_cleaner.clean_date(old_date)
        assert cleaned == ""

        # Data muito futura (deve ser rejeitada)
        future_date = "01/01/2050"
        cleaned = data_cleaner.clean_date(future_date)
        assert cleaned == ""

    def test_clean_monetary_value(self, data_cleaner):
        """Testa limpeza de valores monetários"""
        # Valor brasileiro com vírgula
        br_value = "1.234,56"
        cleaned = data_cleaner.clean_monetary_value(br_value)
        assert cleaned == 1234.56

        # Valor americano com ponto
        us_value = "1234.56"
        cleaned = data_cleaner.clean_monetary_value(us_value)
        assert cleaned == 1234.56

        # Valor com símbolo de moeda
        currency_value = "R$ 1.500,00"
        cleaned = data_cleaner.clean_monetary_value(currency_value)
        assert cleaned == 1500.00

        # Valor já numérico
        numeric_value = 999.99
        cleaned = data_cleaner.clean_monetary_value(numeric_value)
        assert cleaned == 999.99

        # Valor inválido
        invalid_value = "abc"
        cleaned = data_cleaner.clean_monetary_value(invalid_value)
        assert cleaned == 0.0

        # Valor negativo (deve ser convertido para 0)
        negative_value = -100.00
        cleaned = data_cleaner.clean_monetary_value(negative_value)
        assert cleaned == 0.0

    def test_clean_description(self, data_cleaner):
        """Testa limpeza de descrições"""
        # Descrição com quebras de linha
        messy_desc = "Descrição com\nquebras\tde linha"
        cleaned = data_cleaner.clean_description(messy_desc)
        assert "\n" not in cleaned
        assert "\t" not in cleaned
        assert cleaned.startswith("D")  # Primeira letra maiúscula

        # Descrição vazia
        assert data_cleaner.clean_description("") == ""

        # Descrição muito longa (deve ser truncada)
        long_desc = "A" * 1000
        cleaned = data_cleaner.clean_description(long_desc)
        assert len(cleaned) <= 500

    def test_clean_category(self, data_cleaner):
        """Testa limpeza de categorias"""
        # Categoria conhecida
        raw_category = "servicos"
        cleaned = data_cleaner.clean_category(raw_category)
        assert cleaned == "Serviços"

        # Categoria desconhecida
        unknown_category = "categoria_inexistente"
        cleaned = data_cleaner.clean_category(unknown_category)
        assert cleaned == "Categoria_inexistente" or cleaned == "Outros"

        # Categoria vazia
        empty_category = ""
        cleaned = data_cleaner.clean_category(empty_category)
        assert cleaned == "Outros"

    def test_clean_payment_method(self, data_cleaner):
        """Testa limpeza de formas de pagamento"""
        # Método conhecido
        raw_method = "boleto bancario"
        cleaned = data_cleaner.clean_payment_method(raw_method)
        assert cleaned == "Boleto"

        # PIX
        pix_method = "chave pix"
        cleaned = data_cleaner.clean_payment_method(pix_method)
        assert cleaned == "PIX"

        # Método desconhecido
        unknown_method = "metodo_desconhecido"
        cleaned = data_cleaner.clean_payment_method(unknown_method)
        assert cleaned == "Metodo_desconhecido"

    def test_clean_items_list(self, data_cleaner):
        """Testa limpeza de lista de itens"""
        messy_items = [
            {
                "description": "  produto a  ",
                "quantity": "2.0",
                "unit_price": "300,50",
                "total_price": "601,00"
            },
            {
                "description": "",
                "quantity": 0,
                "unit_price": 0,
                "total_price": 0
            },
            {
                "description": "Produto B",
                "quantity": 1,
                "unit_price": 500.00,
                "total_price": 0  # Deve calcular automaticamente
            }
        ]

        cleaned = data_cleaner.clean_items_list(messy_items)

        # Primeiro item deve ser limpo
        assert len(cleaned) >= 2  # Item vazio deve ser removido
        assert cleaned[0]["description"] == "Produto a"
        assert cleaned[0]["quantity"] == 2
        assert cleaned[0]["unit_price"] == 300.50
        assert cleaned[0]["total_price"] == 601.00

        # Terceiro item deve ter total_price calculado
        item_with_calc = next((item for item in cleaned if item["description"] == "Produto B"), None)
        assert item_with_calc is not None
        assert item_with_calc["total_price"] == 500.00

    def test_clean_quantity(self, data_cleaner):
        """Testa limpeza de quantidades"""
        # Quantidade como string
        str_qty = "5.0"
        cleaned = data_cleaner.clean_quantity(str_qty)
        assert cleaned == 5

        # Quantidade como float
        float_qty = 3.7
        cleaned = data_cleaner.clean_quantity(float_qty)
        assert cleaned == 3

        # Quantidade inválida
        invalid_qty = "abc"
        cleaned = data_cleaner.clean_quantity(invalid_qty)
        assert cleaned == 1

        # Quantidade zero (deve ser convertida para 1)
        zero_qty = 0
        cleaned = data_cleaner.clean_quantity(zero_qty)
        assert cleaned == 1

    def test_validate_confidence_score(self, data_cleaner):
        """Testa validação de score de confiança"""
        # Score válido
        valid_score = 0.85
        validated = data_cleaner.validate_confidence_score(valid_score)
        assert validated == 0.85

        # Score como string
        str_score = "0.75"
        validated = data_cleaner.validate_confidence_score(str_score)
        assert validated == 0.75

        # Score maior que 1 (deve ser limitado)
        high_score = 1.5
        validated = data_cleaner.validate_confidence_score(high_score)
        assert validated == 1.0

        # Score negativo (deve ser limitado)
        neg_score = -0.5
        validated = data_cleaner.validate_confidence_score(neg_score)
        assert validated == 0.0

        # Score inválido
        invalid_score = "abc"
        validated = data_cleaner.validate_confidence_score(invalid_score)
        assert validated == 0.0

    def test_clean_extracted_data_complete(self, data_cleaner, messy_invoice_data):
        """Testa limpeza completa de dados extraídos"""
        cleaned = data_cleaner.clean_extracted_data(messy_invoice_data)

        # Verifica se todos os campos foram processados
        assert "supplier_name" in cleaned
        assert "supplier_cnpj" in cleaned
        assert "total_amount" in cleaned
        assert "confidence_score" in cleaned

        # Verifica se a limpeza foi aplicada
        assert cleaned["supplier_name"] == "Empresa De Teste LTDA"
        assert cleaned["supplier_cnpj"] == "12.345.678/0001-90"
        assert cleaned["total_amount"] == 1234.56
        assert cleaned["confidence_score"] == 0.75

        # Verifica cálculo de net_amount
        assert cleaned["net_amount"] == cleaned["total_amount"] - cleaned["tax_amount"]

    def test_validate_data_consistency(self, data_cleaner):
        """Testa validação de consistência dos dados"""
        # Dados com imposto maior que total (inconsistente)
        inconsistent_data = {
            "supplier_name": "Teste",
            "total_amount": 100.0,
            "tax_amount": 150.0,  # Maior que o total
            "net_amount": 0.0,
            "issue_date": "2023-02-01",
            "due_date": "2023-01-01",  # Data de vencimento antes da emissão
            "items": [],
            "ai_suggestions": []
        }

        validated = data_cleaner._validate_data_consistency(inconsistent_data)

        # Deve corrigir o imposto
        assert validated["tax_amount"] == 0.0
        assert validated["net_amount"] == validated["total_amount"]

        # Deve adicionar sugestão sobre a data
        suggestions = validated["ai_suggestions"]
        assert any("vencimento anterior" in sugg.lower() for sugg in suggestions)

    def test_generate_quality_suggestions(self, data_cleaner):
        """Testa geração de sugestões de qualidade"""
        # Dados incompletos
        incomplete_data = {
            "supplier_name": "",  # Faltando
            "supplier_cnpj": "12.345.678/0001-90",
            "total_amount": 1000.0,
            "confidence_score": 0.6,  # Baixa confiança
            "items": []  # Sem itens
        }

        suggestions = data_cleaner._generate_quality_suggestions(incomplete_data)

        # Deve sugerir preenchimento manual para nome
        assert any("nome do fornecedor" in sugg.lower() for sugg in suggestions)

        # Deve sugerir revisão por baixa confiança
        assert any("baixa confiança" in sugg.lower() for sugg in suggestions)

        # Deve sugerir adição de itens
        assert any("item" in sugg.lower() for sugg in suggestions)

    def test_get_cleaning_stats(self, data_cleaner, sample_invoice_data):
        """Testa geração de estatísticas de limpeza"""
        # Dados originais completos
        original_data = sample_invoice_data.copy()

        # Limpa os dados
        cleaned_data = data_cleaner.clean_extracted_data(original_data)

        # Gera estatísticas
        stats = data_cleaner.get_cleaning_stats(original_data, cleaned_data)

        assert "fields_cleaned" in stats
        assert "fields_total" in stats
        assert "cleaning_percentage" in stats
        assert "items_count" in stats

        # Como os dados originais estão completos, deve ter alta porcentagem
        assert stats["cleaning_percentage"] > 80

    def test_error_handling(self, data_cleaner):
        """Testa tratamento de erros"""
        # Dados None
        result = data_cleaner.clean_extracted_data(None)
        assert "error" in result

        # Dados com tipo incorreto
        invalid_data = "string_instead_of_dict"
        result = data_cleaner.clean_extracted_data(invalid_data)
        assert "error" in result

    @pytest.mark.parametrize("input_value,expected", [
        ("12.345.678/0001-90", "12.345.678/0001-90"),
        ("12345678000190", "12.345.678/0001-90"),
        ("12 345 678 0001 90", "12.345.678/0001-90"),
        ("invalid", ""),
        ("", ""),
        (None, "")
    ])
    def test_cnpj_variations(self, data_cleaner, input_value, expected):
        """Testa diferentes variações de CNPJ"""
        result = data_cleaner.clean_cnpj(input_value)
        assert result == expected

    @pytest.mark.parametrize("input_value,expected", [
        ("1234.56", 1234.56),
        ("1.234,56", 1234.56),
        ("R$ 1.500,00", 1500.0),
        ("$1,500.00", 1500.0),
        ("abc", 0.0),
        ("", 0.0),
        (None, 0.0),
        (-100, 0.0)
    ])
    def test_monetary_variations(self, data_cleaner, input_value, expected):
        """Testa diferentes variações de valores monetários"""
        result = data_cleaner.clean_monetary_value(input_value)
        assert result == expected