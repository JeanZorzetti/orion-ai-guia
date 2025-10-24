import os
import torch
import logging
from typing import Dict, List, Any, Optional, Tuple
from transformers import (
    LayoutLMv3Processor,
    LayoutLMv3ForTokenClassification
)
from PIL import Image
import numpy as np
from pdf2image import convert_from_path
import cv2
import pytesseract

from app.core.config import settings

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LayoutLMService:
    """
    Serviço para processamento de documentos usando LayoutLM
    """

    def __init__(self, model_name: str = "microsoft/layoutlmv3-base"):
        """
        Inicializa o serviço LayoutLM

        Args:
            model_name: Nome do modelo Hugging Face a ser utilizado
        """
        self.model_name = model_name
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.processor = None
        self.model = None

        # Cache para evitar recarregar o modelo
        self._model_loaded = False

        # Labels para classificação de tokens (NFe brasileira)
        self.label_list = [
            'O',  # Outside
            'B-SUPPLIER_NAME',  # Fornecedor
            'I-SUPPLIER_NAME',
            'B-SUPPLIER_CNPJ',  # CNPJ
            'I-SUPPLIER_CNPJ',
            'B-INVOICE_NUMBER',  # Número da NF
            'I-INVOICE_NUMBER',
            'B-ISSUE_DATE',  # Data de emissão
            'I-ISSUE_DATE',
            'B-DUE_DATE',  # Data de vencimento
            'I-DUE_DATE',
            'B-TOTAL_AMOUNT',  # Valor total
            'I-TOTAL_AMOUNT',
            'B-TAX_AMOUNT',  # Impostos
            'I-TAX_AMOUNT',
            'B-ITEM_DESC',  # Descrição de itens
            'I-ITEM_DESC',
            'B-ITEM_QTY',  # Quantidade
            'I-ITEM_QTY',
            'B-ITEM_PRICE',  # Preço unitário
            'I-ITEM_PRICE',
            'B-ITEM_TOTAL',  # Total do item
            'I-ITEM_TOTAL'
        ]

        logger.info(f"LayoutLMService inicializado com modelo: {model_name}")

    async def load_model(self) -> bool:
        """
        Carrega o modelo LayoutLM

        Returns:
            True se carregou com sucesso
        """
        if self._model_loaded:
            return True

        try:
            logger.info("Carregando modelo LayoutLM...")

            # Determina qual versão do LayoutLM usar
            if "layoutlmv3" in self.model_name.lower():
                self.processor = LayoutLMv3Processor.from_pretrained(self.model_name)
                self.model = LayoutLMv3ForTokenClassification.from_pretrained(
                    self.model_name,
                    num_labels=len(self.label_list)
                )
            else:
                # LayoutLM v1/v2
                self.processor = LayoutLMProcessor.from_pretrained(self.model_name)
                self.model = LayoutLMForTokenClassification.from_pretrained(
                    self.model_name,
                    num_labels=len(self.label_list)
                )

            # Move modelo para GPU se disponível
            self.model.to(self.device)
            self.model.eval()

            self._model_loaded = True
            logger.info(f"Modelo carregado com sucesso no device: {self.device}")
            return True

        except Exception as e:
            logger.error(f"Erro ao carregar modelo LayoutLM: {e}")
            return False

    async def process_pdf_document(self, pdf_path: str) -> Dict[str, Any]:
        """
        Processa documento PDF usando LayoutLM

        Args:
            pdf_path: Caminho para o arquivo PDF

        Returns:
            Dados extraídos do documento
        """
        try:
            # Converte PDF para imagens
            images = convert_from_path(pdf_path, dpi=300, first_page=1, last_page=3)

            all_results = []

            for page_num, image in enumerate(images, 1):
                logger.info(f"Processando página {page_num}")

                # Processa cada página
                page_result = await self._process_single_image(image, f"page_{page_num}")
                all_results.append(page_result)

            # Combina resultados de todas as páginas
            combined_result = self._combine_page_results(all_results)

            return {
                "success": True,
                "pages_processed": len(images),
                "extracted_data": combined_result,
                "confidence_score": self._calculate_overall_confidence(all_results)
            }

        except Exception as e:
            logger.error(f"Erro no processamento PDF com LayoutLM: {e}")
            return {
                "success": False,
                "error": str(e),
                "confidence_score": 0.0
            }

    async def process_image_document(self, image_path: str) -> Dict[str, Any]:
        """
        Processa imagem usando LayoutLM

        Args:
            image_path: Caminho para a imagem

        Returns:
            Dados extraídos da imagem
        """
        try:
            # Carrega imagem
            image = Image.open(image_path).convert('RGB')

            # Processa imagem
            result = await self._process_single_image(image, "single_image")

            return {
                "success": True,
                "pages_processed": 1,
                "extracted_data": result,
                "confidence_score": result.get("confidence_score", 0.0)
            }

        except Exception as e:
            logger.error(f"Erro no processamento de imagem com LayoutLM: {e}")
            return {
                "success": False,
                "error": str(e),
                "confidence_score": 0.0
            }

    async def _process_single_image(self, image: Image.Image, page_id: str) -> Dict[str, Any]:
        """
        Processa uma única imagem com LayoutLM

        Args:
            image: Imagem PIL
            page_id: Identificador da página

        Returns:
            Dados extraídos da imagem
        """
        # Garante que o modelo está carregado
        if not await self.load_model():
            raise RuntimeError("Falha ao carregar modelo LayoutLM")

        try:
            # OCR para extrair texto e coordenadas
            ocr_result = self._perform_ocr(image)

            if not ocr_result['words']:
                return {
                    "page_id": page_id,
                    "extracted_fields": {},
                    "confidence_score": 0.0,
                    "error": "Nenhum texto detectado na imagem"
                }

            # Prepara inputs para LayoutLM
            encoding = self.processor(
                image,
                ocr_result['words'],
                boxes=ocr_result['boxes'],
                return_tensors="pt",
                padding=True,
                truncation=True
            )

            # Move para dispositivo
            for key in encoding:
                if torch.is_tensor(encoding[key]):
                    encoding[key] = encoding[key].to(self.device)

            # Inferência
            with torch.no_grad():
                outputs = self.model(**encoding)

            # Processa resultados
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            predicted_labels = torch.argmax(predictions, dim=-1)

            # Extrai campos estruturados
            extracted_fields = self._extract_structured_fields(
                ocr_result['words'],
                predicted_labels[0].cpu().numpy(),
                predictions[0].cpu().numpy()
            )

            return {
                "page_id": page_id,
                "extracted_fields": extracted_fields,
                "confidence_score": self._calculate_confidence(predictions[0].cpu().numpy()),
                "total_tokens": len(ocr_result['words'])
            }

        except Exception as e:
            logger.error(f"Erro no processamento de imagem única: {e}")
            return {
                "page_id": page_id,
                "extracted_fields": {},
                "confidence_score": 0.0,
                "error": str(e)
            }

    def _perform_ocr(self, image: Image.Image) -> Dict[str, List]:
        """
        Realiza OCR na imagem para extrair texto e coordenadas

        Args:
            image: Imagem PIL

        Returns:
            Dicionário com palavras e suas coordenadas
        """
        try:
            # Converte PIL para OpenCV
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

            # Configuração do Tesseract para português
            custom_config = r'--oem 3 --psm 6 -l por'

            # Extrai dados detalhados
            data = pytesseract.image_to_data(
                cv_image,
                config=custom_config,
                output_type=pytesseract.Output.DICT
            )

            words = []
            boxes = []

            width, height = image.size

            for i, word in enumerate(data['text']):
                if word.strip() and int(data['conf'][i]) > 30:  # Confiança mínima
                    x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]

                    # Normaliza coordenadas (0-1000 como esperado pelo LayoutLM)
                    normalized_box = [
                        int(1000 * x / width),
                        int(1000 * y / height),
                        int(1000 * (x + w) / width),
                        int(1000 * (y + h) / height)
                    ]

                    words.append(word.strip())
                    boxes.append(normalized_box)

            return {
                "words": words,
                "boxes": boxes,
                "image_size": (width, height)
            }

        except Exception as e:
            logger.error(f"Erro no OCR: {e}")
            return {"words": [], "boxes": [], "image_size": (0, 0)}

    def _extract_structured_fields(self, words: List[str], labels: np.ndarray, confidences: np.ndarray) -> Dict[str, Any]:
        """
        Extrai campos estruturados baseado nas predições do modelo

        Args:
            words: Lista de palavras detectadas
            labels: Labels preditos pelo modelo
            confidences: Scores de confiança

        Returns:
            Campos estruturados extraídos
        """
        fields = {
            "supplier_name": "",
            "supplier_cnpj": "",
            "invoice_number": "",
            "issue_date": "",
            "due_date": "",
            "total_amount": 0.0,
            "tax_amount": 0.0,
            "items": []
        }

        try:
            # Mapeia labels para nomes
            current_field = None
            current_text = []

            for i, (word, label_idx) in enumerate(zip(words, labels)):
                if label_idx >= len(self.label_list):
                    continue

                label = self.label_list[label_idx]
                confidence = np.max(confidences[i])

                # Processa apenas se confiança é alta
                if confidence < 0.5:
                    continue

                if label.startswith('B-'):
                    # Salva campo anterior se existe
                    if current_field and current_text:
                        self._save_field(fields, current_field, ' '.join(current_text))

                    # Inicia novo campo
                    current_field = label[2:]  # Remove 'B-'
                    current_text = [word]

                elif label.startswith('I-') and current_field:
                    field_name = label[2:]  # Remove 'I-'
                    if field_name == current_field:
                        current_text.append(word)

            # Salva último campo
            if current_field and current_text:
                self._save_field(fields, current_field, ' '.join(current_text))

            return fields

        except Exception as e:
            logger.error(f"Erro na extração de campos: {e}")
            return fields

    def _save_field(self, fields: Dict[str, Any], field_name: str, text: str):
        """Salva campo extraído no dicionário de campos"""

        field_mapping = {
            "SUPPLIER_NAME": "supplier_name",
            "SUPPLIER_CNPJ": "supplier_cnpj",
            "INVOICE_NUMBER": "invoice_number",
            "ISSUE_DATE": "issue_date",
            "DUE_DATE": "due_date",
            "TOTAL_AMOUNT": "total_amount",
            "TAX_AMOUNT": "tax_amount"
        }

        if field_name in field_mapping:
            key = field_mapping[field_name]

            # Processamento especial para valores numéricos
            if key in ["total_amount", "tax_amount"]:
                try:
                    # Remove caracteres não numéricos exceto vírgulas e pontos
                    clean_text = ''.join(c for c in text if c.isdigit() or c in '.,')
                    # Converte vírgula para ponto
                    clean_text = clean_text.replace(',', '.')
                    fields[key] = float(clean_text) if clean_text else 0.0
                except:
                    fields[key] = 0.0
            else:
                fields[key] = text.strip()

    def _combine_page_results(self, page_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Combina resultados de múltiplas páginas"""

        combined = {
            "supplier_name": "",
            "supplier_cnpj": "",
            "invoice_number": "",
            "issue_date": "",
            "due_date": "",
            "total_amount": 0.0,
            "tax_amount": 0.0,
            "items": []
        }

        # Prioriza dados da primeira página
        for result in page_results:
            if not result.get("extracted_fields"):
                continue

            fields = result["extracted_fields"]

            for key, value in fields.items():
                if key in combined and value:
                    if not combined[key] or (isinstance(value, str) and len(value) > len(str(combined[key]))):
                        combined[key] = value

        return combined

    def _calculate_confidence(self, predictions: np.ndarray) -> float:
        """Calcula score de confiança geral"""
        try:
            # Pega a confiança máxima para cada token
            max_confidences = np.max(predictions, axis=-1)
            return float(np.mean(max_confidences))
        except:
            return 0.0

    def _calculate_overall_confidence(self, page_results: List[Dict[str, Any]]) -> float:
        """Calcula confiança geral de todas as páginas"""
        confidences = [r.get("confidence_score", 0.0) for r in page_results]
        return np.mean(confidences) if confidences else 0.0