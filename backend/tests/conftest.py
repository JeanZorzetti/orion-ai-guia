"""
Configurações e fixtures globais para testes
"""
import pytest
import asyncio
import tempfile
import os
from unittest.mock import MagicMock, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from PIL import Image
import numpy as np

from app.main import app
from app.core.database import Base, get_db
from app.services.ai_service import AIService
from app.services.layout_lm_service import LayoutLMService

# Database de teste na memória
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def event_loop():
    """Cria um event loop para toda a sessão de teste"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
def db_session():
    """Cria uma sessão de banco de dados para teste"""
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Cliente de teste para a API"""
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

@pytest.fixture
def mock_ai_service():
    """Mock do serviço de IA"""
    ai_service = MagicMock(spec=AIService)

    # Mock para extração de dados de invoice
    ai_service.extract_invoice_data = AsyncMock(return_value="""
    {
        "supplier_name": "Empresa Teste LTDA",
        "supplier_cnpj": "12.345.678/0001-90",
        "invoice_number": "123456",
        "issue_date": "2023-01-15",
        "due_date": "2023-02-15",
        "total_amount": 1500.00,
        "tax_amount": 150.00,
        "net_amount": 1350.00,
        "description": "Serviços de consultoria",
        "category": "Serviços",
        "payment_method": "PIX",
        "items": [
            {
                "description": "Consultoria em TI",
                "quantity": 1,
                "unit_price": 1500.00,
                "total_price": 1500.00
            }
        ],
        "confidence_score": 0.95,
        "ai_suggestions": ["Dados extraídos com alta confiança"]
    }
    """)

    # Mock para OCR
    ai_service.ocr_image = AsyncMock(return_value="Texto extraído da imagem de teste")
    ai_service.ocr_pdf = AsyncMock(return_value="Texto extraído do PDF de teste")

    return ai_service

@pytest.fixture
def mock_layout_lm_service():
    """Mock do serviço LayoutLM"""
    layout_service = MagicMock(spec=LayoutLMService)

    # Mock para load_model
    layout_service.load_model = AsyncMock(return_value=True)

    # Mock para processamento de PDF
    layout_service.process_pdf_document = AsyncMock(return_value={
        "success": True,
        "pages_processed": 1,
        "extracted_data": {
            "supplier_name": "Empresa LayoutLM LTDA",
            "supplier_cnpj": "98.765.432/0001-10",
            "invoice_number": "LM-789",
            "issue_date": "2023-02-01",
            "due_date": "2023-03-01",
            "total_amount": 2500.00,
            "tax_amount": 250.00,
            "items": []
        },
        "confidence_score": 0.88
    })

    # Mock para processamento de imagem
    layout_service.process_image_document = AsyncMock(return_value={
        "success": True,
        "pages_processed": 1,
        "extracted_data": {
            "supplier_name": "Fornecedor ImageLM",
            "supplier_cnpj": "11.222.333/0001-44",
            "invoice_number": "IMG-456",
            "issue_date": "2023-01-20",
            "due_date": "2023-02-20",
            "total_amount": 800.00,
            "tax_amount": 80.00,
            "items": []
        },
        "confidence_score": 0.75
    })

    return layout_service

@pytest.fixture
def sample_invoice_data():
    """Dados de amostra para fatura"""
    return {
        "supplier_name": "Empresa de Teste LTDA",
        "supplier_cnpj": "12.345.678/0001-90",
        "invoice_number": "NF-001",
        "issue_date": "2023-01-15",
        "due_date": "2023-02-15",
        "total_amount": 1000.00,
        "tax_amount": 100.00,
        "net_amount": 900.00,
        "description": "Produtos diversos",
        "category": "Materiais",
        "payment_method": "Boleto",
        "items": [
            {
                "description": "Produto A",
                "quantity": 2,
                "unit_price": 300.00,
                "total_price": 600.00
            },
            {
                "description": "Produto B",
                "quantity": 1,
                "unit_price": 400.00,
                "total_price": 400.00
            }
        ],
        "confidence_score": 0.90,
        "ai_suggestions": ["Dados bem estruturados"]
    }

@pytest.fixture
def messy_invoice_data():
    """Dados bagunçados para testar limpeza"""
    return {
        "supplier_name": "  EMPRESA     DE    teste    LTDA.  ",
        "supplier_cnpj": "12345678000190",
        "invoice_number": "  nf-001  ",
        "issue_date": "15/01/2023",
        "due_date": "15/02/23",
        "total_amount": "1.234,56",
        "tax_amount": "123,45",
        "net_amount": "abc",
        "description": "Descrição com\nquebras\tde linha",
        "category": "materiais",
        "payment_method": "BOLETO BANCARIO",
        "items": [
            {
                "description": "",
                "quantity": "2.0",
                "unit_price": "300,50",
                "total_price": "601,00"
            }
        ],
        "confidence_score": "0.75",
        "ai_suggestions": []
    }

@pytest.fixture
def temp_image_file():
    """Cria um arquivo de imagem temporário"""
    # Cria uma imagem de teste
    image = Image.new('RGB', (800, 600), color='white')

    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
        image.save(temp_file.name)
        yield temp_file.name

    # Limpa o arquivo temporário
    try:
        os.unlink(temp_file.name)
    except FileNotFoundError:
        pass

@pytest.fixture
def temp_pdf_file():
    """Cria um arquivo PDF temporário (mock)"""
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
        # Escreve alguns bytes para simular um PDF
        temp_file.write(b'%PDF-1.4\n%Mock PDF for testing\n%%EOF\n')
        temp_file.flush()
        yield temp_file.name

    # Limpa o arquivo temporário
    try:
        os.unlink(temp_file.name)
    except FileNotFoundError:
        pass

@pytest.fixture
def invalid_file():
    """Cria um arquivo inválido temporário"""
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp_file:
        temp_file.write(b'Arquivo de texto comum, nao eh um documento processavel')
        temp_file.flush()
        yield temp_file.name

    try:
        os.unlink(temp_file.name)
    except FileNotFoundError:
        pass

@pytest.fixture
def fuzzy_matching_data():
    """Dados para testar fuzzy matching"""
    return [
        {
            "target_name": "Microsoft Corporation",
            "existing_names": [
                "Microsoft Corp",
                "Microsoft Ltda",
                "Apple Inc",
                "Google LLC",
                "Microsofte Corporation"  # Com erro de digitação
            ]
        },
        {
            "target_name": "João da Silva Consultoria ME",
            "existing_names": [
                "Joao Silva Consultoria",
                "J. Silva Consultoria ME",
                "João Silva & Associados",
                "Pedro Santos Consultoria"
            ]
        }
    ]

@pytest.fixture
def supplier_test_data():
    """Dados de teste para fornecedores"""
    return {
        "name": "Empresa Teste LTDA",
        "cnpj": "12.345.678/0001-90",
        "email": "contato@empresateste.com",
        "phone": "(11) 99999-9999",
        "address": "Rua Teste, 123",
        "city": "São Paulo",
        "state": "SP",
        "postal_code": "01234-567",
        "category": "Tecnologia"
    }

class AsyncMockContext:
    """Context manager para mocks assíncronos"""

    def __init__(self, mock_obj):
        self.mock_obj = mock_obj

    async def __aenter__(self):
        return self.mock_obj

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

@pytest.fixture
def async_mock_context():
    """Fixture para criar context managers assíncronos"""
    return AsyncMockContext