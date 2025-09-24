import re
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
import unicodedata

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataCleaner:
    """
    Serviço para limpeza e formatação de dados extraídos de documentos
    """

    def __init__(self):
        """Inicializa o limpador de dados"""
        # Padrões regex para diferentes tipos de dados
        self.cnpj_pattern = re.compile(r'(\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2})')
        self.cpf_pattern = re.compile(r'(\d{3}\.?\d{3}\.?\d{3}-?\d{2})')
        self.phone_pattern = re.compile(r'(\(?[\d\s\-\+\(\)]{8,}\)?)')
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        self.money_pattern = re.compile(r'R?\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)')

        # Palavras de parada para limpeza de texto
        self.stop_words = {
            'ltda', 'ltd', 'me', 'eireli', 'epp', 'cia', 'companhi', 's/a', 'sa',
            'comercial', 'industrial', 'servicos', 'prestadora', 'empresa'
        }

        logger.info("DataCleaner inicializado")

    def clean_extracted_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Limpa e formata todos os dados extraídos

        Args:
            raw_data: Dados brutos extraídos

        Returns:
            Dados limpos e formatados
        """

        try:
            cleaned_data = {
                'supplier_name': self.clean_supplier_name(raw_data.get('supplier_name', '')),
                'supplier_cnpj': self.clean_cnpj(raw_data.get('supplier_cnpj', '')),
                'invoice_number': self.clean_invoice_number(raw_data.get('invoice_number', '')),
                'issue_date': self.clean_date(raw_data.get('issue_date', '')),
                'due_date': self.clean_date(raw_data.get('due_date', '')),
                'total_amount': self.clean_monetary_value(raw_data.get('total_amount', 0)),
                'tax_amount': self.clean_monetary_value(raw_data.get('tax_amount', 0)),
                'net_amount': 0.0,  # Será calculado após limpeza
                'description': self.clean_description(raw_data.get('description', '')),
                'category': self.clean_category(raw_data.get('category', '')),
                'payment_method': self.clean_payment_method(raw_data.get('payment_method', '')),
                'items': self.clean_items_list(raw_data.get('items', [])),
                'confidence_score': self.validate_confidence_score(raw_data.get('confidence_score', 0)),
                'ai_suggestions': self.clean_suggestions(raw_data.get('ai_suggestions', []))
            }

            # Calcula net_amount após limpeza dos valores
            cleaned_data['net_amount'] = max(0, cleaned_data['total_amount'] - cleaned_data['tax_amount'])

            # Valida consistência dos dados
            cleaned_data = self._validate_data_consistency(cleaned_data)

            # Adiciona sugestões de qualidade
            cleaned_data['ai_suggestions'].extend(self._generate_quality_suggestions(cleaned_data))

            logger.info(f"Dados limpos com sucesso. Confiança: {cleaned_data['confidence_score']:.2f}")

            return cleaned_data

        except Exception as e:
            logger.error(f"Erro na limpeza dos dados: {e}")
            return self._create_fallback_cleaned_data(raw_data, str(e))

    def clean_supplier_name(self, supplier_name: str) -> str:
        """Limpa e formata nome do fornecedor"""
        if not supplier_name or not isinstance(supplier_name, str):
            return ""

        # Remove caracteres especiais e normaliza unicode
        cleaned = unicodedata.normalize('NFKD', supplier_name.strip())

        # Remove quebras de linha e espaços extras
        cleaned = re.sub(r'\s+', ' ', cleaned)

        # Remove caracteres não alfanuméricos exceto espaços e alguns símbolos
        cleaned = re.sub(r'[^\w\s\-&\.]', '', cleaned)

        # Converte para title case mantendo siglas
        words = cleaned.split()
        formatted_words = []

        for word in words:
            word_lower = word.lower()

            # Mantém siglas em maiúsculo
            if len(word) <= 3 and word.isupper():
                formatted_words.append(word)
            # Não formata palavras de parada
            elif word_lower in self.stop_words:
                formatted_words.append(word_lower.upper())
            # Formata palavras normais
            else:
                formatted_words.append(word.title())

        result = ' '.join(formatted_words)

        # Limita tamanho
        return result[:200] if len(result) > 200 else result

    def clean_cnpj(self, cnpj: str) -> str:
        """Limpa e formata CNPJ"""
        if not cnpj or not isinstance(cnpj, str):
            return ""

        # Remove tudo exceto números
        numbers_only = re.sub(r'\D', '', str(cnpj))

        # Valida se tem 14 dígitos
        if len(numbers_only) != 14:
            # Tenta encontrar CNPJ no texto
            match = self.cnpj_pattern.search(cnpj)
            if match:
                numbers_only = re.sub(r'\D', '', match.group(1))

        if len(numbers_only) == 14:
            # Valida CNPJ básico (verificação de dígitos seria mais complexa)
            if self._is_valid_cnpj_format(numbers_only):
                return f"{numbers_only[:2]}.{numbers_only[2:5]}.{numbers_only[5:8]}/{numbers_only[8:12]}-{numbers_only[12:14]}"

        return ""

    def clean_invoice_number(self, invoice_number: str) -> str:
        """Limpa e formata número da nota fiscal"""
        if not invoice_number or not isinstance(invoice_number, str):
            return ""

        # Remove espaços e normaliza
        cleaned = str(invoice_number).strip().upper()

        # Remove caracteres especiais exceto números, letras e alguns símbolos
        cleaned = re.sub(r'[^\w\-/.]', '', cleaned)

        # Limita tamanho
        return cleaned[:50] if len(cleaned) > 50 else cleaned

    def clean_date(self, date_str: str) -> str:
        """Limpa e formata data para padrão YYYY-MM-DD"""
        if not date_str or not isinstance(date_str, str):
            return ""

        # Remove espaços e caracteres extras
        cleaned = re.sub(r'[^\d/\-.]', '', str(date_str).strip())

        if not cleaned:
            return ""

        # Diferentes padrões de data brasileira
        date_patterns = [
            r'(\d{2})[/\-.](\d{2})[/\-.](\d{4})',  # DD/MM/YYYY
            r'(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})',  # D/M/YYYY
            r'(\d{4})[/\-.](\d{2})[/\-.](\d{2})',  # YYYY/MM/DD
            r'(\d{2})(\d{2})(\d{4})',  # DDMMYYYY
        ]

        for pattern in date_patterns:
            match = re.search(pattern, cleaned)
            if match:
                try:
                    if len(match.group(3)) == 4:  # Ano com 4 dígitos
                        day, month, year = match.groups()

                        # Se primeiro grupo é ano (4 dígitos)
                        if len(match.group(1)) == 4:
                            year, month, day = match.groups()

                        # Valida data
                        date_obj = datetime.strptime(f"{year}-{month:0>2}-{day:0>2}", "%Y-%m-%d")

                        # Verifica se a data faz sentido (não muito antiga ou futura)
                        current_year = datetime.now().year
                        if 1990 <= date_obj.year <= current_year + 10:
                            return date_obj.strftime("%Y-%m-%d")

                except ValueError:
                    continue

        return ""

    def clean_monetary_value(self, value: Any) -> float:
        """Limpa e converte valor monetário para float"""
        if value is None:
            return 0.0

        # Se já é número
        if isinstance(value, (int, float)):
            return max(0.0, float(value))

        # Se é string, limpa e converte
        if isinstance(value, str):
            # Remove símbolos de moeda e espaços
            cleaned = re.sub(r'[R$\s]', '', value.strip())

            # Tenta diferentes formatos brasileiros
            try:
                # Formato com pontos como milhares e vírgula como decimal (1.234.567,89)
                if ',' in cleaned and '.' in cleaned:
                    # Remove pontos (milhares) e substitui vírgula por ponto
                    cleaned = cleaned.replace('.', '').replace(',', '.')

                # Formato só com vírgula (1234,89)
                elif ',' in cleaned and '.' not in cleaned:
                    cleaned = cleaned.replace(',', '.')

                # Formato americano ou já limpo
                result = float(cleaned) if cleaned else 0.0
                return max(0.0, result)

            except ValueError:
                # Tenta extrair números usando regex
                numbers = re.findall(r'\d+', str(value))
                if numbers:
                    # Une os números e tenta converter
                    try:
                        result = float(''.join(numbers)) / 100  # Assume últimos 2 dígitos como centavos
                        return max(0.0, result)
                    except ValueError:
                        pass

        return 0.0

    def clean_description(self, description: str) -> str:
        """Limpa e formata descrição"""
        if not description or not isinstance(description, str):
            return ""

        # Normaliza unicode e remove quebras de linha excessivas
        cleaned = unicodedata.normalize('NFKD', description.strip())
        cleaned = re.sub(r'\s+', ' ', cleaned)

        # Remove caracteres de controle
        cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', cleaned)

        # Capitaliza primeira letra
        if cleaned:
            cleaned = cleaned[0].upper() + cleaned[1:] if len(cleaned) > 1 else cleaned.upper()

        # Limita tamanho
        return cleaned[:500] if len(cleaned) > 500 else cleaned

    def clean_category(self, category: str) -> str:
        """Limpa e normaliza categoria"""
        if not category or not isinstance(category, str):
            return "Outros"

        # Normaliza e limpa
        cleaned = unicodedata.normalize('NFKD', category.strip()).title()
        cleaned = re.sub(r'[^\w\s]', '', cleaned)

        # Mapeamento de categorias conhecidas
        category_mapping = {
            'servico': 'Serviços',
            'servicos': 'Serviços',
            'material': 'Materiais',
            'materiais': 'Materiais',
            'escritorio': 'Material de Escritório',
            'office': 'Material de Escritório',
            'consultoria': 'Consultoria',
            'manutencao': 'Manutenção',
            'equipamento': 'Equipamentos',
            'equipamentos': 'Equipamentos',
            'software': 'Software',
            'licenca': 'Licenças',
            'licencas': 'Licenças'
        }

        cleaned_lower = cleaned.lower()
        for key, value in category_mapping.items():
            if key in cleaned_lower:
                return value

        return cleaned if cleaned else "Outros"

    def clean_payment_method(self, payment_method: str) -> str:
        """Limpa e normaliza forma de pagamento"""
        if not payment_method or not isinstance(payment_method, str):
            return ""

        # Normaliza
        cleaned = payment_method.strip().upper()

        # Mapeamento de formas de pagamento
        payment_mapping = {
            'PIX': ['PIX', 'CHAVE PIX'],
            'Boleto': ['BOLETO', 'BOLETO BANCARIO', 'BOLETO BANCÁRIO'],
            'TED': ['TED', 'TRANSFERENCIA ELETRONICA'],
            'DOC': ['DOC'],
            'Cartão': ['CARTAO', 'CARTÃO', 'CARD'],
            'Dinheiro': ['DINHEIRO', 'CASH', 'ESPECIE'],
            'Cheque': ['CHEQUE']
        }

        for standard_method, variations in payment_mapping.items():
            for variation in variations:
                if variation in cleaned:
                    return standard_method

        # Remove caracteres especiais
        cleaned = re.sub(r'[^\w\s]', '', cleaned).title()
        return cleaned[:50] if len(cleaned) > 50 else cleaned

    def clean_items_list(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Limpa lista de itens"""
        if not items or not isinstance(items, list):
            return []

        cleaned_items = []

        for item in items:
            if not isinstance(item, dict):
                continue

            cleaned_item = {
                'description': self.clean_description(item.get('description', '')),
                'quantity': self.clean_quantity(item.get('quantity', 1)),
                'unit_price': self.clean_monetary_value(item.get('unit_price', 0)),
                'total_price': self.clean_monetary_value(item.get('total_price', 0))
            }

            # Valida se item tem dados mínimos
            if cleaned_item['description'] or cleaned_item['total_price'] > 0:
                # Calcula total_price se não fornecido mas temos quantidade e preço unitário
                if cleaned_item['total_price'] == 0 and cleaned_item['quantity'] > 0 and cleaned_item['unit_price'] > 0:
                    cleaned_item['total_price'] = cleaned_item['quantity'] * cleaned_item['unit_price']

                # Calcula unit_price se não fornecido
                elif cleaned_item['unit_price'] == 0 and cleaned_item['quantity'] > 0 and cleaned_item['total_price'] > 0:
                    cleaned_item['unit_price'] = cleaned_item['total_price'] / cleaned_item['quantity']

                cleaned_items.append(cleaned_item)

        return cleaned_items

    def clean_quantity(self, quantity: Any) -> int:
        """Limpa e converte quantidade para inteiro"""
        if isinstance(quantity, (int, float)):
            return max(1, int(quantity))

        if isinstance(quantity, str):
            # Remove caracteres não numéricos
            numbers = re.sub(r'\D', '', quantity.strip())
            if numbers:
                try:
                    return max(1, int(numbers))
                except ValueError:
                    pass

        return 1

    def clean_suggestions(self, suggestions: List[str]) -> List[str]:
        """Limpa lista de sugestões"""
        if not suggestions or not isinstance(suggestions, list):
            return []

        cleaned_suggestions = []
        for suggestion in suggestions:
            if isinstance(suggestion, str) and suggestion.strip():
                cleaned = suggestion.strip()[:200]  # Limita tamanho
                if cleaned not in cleaned_suggestions:  # Remove duplicatas
                    cleaned_suggestions.append(cleaned)

        return cleaned_suggestions

    def validate_confidence_score(self, score: Any) -> float:
        """Valida e normaliza score de confiança"""
        try:
            if isinstance(score, (int, float)):
                return max(0.0, min(1.0, float(score)))
            elif isinstance(score, str):
                return max(0.0, min(1.0, float(score)))
        except (ValueError, TypeError):
            pass

        return 0.0

    def _is_valid_cnpj_format(self, cnpj: str) -> bool:
        """Validação básica de formato de CNPJ"""
        if len(cnpj) != 14:
            return False

        # Verifica se não são todos os mesmos dígitos
        if cnpj == cnpj[0] * 14:
            return False

        # Aqui poderia implementar validação de dígito verificador
        # Por simplicidade, apenas verifica se é numérico e não repetitivo
        return cnpj.isdigit()

    def _validate_data_consistency(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida consistência entre os dados"""

        # Valida se total_amount >= tax_amount
        if data['tax_amount'] > data['total_amount']:
            data['tax_amount'] = 0.0
            data['net_amount'] = data['total_amount']
            data['ai_suggestions'].append("Valor de impostos maior que total - corrigido automaticamente")

        # Valida se soma dos itens confere com total
        items_total = sum(item['total_price'] for item in data['items'])
        if items_total > 0 and abs(items_total - data['total_amount']) > 0.01:
            data['ai_suggestions'].append(f"Divergência entre soma dos itens (R$ {items_total:.2f}) e valor total")

        # Valida datas
        if data['issue_date'] and data['due_date']:
            try:
                issue_date = datetime.strptime(data['issue_date'], "%Y-%m-%d")
                due_date = datetime.strptime(data['due_date'], "%Y-%m-%d")

                if due_date < issue_date:
                    data['ai_suggestions'].append("Data de vencimento anterior à data de emissão")

            except ValueError:
                pass

        return data

    def _generate_quality_suggestions(self, data: Dict[str, Any]) -> List[str]:
        """Gera sugestões baseadas na qualidade dos dados"""
        suggestions = []

        # Verifica campos obrigatórios faltando
        required_fields = {
            'supplier_name': 'Nome do fornecedor',
            'supplier_cnpj': 'CNPJ do fornecedor',
            'invoice_number': 'Número da nota fiscal',
            'total_amount': 'Valor total'
        }

        for field, description in required_fields.items():
            if not data.get(field) or (isinstance(data[field], (int, float)) and data[field] == 0):
                suggestions.append(f"{description} não identificado - preencha manualmente")

        # Verifica qualidade dos dados
        if data['total_amount'] > 0 and not data['items']:
            suggestions.append("Nenhum item detalhado encontrado - adicione os itens manualmente")

        if data['confidence_score'] < 0.7:
            suggestions.append("Baixa confiança na extração - recomenda-se revisão manual")

        return suggestions

    def _create_fallback_cleaned_data(self, raw_data: Dict[str, Any], error: str) -> Dict[str, Any]:
        """Cria dados limpos de fallback em caso de erro"""
        return {
            'supplier_name': '',
            'supplier_cnpj': '',
            'invoice_number': '',
            'issue_date': '',
            'due_date': '',
            'total_amount': 0.0,
            'tax_amount': 0.0,
            'net_amount': 0.0,
            'description': '',
            'category': 'Outros',
            'payment_method': '',
            'items': [],
            'confidence_score': 0.0,
            'ai_suggestions': [
                f"Erro na limpeza dos dados: {error}",
                "Dados requerem preenchimento manual"
            ]
        }

    def get_cleaning_stats(self, original_data: Dict[str, Any], cleaned_data: Dict[str, Any]) -> Dict[str, Any]:
        """Retorna estatísticas da limpeza"""

        fields_cleaned = 0
        fields_total = 0

        for field in ['supplier_name', 'supplier_cnpj', 'invoice_number', 'issue_date', 'due_date', 'total_amount']:
            fields_total += 1
            original_value = original_data.get(field)
            cleaned_value = cleaned_data.get(field)

            # Conta como limpo se tem valor válido
            if cleaned_value and (not isinstance(cleaned_value, (int, float)) or cleaned_value > 0):
                fields_cleaned += 1

        return {
            'fields_cleaned': fields_cleaned,
            'fields_total': fields_total,
            'cleaning_percentage': (fields_cleaned / fields_total * 100) if fields_total > 0 else 0,
            'items_count': len(cleaned_data.get('items', [])),
            'suggestions_count': len(cleaned_data.get('ai_suggestions', []))
        }