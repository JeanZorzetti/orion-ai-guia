import os
import json
import base64
from typing import Dict, Any, Optional
import aiohttp
from pathlib import Path
import PyPDF2
from PIL import Image
import pytesseract

from app.core.config import settings

class AIService:
    """
    Serviço de IA para processamento de documentos e extração de dados
    """

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.model = "gpt-4o-mini"  # Modelo para processamento de texto
        self.vision_model = "gpt-4o"  # Modelo com visão para processar imagens
        self.base_url = "https://api.openai.com/v1"

    async def extract_invoice_data(self, prompt: str) -> str:
        """
        Extrai dados da fatura usando LLM

        Args:
            prompt: Prompt com o texto da fatura para análise

        Returns:
            Resposta da IA em formato JSON
        """

        if not self.api_key:
            return self._create_mock_response()

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }

                payload = {
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": """Você é um assistente especializado em análise de faturas e documentos fiscais brasileiros.
                                         Sua função é extrair dados estruturados de faturas/notas fiscais com alta precisão.
                                         Sempre retorne apenas JSON válido, sem texto adicional."""
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.1,  # Baixa criatividade para maior precisão
                    "max_tokens": 2000
                }

                async with session.post(f"{self.base_url}/chat/completions",
                                      headers=headers, json=payload) as response:

                    if response.status == 200:
                        data = await response.json()
                        return data["choices"][0]["message"]["content"]
                    else:
                        error_text = await response.text()
                        print(f"Erro na API OpenAI: {response.status} - {error_text}")
                        return self._create_mock_response()

        except Exception as e:
            print(f"Erro ao chamar serviço de IA: {e}")
            return self._create_mock_response()

    async def extract_invoice_from_image(self, image_path: str) -> str:
        """
        Extrai dados da fatura diretamente da imagem usando GPT-4o Vision

        Args:
            image_path: Caminho para o arquivo de imagem

        Returns:
            JSON com dados extraídos da fatura
        """

        if not self.api_key:
            return self._create_mock_response()

        try:
            # Converte imagem para base64
            with open(image_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')

            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }

                payload = {
                    "model": self.vision_model,
                    "messages": [
                        {
                            "role": "system",
                            "content": """Você é um assistente especializado em análise de faturas e notas fiscais brasileiras.
                                         Sua função é extrair dados estruturados de documentos fiscais com alta precisão.
                                         Sempre retorne apenas JSON válido, sem texto adicional."""
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": """Analise esta fatura/nota fiscal brasileira e extraia TODOS os dados no formato JSON exato:

{
    "supplier_name": "Nome completo do fornecedor/prestador",
    "supplier_cnpj": "CNPJ (apenas números)",
    "invoice_number": "Número da nota fiscal",
    "issue_date": "Data de emissão (formato YYYY-MM-DD)",
    "due_date": "Data de vencimento (formato YYYY-MM-DD)",
    "total_amount": 0.00,
    "tax_amount": 0.00,
    "net_amount": 0.00,
    "description": "Descrição dos itens/serviços",
    "category": "Categoria (Serviços, Material, etc)",
    "payment_method": "Forma de pagamento",
    "items": [
        {
            "description": "Nome do item/serviço",
            "quantity": 1,
            "unit_price": 0.00,
            "total_price": 0.00
        }
    ],
    "confidence_score": 0.95,
    "ai_suggestions": ["observações importantes"]
}

IMPORTANTE:
- Leia TODO o texto visível na imagem
- Use formato de data YYYY-MM-DD
- Valores em formato decimal (use ponto, não vírgula)
- Se ISS ou outro imposto estiver separado, coloque em tax_amount
- Calcule net_amount = total_amount - tax_amount
- confidence_score deve refletir sua certeza (0.0 a 1.0)
- Retorne APENAS o JSON, sem markdown ou texto extra"""
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 2000,
                    "temperature": 0.1
                }

                async with session.post(f"{self.base_url}/chat/completions",
                                      headers=headers, json=payload) as response:

                    if response.status == 200:
                        data = await response.json()
                        return data["choices"][0]["message"]["content"]
                    else:
                        error_text = await response.text()
                        print(f"Erro na API OpenAI Vision: {response.status} - {error_text}")
                        # Fallback para OCR tradicional
                        return await self._ocr_image_fallback(image_path)

        except Exception as e:
            print(f"Erro ao processar imagem com Vision API: {e}")
            # Fallback para OCR tradicional
            return await self._ocr_image_fallback(image_path)

    async def _ocr_image_fallback(self, image_path: str) -> str:
        """Fallback para OCR tradicional se Vision API falhar"""
        try:
            # Carrega a imagem
            image = Image.open(image_path)

            # Aplica OCR usando Tesseract
            custom_config = r'--oem 3 --psm 6 -l por'
            text = pytesseract.image_to_string(image, config=custom_config)

            # Processa o texto extraído com o modelo de texto
            return await self.extract_invoice_data(self._build_extraction_prompt_from_text(text))

        except Exception as e:
            print(f"Erro no OCR fallback: {e}")
            return self._create_mock_response()

    def _build_extraction_prompt_from_text(self, text: str) -> str:
        """Constrói prompt para extração a partir de texto OCR"""
        return f"""
        Analise o texto da fatura a seguir e extraia os dados estruturados em formato JSON.

        TEXTO DA FATURA:
        {text}

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
            "category": "Categoria inferida",
            "payment_method": "Forma de pagamento",
            "items": [],
            "confidence_score": 0.95,
            "ai_suggestions": []
        }}

        Retorne APENAS o JSON, sem texto adicional.
        """

    async def ocr_image(self, image_path: str) -> str:
        """
        DEPRECATED: Use extract_invoice_from_image() para melhor precisão

        Extrai texto de imagem usando OCR

        Args:
            image_path: Caminho para o arquivo de imagem

        Returns:
            Texto extraído da imagem
        """

        try:
            # Carrega a imagem
            image = Image.open(image_path)

            # Aplica OCR usando Tesseract
            # Configuração para português brasileiro
            custom_config = r'--oem 3 --psm 6 -l por'
            text = pytesseract.image_to_string(image, config=custom_config)

            return text.strip()

        except Exception as e:
            print(f"Erro no OCR da imagem: {e}")
            return "Erro ao extrair texto da imagem"

    async def ocr_pdf(self, pdf_path: str) -> str:
        """
        Extrai texto de PDF usando OCR (para PDFs digitalizados)

        Args:
            pdf_path: Caminho para o arquivo PDF

        Returns:
            Texto extraído do PDF
        """

        try:
            # Primeiro tenta extrair texto diretamente
            text = self._extract_pdf_text_direct(pdf_path)

            if text and len(text.strip()) > 50:
                return text

            # Se não conseguiu texto suficiente, tenta OCR
            # (Aqui seria necessário converter PDF para imagem primeiro)
            return "PDF digitalizado - OCR não implementado ainda"

        except Exception as e:
            print(f"Erro no OCR do PDF: {e}")
            return "Erro ao extrair texto do PDF"

    def _extract_pdf_text_direct(self, pdf_path: str) -> str:
        """Extrai texto diretamente do PDF"""

        try:
            text = ""
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)

                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text()

            return text.strip()

        except Exception as e:
            print(f"Erro ao extrair texto do PDF: {e}")
            return ""

    def _create_mock_response(self) -> str:
        """
        Cria uma resposta mock quando a API não está disponível
        """

        mock_data = {
            "supplier_name": "Fornecedor Exemplo Ltda",
            "supplier_cnpj": "12345678000195",
            "invoice_number": "NF-2024-001",
            "issue_date": "2024-01-15",
            "due_date": "2024-02-15",
            "total_amount": 1250.75,
            "tax_amount": 187.61,
            "net_amount": 1063.14,
            "description": "Produtos para revenda",
            "category": "Material de Estoque",
            "payment_method": "Boleto",
            "items": [
                {
                    "description": "Produto Exemplo A",
                    "quantity": 10,
                    "unit_price": 50.00,
                    "total_price": 500.00
                },
                {
                    "description": "Produto Exemplo B",
                    "quantity": 5,
                    "unit_price": 150.15,
                    "total_price": 750.75
                }
            ],
            "confidence_score": 0.85,
            "ai_suggestions": [
                "Documento processado com dados de exemplo",
                "Verifique se os valores estão corretos",
                "Configure sua API key para processamento real"
            ]
        }

        return json.dumps(mock_data, indent=2, ensure_ascii=False)

    async def analyze_invoice_risk(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analisa riscos da fatura usando IA

        Args:
            invoice_data: Dados da fatura para análise

        Returns:
            Análise de riscos e sugestões
        """

        if not self.api_key:
            return {
                "risk_score": 0.2,
                "risk_level": "low",
                "warnings": [],
                "suggestions": ["Configure API key para análise de riscos real"]
            }

        try:
            analysis_prompt = f"""
            Analise os dados desta fatura e identifique possíveis riscos ou problemas:

            Dados da Fatura:
            {json.dumps(invoice_data, indent=2, ensure_ascii=False)}

            Retorne um JSON com:
            {{
                "risk_score": 0.0-1.0,
                "risk_level": "low|medium|high",
                "warnings": ["lista de avisos"],
                "suggestions": ["lista de sugestões"],
                "compliance_check": {{
                    "cnpj_valid": true/false,
                    "dates_consistent": true/false,
                    "amounts_consistent": true/false
                }}
            }}
            """

            response = await self.extract_invoice_data(analysis_prompt)
            return json.loads(response)

        except Exception as e:
            return {
                "risk_score": 0.0,
                "risk_level": "unknown",
                "warnings": [f"Erro na análise: {str(e)}"],
                "suggestions": ["Verifique manualmente os dados da fatura"]
            }