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
        self.model = "gpt-4o-mini"  # Modelo mais econômico para processamento de texto
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

    async def ocr_image(self, image_path: str) -> str:
        """
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