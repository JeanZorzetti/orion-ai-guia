"""
Testes unitários para o DocumentProcessor
"""
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from PIL import Image
from app.services.document_processor import DocumentProcessor


class TestDocumentProcessor:
    """Testes para o processador de documentos"""

    @pytest.fixture
    def mock_services(self):
        """Mocks para todos os serviços dependencies"""
        with patch.multiple(
            'app.services.document_processor',
            LayoutLMService=MagicMock,
            AIService=MagicMock,
            FileUtils=MagicMock,
            DataCleaner=MagicMock,
            SupplierMatcher=MagicMock
        ) as mocks:
            yield mocks

    @pytest.fixture
    def document_processor(self, mock_services):
        """Fixture para DocumentProcessor com mocks"""
        processor = DocumentProcessor()

        # Configurar mocks básicos
        processor.layout_lm_service = mock_services['LayoutLMService'].return_value
        processor.ai_service = mock_services['AIService'].return_value
        processor.file_utils = mock_services['FileUtils'].return_value
        processor.data_cleaner = mock_services['DataCleaner'].return_value

        return processor

    def test_init(self, document_processor):
        """Testa inicialização do DocumentProcessor"""
        assert document_processor.use_layout_lm is True
        assert document_processor.pdf_dpi == 300
        assert document_processor.max_pages == 5
        assert document_processor.supported_pdf_extensions == ['.pdf']
        assert '.jpg' in document_processor.supported_image_extensions

    def test_is_supported_format(self, document_processor):
        """Testa verificação de formatos suportados"""
        # Formatos suportados
        assert document_processor.is_supported_format("document.pdf") is True
        assert document_processor.is_supported_format("image.jpg") is True
        assert document_processor.is_supported_format("image.png") is True

        # Formatos não suportados
        assert document_processor.is_supported_format("document.txt") is False
        assert document_processor.is_supported_format("document.docx") is False

        # Teste case insensitive
        assert document_processor.is_supported_format("DOCUMENT.PDF") is True

    def test_get_supported_formats(self, document_processor):
        """Testa retorno de formatos suportados"""
        formats = document_processor.get_supported_formats()

        assert 'pdf' in formats
        assert 'image' in formats
        assert 'all' in formats
        assert '.pdf' in formats['pdf']
        assert '.jpg' in formats['image']

    @pytest.mark.asyncio
    async def test_process_document_pdf(self, document_processor, temp_pdf_file):
        """Testa processamento de documento PDF"""
        # Mock do _process_pdf_document
        expected_result = {
            'success': True,
            'extracted_data': {'supplier_name': 'Test Company'},
            'processing_method': 'PDF_to_Image_Pipeline',
            'confidence_score': 0.85
        }

        document_processor._process_pdf_document = AsyncMock(return_value=expected_result)

        result = await document_processor.process_document(temp_pdf_file, "test.pdf")

        assert result == expected_result
        document_processor._process_pdf_document.assert_called_once_with(temp_pdf_file, "test.pdf")

    @pytest.mark.asyncio
    async def test_process_document_image(self, document_processor, temp_image_file):
        """Testa processamento de documento de imagem"""
        # Mock do _process_image_document
        expected_result = {
            'success': True,
            'extracted_data': {'supplier_name': 'Test Company'},
            'processing_method': 'Direct_Image_Pipeline',
            'confidence_score': 0.90
        }

        document_processor._process_image_document = AsyncMock(return_value=expected_result)

        result = await document_processor.process_document(temp_image_file, "test.jpg")

        assert result == expected_result
        document_processor._process_image_document.assert_called_once_with(temp_image_file, "test.jpg")

    @pytest.mark.asyncio
    async def test_process_document_unsupported_format(self, document_processor, invalid_file):
        """Testa processamento de formato não suportado"""
        result = await document_processor.process_document(invalid_file, "test.txt")

        assert result['success'] is False
        assert 'não suportado' in result['error']

    @pytest.mark.asyncio
    async def test_process_document_file_not_found(self, document_processor):
        """Testa processamento com arquivo inexistente"""
        result = await document_processor.process_document("nonexistent.pdf", "test.pdf")

        assert result['success'] is False
        assert 'não encontrado' in result['error']

    @pytest.mark.asyncio
    @patch('app.services.document_processor.convert_from_path')
    async def test_process_pdf_document_success(self, mock_convert, document_processor, temp_pdf_file):
        """Testa processamento bem-sucedido de PDF"""
        # Mock da conversão PDF para imagem
        mock_image = MagicMock(spec=Image.Image)
        mock_convert.return_value = [mock_image]

        # Mock do processamento de página individual
        page_result = {
            'success': True,
            'extracted_data': {'supplier_name': 'Test PDF Company'},
            'confidence_score': 0.80
        }
        document_processor._process_single_image = AsyncMock(return_value=page_result)

        # Mock da combinação de resultados
        combined_result = {
            'success': True,
            'extracted_data': {'supplier_name': 'Test PDF Company'},
            'confidence_score': 0.80
        }
        document_processor._combine_pdf_pages = MagicMock(return_value=combined_result)

        # Mock da limpeza de dados
        document_processor.data_cleaner.clean_extracted_data = MagicMock(
            return_value={'supplier_name': 'Test PDF Company Cleaned'}
        )
        document_processor.data_cleaner.get_cleaning_stats = MagicMock(
            return_value={'fields_cleaned': 5}
        )

        result = await document_processor._process_pdf_document(temp_pdf_file, "test.pdf")

        assert result['success'] is True
        assert result['file_type'] == 'pdf'
        assert result['total_pages'] == 1
        assert 'processed_at' in result
        mock_convert.assert_called_once()

    @pytest.mark.asyncio
    @patch('app.services.document_processor.Image.open')
    async def test_process_image_document_success(self, mock_image_open, document_processor, temp_image_file):
        """Testa processamento bem-sucedido de imagem"""
        # Mock da imagem
        mock_image = MagicMock(spec=Image.Image)
        mock_image.size = (800, 600)
        mock_image_open.return_value.convert.return_value = mock_image

        # Mock do processamento de imagem individual
        image_result = {
            'success': True,
            'extracted_data': {'supplier_name': 'Test Image Company'},
            'confidence_score': 0.75
        }
        document_processor._process_single_image = AsyncMock(return_value=image_result)

        # Mock da limpeza de dados
        document_processor.data_cleaner.clean_extracted_data = MagicMock(
            return_value={'supplier_name': 'Test Image Company Cleaned'}
        )

        result = await document_processor._process_image_document(temp_image_file, "test.jpg")

        assert result['success'] is True
        assert result['file_type'] == 'image'
        assert result['image_dimensions'] == (800, 600)

    @pytest.mark.asyncio
    @patch('app.services.document_processor.Image.open')
    async def test_process_image_too_small(self, mock_image_open, document_processor, temp_image_file):
        """Testa processamento de imagem muito pequena"""
        # Mock de imagem pequena
        mock_image = MagicMock(spec=Image.Image)
        mock_image.size = (50, 50)  # Menor que o mínimo (100x100)
        mock_image_open.return_value.convert.return_value = mock_image

        result = await document_processor._process_image_document(temp_image_file, "small.jpg")

        assert result['success'] is False
        assert 'muito pequena' in result['error']

    @pytest.mark.asyncio
    async def test_process_single_image_with_layout_lm(self, document_processor):
        """Testa processamento de imagem individual com LayoutLM"""
        document_processor.use_layout_lm = True

        # Mock da imagem
        mock_image = MagicMock(spec=Image.Image)

        # Mock do LayoutLM com resultado de alta confiança
        layout_result = {
            'extracted_fields': {'supplier_name': 'LayoutLM Company'},
            'confidence_score': 0.85
        }
        document_processor.layout_lm_service._process_single_image = AsyncMock(
            return_value=layout_result
        )

        result = await document_processor._process_single_image(mock_image, "test_image")

        assert result['success'] is True
        assert 'LayoutLM' in result['processing_method']
        document_processor.layout_lm_service._process_single_image.assert_called_once()

    @pytest.mark.asyncio
    async def test_process_single_image_layout_lm_fallback(self, document_processor):
        """Testa fallback quando LayoutLM falha ou tem baixa confiança"""
        document_processor.use_layout_lm = True

        # Mock da imagem
        mock_image = MagicMock(spec=Image.Image)

        # Mock do LayoutLM com resultado de baixa confiança
        layout_result = {
            'extracted_fields': {},
            'confidence_score': 0.2  # Baixa confiança
        }
        document_processor.layout_lm_service._process_single_image = AsyncMock(
            return_value=layout_result
        )

        # Mock do processamento tradicional
        document_processor._extract_text_from_image = AsyncMock(
            return_value="Extracted text from image"
        )
        document_processor._process_with_traditional_ai = AsyncMock(return_value={
            'success': True,
            'extracted_data': {'supplier_name': 'Traditional AI Company'},
            'confidence_score': 0.70
        })

        result = await document_processor._process_single_image(mock_image, "test_image")

        assert result['success'] is True
        # Deve ter usado o método tradicional
        document_processor._process_with_traditional_ai.assert_called_once()

    @pytest.mark.asyncio
    async def test_extract_text_from_image(self, document_processor):
        """Testa extração de texto de imagem"""
        mock_image = MagicMock(spec=Image.Image)

        # Mock do AI service OCR
        document_processor.ai_service.ocr_image = AsyncMock(
            return_value="Extracted text from image"
        )

        with patch('tempfile.NamedTemporaryFile') as mock_temp:
            mock_temp.return_value.__enter__.return_value.name = "/tmp/test.png"

            result = await document_processor._extract_text_from_image(mock_image)

            assert result == "Extracted text from image"
            document_processor.ai_service.ocr_image.assert_called_once()

    @pytest.mark.asyncio
    async def test_process_with_traditional_ai(self, document_processor):
        """Testa processamento com IA tradicional"""
        text_content = "Sample invoice text"
        identifier = "test_doc"

        # Mock da resposta da IA
        ai_response = """
        {
            "supplier_name": "Traditional AI Company",
            "total_amount": 1000.00,
            "confidence_score": 0.80
        }
        """
        document_processor.ai_service.extract_invoice_data = AsyncMock(
            return_value=ai_response
        )

        # Mock do parse da resposta
        parsed_data = {
            "supplier_name": "Traditional AI Company",
            "total_amount": 1000.00,
            "confidence_score": 0.80
        }
        document_processor._parse_ai_response = MagicMock(return_value=parsed_data)

        result = await document_processor._process_with_traditional_ai(text_content, identifier)

        assert result['success'] is True
        assert result['processing_method'] == 'Traditional_AI_OCR'
        assert result['extracted_data'] == parsed_data
        document_processor.ai_service.extract_invoice_data.assert_called_once()

    def test_combine_pdf_pages(self, document_processor):
        """Testa combinação de resultados de múltiplas páginas"""
        page_results = [
            {
                'success': True,
                'extracted_data': {
                    'supplier_name': 'Page 1 Company',
                    'total_amount': 1000.00,
                    'items': [{'description': 'Item 1', 'total_price': 500.00}]
                },
                'confidence_score': 0.80
            },
            {
                'success': True,
                'extracted_data': {
                    'supplier_name': '',  # Vazio na página 2
                    'total_amount': 0.0,
                    'items': [{'description': 'Item 2', 'total_price': 300.00}]
                },
                'confidence_score': 0.60
            }
        ]

        result = document_processor._combine_pdf_pages(page_results)

        assert result['success'] is True
        combined_data = result['extracted_data']

        # Deve usar dados da página com maior confiança
        assert combined_data['supplier_name'] == 'Page 1 Company'
        assert combined_data['total_amount'] == 1000.00

        # Deve combinar todos os itens
        assert len(combined_data['items']) == 2

    def test_suggest_suppliers_with_db(self, document_processor):
        """Testa sugestão de fornecedores com sessão de banco"""
        # Mock da sessão de banco
        mock_db_session = MagicMock()
        document_processor.db_session = mock_db_session

        # Mock do SupplierMatcher
        with patch('app.services.document_processor.SupplierMatcher') as mock_matcher_class:
            mock_matcher = mock_matcher_class.return_value

            # Mock dos resultados de matching
            mock_matches = [
                {
                    'supplier_id': 1,
                    'name': 'Matched Company',
                    'score': 90
                }
            ]
            mock_matcher.find_matching_suppliers.return_value = mock_matches
            mock_matcher.suggest_supplier_merge.return_value = None

            cleaned_data = {
                'supplier_name': 'Test Company',
                'supplier_cnpj': '12.345.678/0001-90'
            }

            result = document_processor._suggest_suppliers(cleaned_data)

            assert result['suggestions'] == mock_matches
            assert result['total_found'] == 1
            assert result['recommendation'] == 'strong_match'
            mock_matcher.find_matching_suppliers.assert_called_once_with(
                supplier_name='Test Company',
                supplier_cnpj='12.345.678/0001-90',
                limit=5
            )

    def test_suggest_suppliers_without_db(self, document_processor):
        """Testa sugestão de fornecedores sem sessão de banco"""
        document_processor.db_session = None

        cleaned_data = {
            'supplier_name': 'Test Company',
            'supplier_cnpj': '12.345.678/0001-90'
        }

        result = document_processor._suggest_suppliers(cleaned_data)

        assert result['suggestions'] == []
        assert 'error' in result

    def test_suggest_suppliers_no_supplier_data(self, document_processor):
        """Testa sugestão sem dados de fornecedor"""
        document_processor.db_session = MagicMock()

        cleaned_data = {
            'supplier_name': '',  # Vazio
            'supplier_cnpj': ''   # Vazio
        }

        result = document_processor._suggest_suppliers(cleaned_data)

        assert result['suggestions'] == []
        assert 'não identificado' in result['message']

    def test_create_error_response(self, document_processor):
        """Testa criação de resposta de erro"""
        error_msg = "Test error message"
        filename = "test.pdf"
        file_path = "/tmp/test.pdf"
        file_type = "pdf"

        response = document_processor._create_error_response(
            error_msg, filename, file_path, file_type
        )

        assert response['success'] is False
        assert response['error'] == error_msg
        assert response['original_filename'] == filename
        assert response['file_path'] == file_path
        assert response['file_type'] == file_type
        assert 'processed_at' in response

    @pytest.mark.asyncio
    async def test_save_temp_image_debug_mode(self, document_processor):
        """Testa salvamento de imagem temporária em modo debug"""
        mock_image = MagicMock(spec=Image.Image)

        with patch.dict('os.environ', {'DEBUG_SAVE_IMAGES': 'true'}):
            with patch('os.makedirs') as mock_makedirs:
                with patch('os.path.join', return_value='/tmp/debug/test_page_1.png'):
                    result = await document_processor._save_temp_image(mock_image, "test.pdf", 1)

                    assert result == '/tmp/debug/test_page_1.png'
                    mock_image.save.assert_called_once()

    def test_format_layout_result(self, document_processor):
        """Testa formatação de resultado do LayoutLM"""
        layout_result = {
            'extracted_fields': {
                'supplier_name': 'LayoutLM Company',
                'total_amount': 1500.0,
                'tax_amount': 150.0,
                'items': [
                    {
                        'description': 'Service A',
                        'quantity': 1,
                        'unit_price': 1500.0,
                        'total_price': 1500.0
                    }
                ]
            },
            'confidence_score': 0.88
        }

        identifier = "layout_test"

        result = document_processor._format_layout_result(layout_result, identifier)

        assert result['success'] is True
        assert result['processing_method'] == 'LayoutLM'
        assert result['confidence_score'] == 0.88

        extracted_data = result['extracted_data']
        assert extracted_data['supplier_name'] == 'LayoutLM Company'
        assert extracted_data['total_amount'] == 1500.0
        assert extracted_data['net_amount'] == 1350.0  # total - tax

    @pytest.mark.parametrize("confidence,expected_recommendation", [
        (0.96, 'strong_match'),
        (0.85, 'likely_match'),
        (0.65, 'review_needed'),
        (0.0, 'new_supplier')
    ])
    def test_supplier_suggestions_recommendations(self, document_processor, confidence, expected_recommendation):
        """Testa diferentes níveis de recomendação baseado na confiança"""
        mock_db_session = MagicMock()
        document_processor.db_session = mock_db_session

        with patch('app.services.document_processor.SupplierMatcher') as mock_matcher_class:
            mock_matcher = mock_matcher_class.return_value

            if confidence > 0:
                mock_matches = [{
                    'supplier_id': 1,
                    'name': 'Test Company',
                    'score': int(confidence * 100)
                }]
            else:
                mock_matches = []

            mock_matcher.find_matching_suppliers.return_value = mock_matches

            cleaned_data = {
                'supplier_name': 'Test Company',
                'supplier_cnpj': '12.345.678/0001-90'
            }

            result = document_processor._suggest_suppliers(cleaned_data)

            assert result['recommendation'] == expected_recommendation