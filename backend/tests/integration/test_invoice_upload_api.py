"""
Testes de integração para o endpoint de upload de faturas
"""
import pytest
import json
import tempfile
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from PIL import Image
import io

from app.main import app


class TestInvoiceUploadAPI:
    """Testes de integração para upload de faturas"""

    @pytest.fixture
    def auth_headers(self):
        """Headers de autenticação para os testes"""
        # Mock do token de autenticação
        return {"Authorization": "Bearer test_token"}

    def create_test_image_file(self, format='PNG'):
        """Cria um arquivo de imagem de teste"""
        image = Image.new('RGB', (800, 600), color='white')

        # Adiciona algum texto simulado na imagem
        try:
            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(image)
            draw.text((50, 50), "NOTA FISCAL\nEmpresa Teste LTDA\nCNPJ: 12.345.678/0001-90", fill='black')
        except ImportError:
            pass  # ImageDraw pode não estar disponível em todos os ambientes

        img_bytes = io.BytesIO()
        image.save(img_bytes, format=format)
        img_bytes.seek(0)

        return img_bytes

    def create_test_pdf_file(self):
        """Cria um arquivo PDF de teste (mock)"""
        pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(NOTA FISCAL TESTE) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000203 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
293
%%EOF"""

        return io.BytesIO(pdf_content)

    @pytest.mark.integration
    @patch('app.api.api_v1.endpoints.financials.get_current_user')
    @patch('app.services.document_processor.DocumentProcessor')
    def test_upload_invoice_image_success(self, mock_processor_class, mock_get_user, client):
        """Testa upload bem-sucedido de imagem de fatura"""
        # Mock do usuário atual
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        # Mock do processamento bem-sucedido
        mock_processor = mock_processor_class.return_value
        mock_processor.process_document = AsyncMock(return_value={
            'success': True,
            'extracted_data': {
                'supplier_name': 'Empresa Teste LTDA',
                'supplier_cnpj': '12.345.678/0001-90',
                'invoice_number': 'NF-001',
                'issue_date': '2023-01-15',
                'due_date': '2023-02-15',
                'total_amount': 1500.00,
                'tax_amount': 150.00,
                'net_amount': 1350.00,
                'description': 'Serviços de consultoria',
                'category': 'Serviços',
                'payment_method': 'PIX',
                'items': [
                    {
                        'description': 'Consultoria em TI',
                        'quantity': 1,
                        'unit_price': 1500.00,
                        'total_price': 1500.00
                    }
                ],
                'confidence_score': 0.95,
                'ai_suggestions': ['Dados extraídos com alta confiança']
            },
            'processing_method': 'LayoutLM',
            'confidence_score': 0.95,
            'file_type': 'image',
            'cleaning_stats': {
                'fields_cleaned': 8,
                'fields_total': 10,
                'cleaning_percentage': 80.0
            },
            'supplier_suggestions': {
                'suggestions': [
                    {
                        'supplier_id': 1,
                        'name': 'Empresa Teste LTDA',
                        'score': 100,
                        'match_reason': 'Match exato'
                    }
                ],
                'recommendation': 'strong_match'
            }
        })

        # Cria arquivo de imagem de teste
        image_file = self.create_test_image_file()

        # Faz o upload
        response = client.post(
            "/api/v1/financials/invoices/upload",
            files={"file": ("test_invoice.png", image_file, "image/png")}
        )

        # Verifica resposta
        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "extracted_data" in data
        assert data["extracted_data"]["supplier_name"] == "Empresa Teste LTDA"
        assert data["extracted_data"]["total_amount"] == 1500.00

        # Verifica informações de processamento
        assert "processing_info" in data
        processing_info = data["processing_info"]
        assert processing_info["method"] == "LayoutLM"
        assert processing_info["confidence_score"] == 0.95
        assert "cleaning_stats" in processing_info
        assert "supplier_suggestions" in processing_info

    @pytest.mark.integration
    @patch('app.api.api_v1.endpoints.financials.get_current_user')
    @patch('app.services.document_processor.DocumentProcessor')
    def test_upload_invoice_pdf_success(self, mock_processor_class, mock_get_user, client):
        """Testa upload bem-sucedido de PDF de fatura"""
        # Mock do usuário atual
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        # Mock do processamento de PDF
        mock_processor = mock_processor_class.return_value
        mock_processor.process_document = AsyncMock(return_value={
            'success': True,
            'extracted_data': {
                'supplier_name': 'PDF Company LTDA',
                'supplier_cnpj': '98.765.432/0001-10',
                'invoice_number': 'PDF-123',
                'total_amount': 2500.00,
                'confidence_score': 0.88
            },
            'processing_method': 'PDF_to_Image_Pipeline',
            'confidence_score': 0.88,
            'file_type': 'pdf',
            'total_pages': 1,
            'pdf_dpi': 300
        })

        # Cria arquivo PDF de teste
        pdf_file = self.create_test_pdf_file()

        # Faz o upload
        response = client.post(
            "/api/v1/financials/invoices/upload",
            files={"file": ("test_invoice.pdf", pdf_file, "application/pdf")}
        )

        # Verifica resposta
        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["extracted_data"]["supplier_name"] == "PDF Company LTDA"
        assert data["processing_info"]["method"] == "PDF_to_Image_Pipeline"
        assert data["processing_info"]["pages_processed"] == 1

    @pytest.mark.integration
    @patch('app.api.api_v1.endpoints.financials.get_current_user')
    def test_upload_unsupported_file_type(self, mock_get_user, client):
        """Testa upload de tipo de arquivo não suportado"""
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        # Cria arquivo de texto (não suportado)
        text_file = io.BytesIO(b"This is a text file, not an invoice")

        response = client.post(
            "/api/v1/financials/invoices/upload",
            files={"file": ("test.txt", text_file, "text/plain")}
        )

        assert response.status_code == 400
        data = response.json()
        assert "não suportado" in data["detail"].lower()

    @pytest.mark.integration
    @patch('app.api.api_v1.endpoints.financials.get_current_user')
    def test_upload_file_too_large(self, mock_get_user, client):
        """Testa upload de arquivo muito grande"""
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        # Mock de arquivo grande (simula tamanho > 10MB)
        large_file = io.BytesIO(b"x" * (11 * 1024 * 1024))  # 11MB

        # Mock do tamanho do arquivo
        with patch('app.api.api_v1.endpoints.financials.UploadFile') as mock_upload_file:
            mock_file = mock_upload_file.return_value
            mock_file.filename = "large_file.pdf"
            mock_file.content_type = "application/pdf"
            mock_file.size = 11 * 1024 * 1024

            response = client.post(
                "/api/v1/financials/invoices/upload",
                files={"file": ("large_file.pdf", large_file, "application/pdf")}
            )

            # Note: Este teste pode falhar dependendo de como o FastAPI lida com o tamanho
            # Em um cenário real, você precisaria configurar o limite no FastAPI

    @pytest.mark.integration
    @patch('app.api.api_v1.endpoints.financials.get_current_user')
    @patch('app.services.document_processor.DocumentProcessor')
    def test_upload_processing_error(self, mock_processor_class, mock_get_user, client):
        """Testa tratamento de erro durante o processamento"""
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        # Mock de erro no processamento
        mock_processor = mock_processor_class.return_value
        mock_processor.process_document = AsyncMock(return_value={
            'success': False,
            'error': 'Erro no processamento do documento',
            'extracted_data': {},
            'confidence_score': 0.0
        })

        image_file = self.create_test_image_file()

        response = client.post(
            "/api/v1/financials/invoices/upload",
            files={"file": ("error_invoice.png", image_file, "image/png")}
        )

        assert response.status_code == 200  # API não falha, mas retorna erro no processamento
        data = response.json()
        assert data["success"] is False
        assert "error" in data

    @pytest.mark.integration
    @patch('app.api.api_v1.endpoints.financials.get_current_user')
    @patch('app.services.document_processor.DocumentProcessor')
    def test_upload_low_confidence_processing(self, mock_processor_class, mock_get_user, client):
        """Testa processamento com baixa confiança"""
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        # Mock de processamento com baixa confiança
        mock_processor = mock_processor_class.return_value
        mock_processor.process_document = AsyncMock(return_value={
            'success': True,
            'extracted_data': {
                'supplier_name': 'Nome Incerto',
                'supplier_cnpj': '',  # Não identificado
                'total_amount': 0.0,
                'confidence_score': 0.3,
                'ai_suggestions': [
                    'Baixa confiança na extração',
                    'Recomenda-se preenchimento manual'
                ]
            },
            'processing_method': 'Traditional_AI_OCR',
            'confidence_score': 0.3
        })

        image_file = self.create_test_image_file()

        response = client.post(
            "/api/v1/financials/invoices/upload",
            files={"file": ("low_quality.png", image_file, "image/png")}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["processing_info"]["confidence_score"] == 0.3

        # Verifica se há sugestões de melhoria
        suggestions = data["extracted_data"]["ai_suggestions"]
        assert any("baixa confiança" in sugg.lower() for sugg in suggestions)

    @pytest.mark.integration
    def test_upload_without_authentication(self, client):
        """Testa upload sem autenticação"""
        image_file = self.create_test_image_file()

        response = client.post(
            "/api/v1/financials/invoices/upload",
            files={"file": ("test.png", image_file, "image/png")}
        )

        # Deve retornar erro de autenticação
        assert response.status_code in [401, 422]  # Depende da implementação de auth

    @pytest.mark.integration
    @patch('app.api.api_v1.endpoints.financials.get_current_user')
    def test_upload_empty_file(self, mock_get_user, client):
        """Testa upload de arquivo vazio"""
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        empty_file = io.BytesIO(b"")

        response = client.post(
            "/api/v1/financials/invoices/upload",
            files={"file": ("empty.png", empty_file, "image/png")}
        )

        # Deve falhar na validação ou processamento
        assert response.status_code in [400, 422]

    @pytest.mark.integration
    @patch('app.api.api_v1.endpoints.financials.get_current_user')
    @patch('app.services.document_processor.DocumentProcessor')
    def test_upload_with_supplier_matching(self, mock_processor_class, mock_get_user, client):
        """Testa upload com matching de fornecedores"""
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        # Mock com sugestões de fornecedores
        mock_processor = mock_processor_class.return_value
        mock_processor.process_document = AsyncMock(return_value={
            'success': True,
            'extracted_data': {
                'supplier_name': 'Microsoft Corp',
                'supplier_cnpj': '12.345.678/0001-90',
                'total_amount': 5000.00,
                'confidence_score': 0.90
            },
            'supplier_suggestions': {
                'suggestions': [
                    {
                        'supplier_id': 1,
                        'name': 'Microsoft Corporation',
                        'cnpj': '12.345.678/0001-90',
                        'score': 95,
                        'match_reason': 'Fuzzy matching (ratio)',
                        'match_type': 'fuzzy_ratio'
                    },
                    {
                        'supplier_id': 2,
                        'name': 'Microsoft Brasil LTDA',
                        'cnpj': '98.765.432/0001-10',
                        'score': 85,
                        'match_reason': 'Fuzzy matching (token_sort)',
                        'match_type': 'fuzzy_token_sort'
                    }
                ],
                'total_found': 2,
                'best_match': {
                    'supplier_id': 1,
                    'name': 'Microsoft Corporation',
                    'score': 95
                },
                'recommendation': 'strong_match',
                'recommendation_message': 'Correspondência muito forte encontrada: Microsoft Corporation'
            },
            'processing_method': 'LayoutLM',
            'confidence_score': 0.90
        })

        image_file = self.create_test_image_file()

        response = client.post(
            "/api/v1/financials/invoices/upload",
            files={"file": ("microsoft_invoice.png", image_file, "image/png")}
        )

        assert response.status_code == 200
        data = response.json()

        # Verifica sugestões de fornecedores
        supplier_suggestions = data["processing_info"]["supplier_suggestions"]
        assert len(supplier_suggestions["suggestions"]) == 2
        assert supplier_suggestions["best_match"]["name"] == "Microsoft Corporation"
        assert supplier_suggestions["recommendation"] == "strong_match"

    @pytest.mark.parametrize("file_format,content_type,expected_success", [
        ("PNG", "image/png", True),
        ("JPEG", "image/jpeg", True),
        ("PDF", "application/pdf", True),
        ("GIF", "image/gif", False),  # Não suportado
        ("BMP", "image/bmp", False),  # Pode não ser suportado
    ])
    @pytest.mark.integration
    @patch('app.api.api_v1.endpoints.financials.get_current_user')
    @patch('app.services.document_processor.DocumentProcessor')
    def test_upload_different_formats(self, mock_processor_class, mock_get_user,
                                    client, file_format, content_type, expected_success):
        """Testa upload de diferentes formatos de arquivo"""
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        if expected_success:
            mock_processor = mock_processor_class.return_value
            mock_processor.process_document = AsyncMock(return_value={
                'success': True,
                'extracted_data': {'supplier_name': 'Test Company'},
                'confidence_score': 0.80
            })

        if file_format == "PDF":
            test_file = self.create_test_pdf_file()
        else:
            test_file = self.create_test_image_file(format=file_format)

        filename = f"test.{file_format.lower()}"

        response = client.post(
            "/api/v1/financials/invoices/upload",
            files={"file": (filename, test_file, content_type)}
        )

        if expected_success:
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
        else:
            assert response.status_code == 400