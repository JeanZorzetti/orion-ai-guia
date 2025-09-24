import os
import json
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from app.services.ai_service import AIService
from app.services.layout_lm_service import LayoutLMService
from app.utils.file_utils import FileUtils
from app.core.config import settings

class InvoiceProcessorService:
    """
    Serviço para processamento de faturas com IA
    """

    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
        self.layout_lm_service = LayoutLMService()
        self.file_utils = FileUtils()
        self.use_layout_lm = os.getenv("USE_LAYOUT_LM", "true").lower() == "true"

    async def process_invoice(self, file_path: str, original_filename: str) -> Dict[str, Any]:
        """
        Processa uma fatura usando IA para extrair dados

        Args:
            file_path: Caminho para o arquivo da fatura
            original_filename: Nome original do arquivo

        Returns:
            Dict com os dados extraídos da fatura
        """

        try:
            # Verifica se o arquivo existe
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")

            # Determina o tipo de processamento baseado na extensão
            file_extension = Path(file_path).suffix.lower()

            if file_extension == '.pdf':
                return await self._process_pdf_invoice(file_path, original_filename)
            elif file_extension in ['.jpg', '.jpeg', '.png']:
                return await self._process_image_invoice(file_path, original_filename)
            else:
                raise ValueError(f"Tipo de arquivo não suportado: {file_extension}")

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "confidence_score": 0.0,
                "ai_suggestions": [f"Erro no processamento: {str(e)}"]
            }

    async def _process_pdf_invoice(self, file_path: str, original_filename: str) -> Dict[str, Any]:
        """Processa fatura em PDF"""

        # Tenta primeiro com LayoutLM se disponível
        if self.use_layout_lm:
            try:
                layout_result = await self.layout_lm_service.process_pdf_document(file_path)

                if layout_result.get("success") and layout_result.get("confidence_score", 0) > 0.3:
                    return self._format_layout_lm_result(layout_result, original_filename, "pdf")
            except Exception as e:
                print(f"Erro no LayoutLM para PDF, usando fallback: {e}")

        # Fallback para método tradicional
        pdf_text = self.file_utils.extract_pdf_text(file_path)

        if not pdf_text:
            # Tenta OCR se não conseguiu extrair texto
            pdf_text = await self.ai_service.ocr_pdf(file_path)

        # Processa com IA
        return await self._extract_invoice_data(pdf_text, original_filename, "pdf")

    async def _process_image_invoice(self, file_path: str, original_filename: str) -> Dict[str, Any]:
        """Processa fatura em imagem"""

        # Tenta primeiro com LayoutLM se disponível
        if self.use_layout_lm:
            try:
                layout_result = await self.layout_lm_service.process_image_document(file_path)

                if layout_result.get("success") and layout_result.get("confidence_score", 0) > 0.3:
                    return self._format_layout_lm_result(layout_result, original_filename, "image")
            except Exception as e:
                print(f"Erro no LayoutLM para imagem, usando fallback: {e}")

        # Fallback para método tradicional
        image_text = await self.ai_service.ocr_image(file_path)

        # Processa com IA
        return await self._extract_invoice_data(image_text, original_filename, "image")

    async def _extract_invoice_data(self, text_content: str, filename: str, file_type: str) -> Dict[str, Any]:
        """
        Extrai dados estruturados da fatura usando IA

        Args:
            text_content: Texto extraído da fatura
            filename: Nome do arquivo
            file_type: Tipo do arquivo (pdf/image)

        Returns:
            Dict com dados estruturados da fatura
        """

        # Prompt para extração de dados da fatura
        extraction_prompt = self._build_extraction_prompt(text_content)

        try:
            # Chama serviço de IA para extrair dados
            ai_response = await self.ai_service.extract_invoice_data(extraction_prompt)

            # Processa resposta da IA
            extracted_data = self._parse_ai_response(ai_response)

            # Adiciona metadados
            extracted_data.update({
                "original_filename": filename,
                "file_type": file_type,
                "processed_at": datetime.now().isoformat(),
                "text_content": text_content[:500] + "..." if len(text_content) > 500 else text_content
            })

            return extracted_data

        except Exception as e:
            return self._create_fallback_response(text_content, filename, str(e))

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

        try:
            # Remove possíveis caracteres extras e extrai JSON
            cleaned_response = ai_response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response.replace("```json", "").replace("```", "").strip()

            # Parse JSON
            data = json.loads(cleaned_response)

            # Valida e normaliza dados
            return self._validate_extracted_data(data)

        except json.JSONDecodeError as e:
            # Fallback se não conseguir fazer parse do JSON
            return self._create_manual_extraction(ai_response)

    def _validate_extracted_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida e normaliza os dados extraídos"""

        # Campos obrigatórios com valores padrão
        defaults = {
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
            "confidence_score": 0.0,
            "ai_suggestions": []
        }

        # Aplica valores padrão para campos faltando
        for key, default_value in defaults.items():
            if key not in data:
                data[key] = default_value

        # Validações específicas
        try:
            data["total_amount"] = float(data.get("total_amount", 0))
            data["tax_amount"] = float(data.get("tax_amount", 0))
            data["net_amount"] = float(data.get("net_amount", 0))
            data["confidence_score"] = max(0.0, min(1.0, float(data.get("confidence_score", 0))))

            # Valida datas
            for date_field in ["issue_date", "due_date"]:
                if data.get(date_field):
                    try:
                        datetime.strptime(data[date_field], "%Y-%m-%d")
                    except ValueError:
                        data[date_field] = ""

        except (ValueError, TypeError):
            pass

        return data

    def _format_layout_lm_result(self, layout_result: Dict[str, Any], filename: str, file_type: str) -> Dict[str, Any]:
        """
        Formata resultado do LayoutLM para o formato esperado pelo sistema

        Args:
            layout_result: Resultado do processamento LayoutLM
            filename: Nome do arquivo original
            file_type: Tipo do arquivo (pdf/image)

        Returns:
            Dict com dados formatados no padrão do sistema
        """

        extracted_data = layout_result.get("extracted_data", {})
        confidence_score = layout_result.get("confidence_score", 0.0)

        # Mapeia campos do LayoutLM para formato esperado
        formatted_data = {
            "supplier_name": extracted_data.get("supplier_name", ""),
            "supplier_cnpj": extracted_data.get("supplier_cnpj", ""),
            "invoice_number": extracted_data.get("invoice_number", ""),
            "issue_date": extracted_data.get("issue_date", ""),
            "due_date": extracted_data.get("due_date", ""),
            "total_amount": float(extracted_data.get("total_amount", 0.0)),
            "tax_amount": float(extracted_data.get("tax_amount", 0.0)),
            "net_amount": float(extracted_data.get("total_amount", 0.0)) - float(extracted_data.get("tax_amount", 0.0)),
            "description": self._generate_description_from_items(extracted_data.get("items", [])),
            "category": self._infer_category_from_items(extracted_data.get("items", [])),
            "payment_method": "",  # LayoutLM não extrai forma de pagamento facilmente
            "items": self._format_layout_items(extracted_data.get("items", [])),
            "confidence_score": confidence_score,
            "ai_suggestions": self._generate_layout_lm_suggestions(layout_result, confidence_score),
            "success": True,
            "original_filename": filename,
            "file_type": file_type,
            "processed_at": datetime.now().isoformat(),
            "processing_method": "LayoutLM"
        }

        return formatted_data

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

    def _format_layout_items(self, items: list) -> list:
        """Formata itens do LayoutLM para o formato esperado"""
        formatted_items = []

        for item in items:
            if isinstance(item, dict):
                formatted_items.append({
                    "description": item.get("description", ""),
                    "quantity": int(item.get("quantity", 1)) if item.get("quantity") else 1,
                    "unit_price": float(item.get("unit_price", 0.0)) if item.get("unit_price") else 0.0,
                    "total_price": float(item.get("total_price", 0.0)) if item.get("total_price") else 0.0
                })

        return formatted_items

    def _generate_layout_lm_suggestions(self, layout_result: Dict[str, Any], confidence_score: float) -> list:
        """Gera sugestões baseadas no resultado do LayoutLM"""
        suggestions = []

        if confidence_score < 0.5:
            suggestions.append("Confiança baixa na extração - verifique os dados manualmente")
        elif confidence_score < 0.7:
            suggestions.append("Confiança média na extração - recomenda-se verificação")
        else:
            suggestions.append("Extração com alta confiança usando LayoutLM")

        # Verifica se houve múltiplas páginas processadas
        pages_processed = layout_result.get("pages_processed", 1)
        if pages_processed > 1:
            suggestions.append(f"Documento com {pages_processed} páginas processadas")

        # Verifica se houve fallback para métodos tradicionais
        if not layout_result.get("success", False):
            suggestions.append("LayoutLM falhou - dados extraídos com método tradicional")

        return suggestions

    def _create_manual_extraction(self, ai_response: str) -> Dict[str, Any]:
        """Cria extração manual quando o parse JSON falha"""

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
            "ai_suggestions": [
                "Não foi possível extrair dados automaticamente",
                "Por favor, preencha manualmente",
                f"Resposta da IA: {ai_response[:200]}..."
            ]
        }

    def _create_fallback_response(self, text_content: str, filename: str, error: str) -> Dict[str, Any]:
        """Cria resposta de fallback em caso de erro"""

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
            "confidence_score": 0.0,
            "ai_suggestions": [
                f"Erro no processamento: {error}",
                "Verifique o arquivo e tente novamente",
                "Considere preencher os dados manualmente"
            ],
            "error": error,
            "original_filename": filename,
            "raw_text": text_content[:300] + "..." if len(text_content) > 300 else text_content
        }