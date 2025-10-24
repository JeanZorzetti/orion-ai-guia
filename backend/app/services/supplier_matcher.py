import logging
from typing import Dict, Any, List, Tuple, Optional
from thefuzz import fuzz, process
import re
import unicodedata
from sqlalchemy.orm import Session

from app.models.supplier_model import Supplier
from app.models.invoice_model import Invoice
from app.core.database import get_db

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupplierMatcher:
    """
    Serviço para fuzzy matching de fornecedores existentes
    """

    def __init__(self, db: Session):
        """Inicializa o matcher"""
        self.db = db
        self.min_score = 70  # Score mínimo para considerar uma correspondência
        self.excellent_score = 90  # Score para consideração como correspondência excelente

        # Cache para fornecedores
        self._suppliers_cache = None
        self._suppliers_normalized_cache = None

        logger.info("SupplierMatcher inicializado")

    def find_matching_suppliers(
        self,
        supplier_name: str,
        supplier_cnpj: str = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Encontra fornecedores similares usando fuzzy matching

        Args:
            supplier_name: Nome do fornecedor a ser pesquisado
            supplier_cnpj: CNPJ do fornecedor (opcional)
            limit: Número máximo de sugestões

        Returns:
            Lista de fornecedores correspondentes com scores
        """

        try:
            # Carrega fornecedores do cache ou banco
            suppliers = self._get_suppliers_cache()

            if not suppliers:
                logger.info("Nenhum fornecedor encontrado no banco de dados")
                return []

            # Primeira tentativa: match exato por CNPJ
            if supplier_cnpj:
                cnpj_match = self._find_by_cnpj(supplier_cnpj, suppliers)
                if cnpj_match:
                    logger.info(f"Match exato por CNPJ encontrado: {cnpj_match['name']}")
                    return [cnpj_match]

            # Segunda tentativa: fuzzy matching por nome
            name_matches = self._fuzzy_match_by_name(supplier_name, suppliers, limit)

            # Terceira tentativa: busca histórica em faturas
            if not name_matches or len(name_matches) < limit:
                historical_matches = self._find_in_invoice_history(supplier_name, supplier_cnpj, limit)
                name_matches.extend(historical_matches)

            # Remove duplicatas e ordena por score
            final_matches = self._deduplicate_and_rank(name_matches, limit)

            logger.info(f"Encontradas {len(final_matches)} correspondências para '{supplier_name}'")

            return final_matches

        except Exception as e:
            logger.error(f"Erro no fuzzy matching: {e}")
            return []

    def suggest_supplier_merge(
        self,
        supplier_name: str,
        supplier_cnpj: str = None
    ) -> Optional[Dict[str, Any]]:
        """
        Sugere merge/consolidação com fornecedor existente

        Args:
            supplier_name: Nome do fornecedor
            supplier_cnpj: CNPJ do fornecedor

        Returns:
            Sugestão de fornecedor para merge ou None
        """

        matches = self.find_matching_suppliers(supplier_name, supplier_cnpj, limit=1)

        if matches and matches[0]['score'] >= self.excellent_score:
            return {
                'suggested_merge': True,
                'target_supplier': matches[0],
                'confidence': 'high' if matches[0]['score'] >= 95 else 'medium',
                'reason': f"Alta similaridade ({matches[0]['score']}%) detectada"
            }

        return None

    def create_or_get_supplier(
        self,
        supplier_data: Dict[str, Any],
        auto_merge: bool = False
    ) -> Tuple[Supplier, bool, Dict[str, Any]]:
        """
        Cria novo fornecedor ou retorna existente baseado em matching

        Args:
            supplier_data: Dados do fornecedor
            auto_merge: Se deve fazer merge automático

        Returns:
            Tupla (supplier, is_new, matching_info)
        """

        supplier_name = supplier_data.get('name', '')
        supplier_cnpj = supplier_data.get('cnpj', '')

        # Procura correspondências
        matches = self.find_matching_suppliers(supplier_name, supplier_cnpj, limit=1)

        # Se encontrou correspondência com score alto
        if matches and matches[0]['score'] >= (85 if auto_merge else self.excellent_score):
            existing_supplier = self.db.query(Supplier).filter(
                Supplier.id == matches[0]['supplier_id']
            ).first()

            if existing_supplier:
                # Atualiza dados se necessário
                updated_fields = self._update_supplier_if_needed(existing_supplier, supplier_data)

                matching_info = {
                    'matched': True,
                    'match_score': matches[0]['score'],
                    'match_reason': matches[0]['match_reason'],
                    'updated_fields': updated_fields
                }

                return existing_supplier, False, matching_info

        # Cria novo fornecedor
        new_supplier = Supplier(
            name=supplier_name,
            cnpj=supplier_cnpj,
            category=supplier_data.get('category'),
            email=supplier_data.get('email'),
            phone=supplier_data.get('phone'),
            address=supplier_data.get('address'),
            city=supplier_data.get('city'),
            state=supplier_data.get('state'),
            postal_code=supplier_data.get('postal_code'),
            notes=supplier_data.get('notes')
        )

        self.db.add(new_supplier)
        self.db.commit()
        self.db.refresh(new_supplier)

        # Limpa cache
        self._clear_cache()

        matching_info = {
            'matched': False,
            'potential_matches': matches[:3] if matches else [],
            'created_new': True
        }

        return new_supplier, True, matching_info

    def _get_suppliers_cache(self) -> List[Dict[str, Any]]:
        """Obtém fornecedores do cache ou carrega do banco"""

        if self._suppliers_cache is None:
            suppliers = self.db.query(Supplier).filter(Supplier.is_active == True).all()

            self._suppliers_cache = []
            self._suppliers_normalized_cache = {}

            for supplier in suppliers:
                supplier_dict = {
                    'supplier_id': supplier.id,
                    'name': supplier.name,
                    'cnpj': supplier.cnpj,
                    'category': supplier.category,
                    'normalized_name': self._normalize_text(supplier.name)
                }

                self._suppliers_cache.append(supplier_dict)
                self._suppliers_normalized_cache[supplier.id] = supplier_dict

        return self._suppliers_cache

    def _find_by_cnpj(self, cnpj: str, suppliers: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Busca fornecedor por CNPJ exato"""

        if not cnpj:
            return None

        # Normaliza CNPJ (remove formatação)
        clean_cnpj = re.sub(r'\D', '', cnpj)

        for supplier in suppliers:
            supplier_cnpj = supplier.get('cnpj', '')
            if supplier_cnpj:
                clean_supplier_cnpj = re.sub(r'\D', '', supplier_cnpj)

                if clean_cnpj == clean_supplier_cnpj:
                    return {
                        'supplier_id': supplier['supplier_id'],
                        'name': supplier['name'],
                        'cnpj': supplier['cnpj'],
                        'category': supplier['category'],
                        'score': 100,
                        'match_reason': 'CNPJ exato',
                        'match_type': 'exact_cnpj'
                    }

        return None

    def _fuzzy_match_by_name(
        self,
        target_name: str,
        suppliers: List[Dict[str, Any]],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Realiza fuzzy matching por nome"""

        if not target_name:
            return []

        normalized_target = self._normalize_text(target_name)

        # Lista de nomes para matching
        supplier_names = [supplier['normalized_name'] for supplier in suppliers]

        # Fuzzy matching usando diferentes algoritmos
        matches = []

        # 1. Ratio simples
        ratio_matches = process.extract(
            normalized_target,
            supplier_names,
            scorer=fuzz.ratio,
            limit=limit * 2
        )

        # 2. Token sort ratio (ignora ordem das palavras)
        token_sort_matches = process.extract(
            normalized_target,
            supplier_names,
            scorer=fuzz.token_sort_ratio,
            limit=limit * 2
        )

        # 3. Partial ratio (substring matching)
        partial_matches = process.extract(
            normalized_target,
            supplier_names,
            scorer=fuzz.partial_ratio,
            limit=limit * 2
        )

        # Combina resultados
        all_matches = {}

        for match_list, method in [
            (ratio_matches, 'ratio'),
            (token_sort_matches, 'token_sort'),
            (partial_matches, 'partial')
        ]:
            for name, score in match_list:
                if score >= self.min_score:
                    # Encontra fornecedor original
                    supplier = next((s for s in suppliers if s['normalized_name'] == name), None)

                    if supplier:
                        supplier_id = supplier['supplier_id']

                        if supplier_id not in all_matches or all_matches[supplier_id]['score'] < score:
                            all_matches[supplier_id] = {
                                'supplier_id': supplier_id,
                                'name': supplier['name'],
                                'cnpj': supplier['cnpj'],
                                'category': supplier['category'],
                                'score': score,
                                'match_reason': f'Fuzzy matching ({method})',
                                'match_type': f'fuzzy_{method}'
                            }

        # Ordena por score e limita resultados
        sorted_matches = sorted(all_matches.values(), key=lambda x: x['score'], reverse=True)

        return sorted_matches[:limit]

    def _find_in_invoice_history(
        self,
        supplier_name: str,
        supplier_cnpj: str,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Busca em histórico de faturas"""

        try:
            # Busca faturas com nomes similares
            invoices_query = self.db.query(Invoice).filter(Invoice.supplier_name.isnot(None))

            if supplier_cnpj:
                # Primeiro tenta por CNPJ
                clean_cnpj = re.sub(r'\D', '', supplier_cnpj)
                cnpj_invoices = invoices_query.filter(
                    Invoice.supplier_cnpj.isnot(None)
                ).all()

                for invoice in cnpj_invoices:
                    if invoice.supplier_cnpj:
                        clean_invoice_cnpj = re.sub(r'\D', '', invoice.supplier_cnpj)
                        if clean_cnpj == clean_invoice_cnpj:
                            return [{
                                'supplier_id': None,
                                'name': invoice.supplier_name,
                                'cnpj': invoice.supplier_cnpj,
                                'category': invoice.category,
                                'score': 100,
                                'match_reason': 'Histórico de faturas (CNPJ)',
                                'match_type': 'historical_cnpj',
                                'invoice_count': self._count_invoices_for_supplier(invoice.supplier_name, invoice.supplier_cnpj)
                            }]

            # Fuzzy matching em nomes de faturas
            all_invoices = invoices_query.all()
            unique_suppliers = {}

            for invoice in all_invoices:
                key = f"{invoice.supplier_name}|{invoice.supplier_cnpj or ''}"
                if key not in unique_suppliers:
                    unique_suppliers[key] = {
                        'name': invoice.supplier_name,
                        'cnpj': invoice.supplier_cnpj,
                        'category': invoice.category,
                        'count': 0
                    }
                unique_suppliers[key]['count'] += 1

            # Aplica fuzzy matching nos nomes únicos
            supplier_names = [data['name'] for data in unique_suppliers.values()]
            normalized_target = self._normalize_text(supplier_name)

            fuzzy_matches = process.extract(
                normalized_target,
                supplier_names,
                scorer=fuzz.token_sort_ratio,
                limit=limit
            )

            results = []
            for name, score in fuzzy_matches:
                if score >= self.min_score:
                    # Encontra dados do fornecedor
                    supplier_data = next(
                        (data for data in unique_suppliers.values() if data['name'] == name),
                        None
                    )

                    if supplier_data:
                        results.append({
                            'supplier_id': None,
                            'name': supplier_data['name'],
                            'cnpj': supplier_data['cnpj'],
                            'category': supplier_data['category'],
                            'score': score,
                            'match_reason': f'Histórico de faturas ({supplier_data["count"]} faturas)',
                            'match_type': 'historical_fuzzy',
                            'invoice_count': supplier_data['count']
                        })

            return results

        except Exception as e:
            logger.error(f"Erro na busca do histórico: {e}")
            return []

    def _count_invoices_for_supplier(self, name: str, cnpj: str = None) -> int:
        """Conta faturas para um fornecedor"""
        query = self.db.query(Invoice).filter(Invoice.supplier_name == name)

        if cnpj:
            query = query.filter(Invoice.supplier_cnpj == cnpj)

        return query.count()

    def _deduplicate_and_rank(
        self,
        matches: List[Dict[str, Any]],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Remove duplicatas e ordena por relevância"""

        # Remove duplicatas por supplier_id ou por nome/cnpj
        seen = set()
        unique_matches = []

        for match in matches:
            # Chave única para o fornecedor
            if match.get('supplier_id'):
                key = f"id_{match['supplier_id']}"
            else:
                key = f"data_{match.get('name', '')}_{match.get('cnpj', '')}"

            if key not in seen:
                seen.add(key)
                unique_matches.append(match)

        # Ordena por score, depois por tipo de match, depois por contagem de faturas
        def sort_key(match):
            score = match['score']
            match_type_priority = {
                'exact_cnpj': 1000,
                'fuzzy_ratio': 100,
                'fuzzy_token_sort': 90,
                'fuzzy_partial': 80,
                'historical_cnpj': 70,
                'historical_fuzzy': 60
            }

            type_score = match_type_priority.get(match.get('match_type', ''), 0)
            invoice_count = match.get('invoice_count', 0)

            return (score, type_score, invoice_count)

        sorted_matches = sorted(unique_matches, key=sort_key, reverse=True)

        return sorted_matches[:limit]

    def _normalize_text(self, text: str) -> str:
        """Normaliza texto para matching"""
        if not text:
            return ""

        # Remove acentos
        normalized = unicodedata.normalize('NFD', text)
        normalized = normalized.encode('ascii', 'ignore').decode('utf-8')

        # Converte para minúsculo
        normalized = normalized.lower()

        # Remove caracteres especiais exceto espaços
        normalized = re.sub(r'[^\w\s]', '', normalized)

        # Remove espaços extras
        normalized = re.sub(r'\s+', ' ', normalized).strip()

        # Remove palavras comuns que podem atrapalhar o matching
        stop_words = ['ltda', 'ltd', 'me', 'eireli', 'epp', 'cia', 'sa', 'comercial', 'servicos']
        words = normalized.split()
        filtered_words = [word for word in words if word not in stop_words]

        return ' '.join(filtered_words) if filtered_words else normalized

    def _update_supplier_if_needed(
        self,
        supplier: Supplier,
        new_data: Dict[str, Any]
    ) -> List[str]:
        """Atualiza fornecedor com novos dados se necessário"""

        updated_fields = []

        # Campos que podem ser atualizados
        updatable_fields = {
            'email': 'email',
            'phone': 'phone',
            'address': 'address',
            'city': 'city',
            'state': 'state',
            'postal_code': 'postal_code',
            'category': 'category'
        }

        for field, attr in updatable_fields.items():
            new_value = new_data.get(field)
            current_value = getattr(supplier, attr)

            # Atualiza se o novo valor existe e o atual está vazio
            if new_value and not current_value:
                setattr(supplier, attr, new_value)
                updated_fields.append(field)

        if updated_fields:
            self.db.commit()
            logger.info(f"Fornecedor {supplier.name} atualizado: {updated_fields}")

        return updated_fields

    def _clear_cache(self):
        """Limpa cache de fornecedores"""
        self._suppliers_cache = None
        self._suppliers_normalized_cache = None

    def get_supplier_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas dos fornecedores"""

        try:
            total_suppliers = self.db.query(Supplier).count()
            active_suppliers = self.db.query(Supplier).filter(Supplier.is_active == True).count()
            suppliers_with_cnpj = self.db.query(Supplier).filter(Supplier.cnpj.isnot(None)).count()

            # Estatísticas de faturas
            total_invoices = self.db.query(Invoice).count()
            unique_supplier_names = self.db.query(Invoice.supplier_name).distinct().count()

            return {
                'total_suppliers': total_suppliers,
                'active_suppliers': active_suppliers,
                'suppliers_with_cnpj': suppliers_with_cnpj,
                'total_invoices': total_invoices,
                'unique_supplier_names': unique_supplier_names,
                'potential_duplicates': unique_supplier_names - total_suppliers
            }

        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {e}")
            return {}