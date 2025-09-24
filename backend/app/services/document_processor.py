import os
import logging
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
from datetime import datetime
from PIL import Image
import numpy as np
from pdf2image import convert_from_path
import cv2
import tempfile

from app.services.layout_lm_service import LayoutLMService
from app.services.ai_service import AIService
from app.services.data_cleaner import DataCleaner
from app.services.supplier_matcher import SupplierMatcher
from app.utils.file_utils import FileUtils
from app.core.config import settings
from app.core.database import get_db

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentProcessor:
    """
    Serviço unificado para processamento de documentos (PDFs e imagens)
    Converte PDFs para imagem e aplica modelos de IA para extração de dados
    """

    def __init__(self, db_session=None):
        """Inicializa o processador de documentos"""
        self.layout_lm_service = LayoutLMService()
        self.ai_service = AIService()
        self.file_utils = FileUtils()
        self.data_cleaner = DataCleaner()
        self.db_session = db_session  # Opcional para fuzzy matching

        # Configurações
        self.use_layout_lm = os.getenv("USE_LAYOUT_LM", "true").lower() == "true"
        self.pdf_dpi = int(os.getenv("PDF_DPI", "300"))
        self.max_pages = int(os.getenv("MAX_PDF_PAGES", "5"))

        # Extensões suportadas
        self.supported_pdf_extensions = ['.pdf']
        self.supported_image_extensions = ['.jpg', '.jpeg', '.png', '.tiff', '.bmp']

        logger.info("DocumentProcessor inicializado")

    async def process_document(self, file_path: str, original_filename: str) -> Dict[str, Any]:
        """
        Função principal para processar qualquer tipo de documento suportado

        Args:
            file_path: Caminho para o arquivo
            original_filename: Nome original do arquivo

        Returns:
            Dict com dados extraídos e metadados do processamento
        """

        try:
            # Valida se o arquivo existe
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")

            file_extension = Path(file_path).suffix.lower()

            # Log do início do processamento
            logger.info(f"Iniciando processamento de {original_filename} ({file_extension})")

            # Determina o método de processamento
            if file_extension in self.supported_pdf_extensions:
                return await self._process_pdf_document(file_path, original_filename)
            elif file_extension in self.supported_image_extensions:
                return await self._process_image_document(file_path, original_filename)
            else:
                raise ValueError(f"Tipo de arquivo não suportado: {file_extension}")

        except Exception as e:
            logger.error(f"Erro no processamento do documento {original_filename}: {e}")
            return self._create_error_response(str(e), original_filename, file_path)

    async def _process_pdf_document(self, file_path: str, original_filename: str) -> Dict[str, Any]:
        """
        Processa documento PDF convertendo para imagens e aplicando IA

        Args:
            file_path: Caminho para o PDF
            original_filename: Nome original do arquivo

        Returns:
            Dict com dados extraídos
        """

        try:
            logger.info(f"Convertendo PDF para imagens: {original_filename}")

            # Converte PDF para imagens com DPI configurável
            images = convert_from_path(
                file_path,
                dpi=self.pdf_dpi,
                first_page=1,
                last_page=self.max_pages,
                fmt='RGB'
            )

            if not images:
                raise ValueError("Não foi possível extrair páginas do PDF")

            logger.info(f"PDF convertido: {len(images)} página(s) extraída(s)")

            # Processa cada página como imagem
            processed_pages = []

            for page_num, image in enumerate(images, 1):
                logger.info(f"Processando página {page_num}/{len(images)}")

                # Salva imagem temporária se necessário para debugging
                temp_image_path = None
                if os.getenv("DEBUG_SAVE_IMAGES", "false").lower() == "true":
                    temp_image_path = await self._save_temp_image(image, original_filename, page_num)

                # Processa a imagem da página
                page_result = await self._process_single_image(
                    image,
                    f"{original_filename}_page_{page_num}",
                    temp_image_path
                )

                page_result['page_number'] = page_num
                processed_pages.append(page_result)

            # Combina resultados de todas as páginas
            combined_result = self._combine_pdf_pages(processed_pages)

            # Limpa e formata os dados extraídos
            if combined_result.get('success') and combined_result.get('extracted_data'):
                logger.info(f"Limpando dados extraídos do PDF: {original_filename}")
                raw_data = combined_result['extracted_data']
                cleaned_data = self.data_cleaner.clean_extracted_data(raw_data)

                # Atualiza resultado com dados limpos
                combined_result['extracted_data'] = cleaned_data

                # Adiciona estatísticas de limpeza
                cleaning_stats = self.data_cleaner.get_cleaning_stats(raw_data, cleaned_data)
                combined_result['cleaning_stats'] = cleaning_stats

                # Fuzzy matching para sugerir fornecedores
                if self.db_session:
                    supplier_suggestions = self._suggest_suppliers(cleaned_data)
                    combined_result['supplier_suggestions'] = supplier_suggestions

            # Adiciona metadados do PDF
            combined_result.update({
                'original_filename': original_filename,
                'file_type': 'pdf',
                'total_pages': len(images),
                'processing_method': 'PDF_to_Image_Pipeline',
                'pdf_dpi': self.pdf_dpi,
                'processed_at': datetime.now().isoformat()
            })

            return combined_result

        except Exception as e:
            logger.error(f"Erro no processamento do PDF {original_filename}: {e}")
            return self._create_error_response(str(e), original_filename, file_path, 'pdf')

    async def _process_image_document(self, file_path: str, original_filename: str) -> Dict[str, Any]:
        """
        Processa documento de imagem aplicando IA

        Args:
            file_path: Caminho para a imagem
            original_filename: Nome original do arquivo

        Returns:
            Dict com dados extraídos
        """

        try:
            logger.info(f"Carregando imagem: {original_filename}")

            # Carrega e valida a imagem
            image = Image.open(file_path).convert('RGB')

            # Valida dimensões mínimas
            min_width, min_height = 100, 100
            if image.size[0] < min_width or image.size[1] < min_height:
                raise ValueError(f"Imagem muito pequena: {image.size}. Mínimo: {min_width}x{min_height}")

            logger.info(f"Imagem carregada: {image.size[0]}x{image.size[1]} pixels")

            # Processa a imagem
            result = await self._process_single_image(image, original_filename, file_path)

            # Limpa e formata os dados extraídos
            if result.get('success') and result.get('extracted_data'):
                logger.info(f"Limpando dados extraídos da imagem: {original_filename}")
                raw_data = result['extracted_data']
                cleaned_data = self.data_cleaner.clean_extracted_data(raw_data)

                # Atualiza resultado com dados limpos
                result['extracted_data'] = cleaned_data

                # Adiciona estatísticas de limpeza
                cleaning_stats = self.data_cleaner.get_cleaning_stats(raw_data, cleaned_data)
                result['cleaning_stats'] = cleaning_stats

                # Fuzzy matching para sugerir fornecedores
                if self.db_session:
                    supplier_suggestions = self._suggest_suppliers(cleaned_data)
                    result['supplier_suggestions'] = supplier_suggestions

            # Adiciona metadados da imagem
            result.update({
                'original_filename': original_filename,
                'file_type': 'image',
                'image_dimensions': image.size,
                'processing_method': 'Direct_Image_Pipeline',
                'processed_at': datetime.now().isoformat()
            })

            return result

        except Exception as e:
            logger.error(f"Erro no processamento da imagem {original_filename}: {e}")
            return self._create_error_response(str(e), original_filename, file_path, 'image')

    async def _process_single_image(self, image: Image.Image, identifier: str, image_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Processa uma única imagem usando LayoutLM ou fallback para IA tradicional

        Args:
            image: Imagem PIL
            identifier: Identificador da imagem
            image_path: Caminho da imagem (opcional)

        Returns:
            Dict com dados extraídos
        """

        try:
            # Tenta primeiro com LayoutLM se habilitado
            if self.use_layout_lm:
                try:
                    logger.info(f"Processando {identifier} com LayoutLM")

                    # Converte PIL para array numpy se necessário
                    if isinstance(image, Image.Image):
                        layout_result = await self.layout_lm_service._process_single_image(image, identifier)
                    else:
                        # Se já é um array, converte para PIL primeiro
                        pil_image = Image.fromarray(image.astype('uint8'), 'RGB')
                        layout_result = await self.layout_lm_service._process_single_image(pil_image, identifier)

                    # Verifica se o resultado do LayoutLM é confiável
                    confidence = layout_result.get('confidence_score', 0.0)

                    if layout_result.get('extracted_fields') and confidence > 0.3:
                        logger.info(f"LayoutLM bem-sucedido para {identifier} (confiança: {confidence:.2f})")
                        return self._format_layout_result(layout_result, identifier)
                    else:
                        logger.info(f"LayoutLM com baixa confiança para {identifier} (confiança: {confidence:.2f})")

                except Exception as e:
                    logger.warning(f"Erro no LayoutLM para {identifier}, usando fallback: {e}")

            # Fallback para processamento tradicional com OCR + IA
            logger.info(f"Usando processamento tradicional para {identifier}")

            # Extrai texto da imagem usando OCR
            extracted_text = await self._extract_text_from_image(image)

            if not extracted_text or len(extracted_text.strip()) < 10:
                raise ValueError("Texto insuficiente extraído da imagem")

            # Processa com IA tradicional
            ai_result = await self._process_with_traditional_ai(extracted_text, identifier)

            return ai_result

        except Exception as e:
            logger.error(f"Erro no processamento da imagem {identifier}: {e}")
            return {
                'success': False,
                'error': str(e),
                'confidence_score': 0.0,
                'extracted_data': {},
                'processing_method': 'failed'
            }

    async def _extract_text_from_image(self, image: Image.Image) -> str:
        """Extrai texto da imagem usando OCR"""
        try:
            # Usa o serviço AI existente para OCR
            # Cria arquivo temporário de forma segura
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
                temp_path = temp_file.name
                image.save(temp_path)

            try:
                text = await self.ai_service.ocr_image(temp_path)
                return text
            finally:
                # Remove arquivo temporário
                if os.path.exists(temp_path):
                    os.remove(temp_path)

        except Exception as e:
            logger.error(f"Erro na extração de texto: {e}")
            return ""

    async def _process_with_traditional_ai(self, text_content: str, identifier: str) -> Dict[str, Any]:
        """Processa texto extraído com IA tradicional"""

        try:
            # Usa o prompt de extração padrão
            extraction_prompt = self._build_extraction_prompt(text_content)

            # Chama a IA para extrair dados
            ai_response = await self.ai_service.extract_invoice_data(extraction_prompt)

            # Parse da resposta
            extracted_data = self._parse_ai_response(ai_response)

            return {
                'success': True,
                'extracted_data': extracted_data,
                'confidence_score': extracted_data.get('confidence_score', 0.5),
                'processing_method': 'Traditional_AI_OCR',
                'raw_text_length': len(text_content)
            }

        except Exception as e:
            logger.error(f"Erro no processamento tradicional para {identifier}: {e}")
            return {
                'success': False,
                'error': str(e),
                'confidence_score': 0.0,
                'extracted_data': {},
                'processing_method': 'failed'
            }

    def _build_extraction_prompt(self, text_content: str) -> str:
        """Constrói prompt para extração de dados"""
        return f"""
        Analise o texto da fatura a seguir e extraia os dados estruturados em formato JSON.

        TEXTO DA FATURA:
        {text_content}

        Extraia os seguintes dados no formato JSON exato:
        {{
            "supplier_name": "Nome completo do fornecedor",
            "supplier_cnpj": "CNPJ do fornecedor (apenas números)",
            "invoice_number": "Número da nota fiscal",
            "issue_date": "Data de emissão no formato YYYY-MM-DD",
            "due_date": "Data de vencimento no formato YYYY-MM-DD",
            "total_amount": 0.00,
            "tax_amount": 0.00,
            "net_amount": 0.00,
            "description": "Descrição dos produtos/serviços",
            "category": "Categoria inferida (ex: Material de Escritório, Serviços, etc)",
            "payment_method": "Forma de pagamento (PIX, Boleto, etc)",
            "items": [
                {{
                    "description": "Descrição do item",
                    "quantity": 1,
                    "unit_price": 0.00,
                    "total_price": 0.00
                }}
            ],
            "confidence_score": 0.95,
            "ai_suggestions": [
                "Sugestão para melhoria ou atenção"
            ]
        }}

        IMPORTANTE:
        - Use apenas dados presentes no texto
        - Se não encontrar algum dado, deixe em branco ou 0
        - As datas devem estar no formato YYYY-MM-DD
        - Valores devem ser números decimais
        - confidence_score deve ser entre 0 e 1
        - Retorne APENAS o JSON, sem texto adicional
        """

    def _parse_ai_response(self, ai_response: str) -> Dict[str, Any]:
        """Parse da resposta da IA"""
        import json

        try:
            # Remove possíveis caracteres extras e extrai JSON
            cleaned_response = ai_response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response.replace("```json", "").replace("```", "").strip()

            # Parse JSON
            data = json.loads(cleaned_response)
            return data

        except json.JSONDecodeError as e:
            logger.error(f"Erro no parse JSON da resposta da IA: {e}")
            # Retorna estrutura padrão em caso de erro
            return {
                "supplier_name": "",
                "supplier_cnpj": "",
                "invoice_number": "",
                "issue_date": "",
                "due_date": "",
                "total_amount": 0.0,
                "tax_amount": 0.0,
                "net_amount": 0.0,
                "description": "",
                "category": "",
                "payment_method": "",
                "items": [],
                "confidence_score": 0.1,
                "ai_suggestions": ["Erro no processamento da resposta da IA"]
            }

    async def _save_temp_image(self, image: Image.Image, original_filename: str, page_num: int) -> str:
        """Salva imagem temporária para debug"""
        try:
            # Usa diretório temporário do sistema
            temp_dir = os.path.join(tempfile.gettempdir(), "document_processing")
            os.makedirs(temp_dir, exist_ok=True)

            temp_filename = f"{Path(original_filename).stem}_page_{page_num}_{datetime.now().timestamp()}.png"
            temp_path = os.path.join(temp_dir, temp_filename)

            image.save(temp_path)
            logger.debug(f"Imagem temporária salva: {temp_path}")

            return temp_path
        except Exception as e:
            logger.error(f"Erro ao salvar imagem temporária: {e}")
            return None

    def _format_layout_result(self, layout_result: Dict[str, Any], identifier: str) -> Dict[str, Any]:
        """Formata resultado do LayoutLM para formato padrão"""

        extracted_fields = layout_result.get('extracted_fields', {})

        return {
            'success': True,
            'extracted_data': {
                'supplier_name': extracted_fields.get('supplier_name', ''),
                'supplier_cnpj': extracted_fields.get('supplier_cnpj', ''),
                'invoice_number': extracted_fields.get('invoice_number', ''),
                'issue_date': extracted_fields.get('issue_date', ''),
                'due_date': extracted_fields.get('due_date', ''),
                'total_amount': float(extracted_fields.get('total_amount', 0.0)),
                'tax_amount': float(extracted_fields.get('tax_amount', 0.0)),
                'net_amount': float(extracted_fields.get('total_amount', 0.0)) - float(extracted_fields.get('tax_amount', 0.0)),
                'description': self._generate_description_from_items(extracted_fields.get('items', [])),
                'category': self._infer_category_from_items(extracted_fields.get('items', [])),
                'payment_method': extracted_fields.get('payment_method', ''),
                'items': extracted_fields.get('items', []),
                'confidence_score': layout_result.get('confidence_score', 0.0),
                'ai_suggestions': [f"Processado com LayoutLM (confiança: {layout_result.get('confidence_score', 0.0):.2f})"]
            },
            'processing_method': 'LayoutLM',
            'confidence_score': layout_result.get('confidence_score', 0.0)
        }

    def _generate_description_from_items(self, items: list) -> str:
        """Gera descrição geral baseada nos itens extraídos"""
        if not items:
            return ""

        if len(items) == 1:
            return items[0].get("description", "")
        elif len(items) <= 3:
            descriptions = [item.get("description", "") for item in items if item.get("description")]
            return ", ".join(descriptions)
        else:
            return f"Múltiplos itens ({len(items)} produtos/serviços)"

    def _infer_category_from_items(self, items: list) -> str:
        """Infere categoria baseada nos itens"""
        if not items:
            return ""

        # Palavras-chave para categorização automática
        service_keywords = ["serviço", "consultoria", "manutenção", "instalação", "suporte"]
        material_keywords = ["material", "produto", "equipamento", "ferramenta"]
        office_keywords = ["papel", "caneta", "impressão", "escritório"]

        all_descriptions = " ".join([item.get("description", "").lower() for item in items])

        if any(keyword in all_descriptions for keyword in service_keywords):
            return "Serviços"
        elif any(keyword in all_descriptions for keyword in office_keywords):
            return "Material de Escritório"
        elif any(keyword in all_descriptions for keyword in material_keywords):
            return "Materiais"
        else:
            return "Outros"

    def _combine_pdf_pages(self, page_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Combina resultados de múltiplas páginas do PDF"""

        combined_data = {
            'supplier_name': '',
            'supplier_cnpj': '',
            'invoice_number': '',
            'issue_date': '',
            'due_date': '',
            'total_amount': 0.0,
            'tax_amount': 0.0,
            'net_amount': 0.0,
            'description': '',
            'category': '',
            'payment_method': '',
            'items': [],
            'confidence_score': 0.0,
            'ai_suggestions': []
        }

        # Coleta dados de todas as páginas
        all_confidences = []
        all_items = []

        for page_result in page_results:
            if not page_result.get('success'):
                continue

            page_data = page_result.get('extracted_data', {})
            confidence = page_result.get('confidence_score', 0.0)
            all_confidences.append(confidence)

            # Prioriza dados da página com maior confiança
            if confidence > combined_data['confidence_score']:
                for field in ['supplier_name', 'supplier_cnpj', 'invoice_number', 'issue_date', 'due_date', 'total_amount', 'tax_amount', 'payment_method']:
                    if page_data.get(field):
                        combined_data[field] = page_data[field]

            # Combina itens de todas as páginas
            if page_data.get('items'):
                all_items.extend(page_data['items'])

        # Finaliza dados combinados
        combined_data['items'] = all_items
        combined_data['confidence_score'] = np.mean(all_confidences) if all_confidences else 0.0
        combined_data['net_amount'] = combined_data['total_amount'] - combined_data['tax_amount']
        combined_data['description'] = self._generate_description_from_items(all_items)
        combined_data['category'] = self._infer_category_from_items(all_items)
        combined_data['ai_suggestions'] = [f"Processamento combinado de {len(page_results)} página(s)"]

        return {
            'success': len([r for r in page_results if r.get('success')]) > 0,
            'extracted_data': combined_data,
            'confidence_score': combined_data['confidence_score'],
            'processing_method': 'Multi_Page_PDF_Processing',
            'pages_processed': len(page_results)
        }

    def _create_error_response(self, error_message: str, filename: str, file_path: str, file_type: str = 'unknown') -> Dict[str, Any]:
        """Cria resposta de erro padronizada"""

        return {
            'success': False,
            'error': error_message,
            'extracted_data': {
                'supplier_name': '',
                'supplier_cnpj': '',
                'invoice_number': '',
                'issue_date': '',
                'due_date': '',
                'total_amount': 0.0,
                'tax_amount': 0.0,
                'net_amount': 0.0,
                'description': '',
                'category': '',
                'payment_method': '',
                'items': [],
                'confidence_score': 0.0,
                'ai_suggestions': [
                    f'Erro no processamento: {error_message}',
                    'Verifique o arquivo e tente novamente'
                ]
            },
            'confidence_score': 0.0,
            'original_filename': filename,
            'file_type': file_type,
            'file_path': file_path,
            'processed_at': datetime.now().isoformat(),
            'processing_method': 'error'
        }

    def get_supported_formats(self) -> Dict[str, List[str]]:
        """Retorna formatos suportados"""
        return {
            'pdf': self.supported_pdf_extensions,
            'image': self.supported_image_extensions,
            'all': self.supported_pdf_extensions + self.supported_image_extensions
        }

    def is_supported_format(self, filename: str) -> bool:
        """Verifica se o formato do arquivo é suportado"""
        extension = Path(filename).suffix.lower()
        return extension in (self.supported_pdf_extensions + self.supported_image_extensions)

    def _suggest_suppliers(self, cleaned_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sugere fornecedores existentes usando fuzzy matching

        Args:
            cleaned_data: Dados limpos extraídos

        Returns:
            Dict com sugestões de fornecedores
        """

        try:
            if not self.db_session:
                return {'suggestions': [], 'error': 'Sessão de banco não disponível'}

            supplier_matcher = SupplierMatcher(self.db_session)

            supplier_name = cleaned_data.get('supplier_name', '')
            supplier_cnpj = cleaned_data.get('supplier_cnpj', '')

            if not supplier_name and not supplier_cnpj:
                return {'suggestions': [], 'message': 'Nome ou CNPJ do fornecedor não identificado'}

            # Busca correspondências
            matches = supplier_matcher.find_matching_suppliers(
                supplier_name=supplier_name,
                supplier_cnpj=supplier_cnpj,
                limit=5
            )

            # Verifica se deveria sugerir merge automático
            merge_suggestion = supplier_matcher.suggest_supplier_merge(supplier_name, supplier_cnpj)

            result = {
                'suggestions': matches,
                'total_found': len(matches),
                'best_match': matches[0] if matches else None,
                'merge_suggestion': merge_suggestion
            }

            # Adiciona contexto sobre a qualidade das sugestões
            if matches:
                high_quality_matches = [m for m in matches if m['score'] >= 85]
                result['high_quality_matches'] = len(high_quality_matches)

                if matches[0]['score'] >= 95:
                    result['recommendation'] = 'strong_match'
                    result['recommendation_message'] = f"Correspondência muito forte encontrada: {matches[0]['name']}"
                elif matches[0]['score'] >= 80:
                    result['recommendation'] = 'likely_match'
                    result['recommendation_message'] = f"Provável correspondência: {matches[0]['name']}"
                else:
                    result['recommendation'] = 'review_needed'
                    result['recommendation_message'] = "Correspondências encontradas, mas requerem revisão manual"
            else:
                result['recommendation'] = 'new_supplier'
                result['recommendation_message'] = "Nenhuma correspondência encontrada - provavelmente novo fornecedor"

            logger.info(f"Sugestões de fornecedores para '{supplier_name}': {len(matches)} encontradas")

            return result

        except Exception as e:
            logger.error(f"Erro ao sugerir fornecedores: {e}")
            return {
                'suggestions': [],
                'error': f'Erro interno: {str(e)}',
                'recommendation': 'error'
            }