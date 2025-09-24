"""
Fixtures com dados de amostra para testes de extração de faturas
"""

# Dados de faturas brasileiras realistas para testes
SAMPLE_INVOICES = {
    "clean_invoice": {
        "supplier_name": "Empresa de Tecnologia LTDA",
        "supplier_cnpj": "12.345.678/0001-90",
        "invoice_number": "NF-001234",
        "issue_date": "2023-01-15",
        "due_date": "2023-02-15",
        "total_amount": 2500.00,
        "tax_amount": 250.00,
        "net_amount": 2250.00,
        "description": "Serviços de desenvolvimento de software",
        "category": "Tecnologia",
        "payment_method": "PIX",
        "items": [
            {
                "description": "Desenvolvimento de sistema web",
                "quantity": 1,
                "unit_price": 2000.00,
                "total_price": 2000.00
            },
            {
                "description": "Consultoria técnica",
                "quantity": 5,
                "unit_price": 100.00,
                "total_price": 500.00
            }
        ],
        "confidence_score": 0.95,
        "ai_suggestions": ["Dados extraídos com alta confiança", "Todos os campos obrigatórios preenchidos"]
    },

    "messy_invoice": {
        "supplier_name": "  JOÃO    DA   silva   consultoria   ME  ",
        "supplier_cnpj": "98765432000110",  # Sem formatação
        "invoice_number": "  nf/2023/456  ",
        "issue_date": "15/03/2023",  # Formato brasileiro
        "due_date": "15/04/23",  # Ano abreviado
        "total_amount": "3.456,78",  # Formato brasileiro com vírgula
        "tax_amount": "345,67",
        "net_amount": "3.111,11",
        "description": "Consultoria em\ngestão empresarial\tcom foco em\rprocessos",
        "category": "consultoria",
        "payment_method": "BOLETO BANCARIO",
        "items": [
            {
                "description": "  consultoria gerencial  ",
                "quantity": "10,5",  # Quantidade com vírgula
                "unit_price": "250,00",
                "total_price": "2.625,00"
            },
            {
                "description": "",  # Descrição vazia
                "quantity": "1",
                "unit_price": "831,78",
                "total_price": "831,78"
            }
        ],
        "confidence_score": "0.72",  # String em vez de float
        "ai_suggestions": []  # Lista vazia
    },

    "incomplete_invoice": {
        "supplier_name": "Fornecedor Incompleto",
        "supplier_cnpj": "",  # CNPJ faltando
        "invoice_number": "INCOMPLETE-001",
        "issue_date": "",  # Data faltando
        "due_date": "2023-06-30",
        "total_amount": 1000.00,
        "tax_amount": 0.0,  # Sem impostos
        "net_amount": 1000.00,
        "description": "",  # Descrição faltando
        "category": "",  # Categoria faltando
        "payment_method": "",
        "items": [],  # Sem itens
        "confidence_score": 0.45,  # Baixa confiança
        "ai_suggestions": [
            "CNPJ não identificado - preencha manualmente",
            "Data de emissão não encontrada",
            "Nenhum item detalhado encontrado",
            "Baixa confiança na extração - recomenda-se revisão manual"
        ]
    },

    "invalid_data_invoice": {
        "supplier_name": None,  # Valor None
        "supplier_cnpj": "123456789",  # CNPJ inválido (muito curto)
        "invoice_number": 12345,  # Número em formato incorreto
        "issue_date": "32/13/2023",  # Data inválida
        "due_date": "2023-02-30",  # Data inválida
        "total_amount": "não_é_um_número",
        "tax_amount": -50.00,  # Valor negativo
        "net_amount": "1.000.000,00",  # String
        "description": "X" * 1000,  # Descrição muito longa
        "category": 123,  # Tipo incorreto
        "payment_method": ["pix", "boleto"],  # Lista em vez de string
        "items": "not_a_list",  # Tipo incorreto
        "confidence_score": 1.5,  # Score inválido (>1)
        "ai_suggestions": None
    },

    "large_invoice": {
        "supplier_name": "Empresa de Grande Porte S/A",
        "supplier_cnpj": "11.222.333/0001-44",
        "invoice_number": "NF-LARGE-2023-789",
        "issue_date": "2023-04-10",
        "due_date": "2023-05-10",
        "total_amount": 25000.00,
        "tax_amount": 4500.00,
        "net_amount": 20500.00,
        "description": "Fornecimento de equipamentos e serviços diversos conforme contrato anexo",
        "category": "Equipamentos",
        "payment_method": "TED",
        "items": [
            {
                "description": f"Equipamento modelo {i:03d}",
                "quantity": i % 5 + 1,
                "unit_price": (i * 100.0),
                "total_price": ((i % 5 + 1) * i * 100.0)
            }
            for i in range(1, 21)  # 20 itens
        ],
        "confidence_score": 0.88,
        "ai_suggestions": [
            "Fatura de grande valor - verificar aprovação",
            "Múltiplos itens identificados",
            "Recomenda-se conferência dos valores totais"
        ]
    },

    "service_invoice": {
        "supplier_name": "Prestadora de Serviços EIRELI",
        "supplier_cnpj": "44.555.666/0001-77",
        "invoice_number": "NFS-2023-100",
        "issue_date": "2023-05-20",
        "due_date": "2023-06-20",
        "total_amount": 5000.00,
        "tax_amount": 750.00,
        "net_amount": 4250.00,
        "description": "Prestação de serviços de limpeza e manutenção predial",
        "category": "Serviços",
        "payment_method": "PIX",
        "items": [
            {
                "description": "Serviço de limpeza predial - Mensal",
                "quantity": 1,
                "unit_price": 3000.00,
                "total_price": 3000.00
            },
            {
                "description": "Manutenção preventiva - equipamentos",
                "quantity": 2,
                "unit_price": 1000.00,
                "total_price": 2000.00
            }
        ],
        "confidence_score": 0.92,
        "ai_suggestions": ["Fatura de serviços identificada corretamente"]
    },

    "foreign_company": {
        "supplier_name": "Microsoft Corporation USA",
        "supplier_cnpj": "",  # Empresa estrangeira sem CNPJ
        "invoice_number": "INV-US-2023-001",
        "issue_date": "2023-03-01",
        "due_date": "2023-04-01",
        "total_amount": 15000.00,
        "tax_amount": 0.0,  # Sem impostos brasileiros
        "net_amount": 15000.00,
        "description": "Software licensing and support services",
        "category": "Software",
        "payment_method": "Internacional",
        "items": [
            {
                "description": "Microsoft Office 365 Enterprise - Annual License",
                "quantity": 100,
                "unit_price": 120.00,
                "total_price": 12000.00
            },
            {
                "description": "Technical Support - Premium",
                "quantity": 1,
                "unit_price": 3000.00,
                "total_price": 3000.00
            }
        ],
        "confidence_score": 0.85,
        "ai_suggestions": [
            "Fornecedor estrangeiro identificado",
            "CNPJ não aplicável para empresa estrangeira",
            "Verificar necessidade de documentação adicional"
        ]
    }
}

# Dados de fornecedores para testes de fuzzy matching
SAMPLE_SUPPLIERS = [
    {
        "name": "Microsoft Corporation",
        "variations": [
            "Microsoft Corp",
            "Microsoft Ltda",
            "Microsofte Corporation",  # Com erro
            "Microsoft Brasil",
            "MS Corporation"
        ]
    },
    {
        "name": "João da Silva Consultoria ME",
        "variations": [
            "Joao Silva Consultoria",
            "J. Silva Consultoria ME",
            "João Silva & Associados",
            "Silva Consultoria",
            "Consultoria João Silva"
        ]
    },
    {
        "name": "Empresa de Tecnologia LTDA",
        "variations": [
            "Empresa Tecnologia",
            "Tecnologia Empresa LTDA",
            "Empresa Tech LTDA",
            "EmpresaTech",
            "Empresa de TI LTDA"
        ]
    },
    {
        "name": "Prestadora de Serviços EIRELI",
        "variations": [
            "Prestadora Servicos",
            "Serviços Prestadora EIRELI",
            "Prestadora EIRELI",
            "Prestadora de Servicos Gerais",
            "Prestacao de Servicos"
        ]
    }
]

# Texto OCR simulado de faturas reais (com erros típicos de OCR)
SAMPLE_OCR_TEXTS = {
    "good_quality": """
NOTA FISCAL ELETRÔNICA
Nº 000.123.456

EMPRESA FORNECEDORA LTDA
CNPJ: 12.345.678/0001-90
Rua das Empresas, 123 - São Paulo - SP

DATA DE EMISSÃO: 15/01/2023
DATA DE VENCIMENTO: 15/02/2023

DESCRIÇÃO DOS PRODUTOS/SERVIÇOS:
- Desenvolvimento de software
- Consultoria técnica

VALOR DOS PRODUTOS/SERVIÇOS: R$ 2.000,00
VALOR DOS IMPOSTOS: R$ 200,00
VALOR TOTAL DA NOTA: R$ 2.200,00

FORMA DE PAGAMENTO: PIX
    """,

    "poor_quality": """
N0TA FlSCAL ELETRoNlCA
Nº O0O.l23.4S6

EMPREs4 F0RNEC3D0RA LTDA
CNPJ: l2.34S.67B/OOOl-9O
Rua das 3mpresas, l23 - Sao Paul0 - SP

0ATA 0E EMlSSA0: lS/Ol/2O23
0ATA 0E VENClMENT0: lS/O2/2O23

0ESCRlCA0 00S PR00UT0S/S3RVlC0S:
- 0esenv0lviment0 de s0ftware
- C0nsult0ria tecnica

VAL0R 00S PR00UT0S/S3RVlC0S: R$ 2.OOO,OO
VAL0R 00S lMP0ST0S: R$ 2OO,OO
VAL0R T0TAL 0A N0TA: R$ 2.2OO,OO

F0RMA 0E PAGAMENT0: PlX
    """,

    "partial_text": """
EMPREs4 ... LTDA
CNPJ: 12.345...
...
VALOR TOTAL: R$ 1.500,00
...
PAGAMENTO: BOLETO
    """,

    "handwritten": """
Nota Fiscal Manual
João Silva Consultoria
CPF/CNPJ: 123.456.789-00

Serviços prestados:
Consultoria empresarial - R$ 800,00

Total: R$ 800,00
Vencimento: 30/06/2023
    """
}

# Cenários de teste para diferentes tipos de erro
ERROR_SCENARIOS = {
    "network_timeout": {
        "error_type": "timeout",
        "message": "Timeout ao conectar com serviço de IA",
        "expected_fallback": "traditional_ocr"
    },

    "ai_service_unavailable": {
        "error_type": "service_unavailable",
        "message": "Serviço de IA indisponível",
        "expected_fallback": "manual_entry"
    },

    "invalid_pdf": {
        "error_type": "file_format",
        "message": "Arquivo PDF corrompido ou inválido",
        "expected_result": "error_response"
    },

    "image_too_small": {
        "error_type": "image_quality",
        "message": "Imagem muito pequena para processamento",
        "expected_result": "error_response"
    },

    "ocr_failure": {
        "error_type": "ocr_error",
        "message": "Falha na extração de texto da imagem",
        "expected_fallback": "manual_entry"
    }
}

# Dados para teste de performance
PERFORMANCE_TEST_DATA = {
    "small_batch": 10,
    "medium_batch": 50,
    "large_batch": 100,
    "stress_batch": 500,
    "max_processing_time_per_doc": 5.0,  # segundos
    "max_memory_usage": 500,  # MB
    "min_throughput": 10  # documentos por segundo
}

# Configurações de qualidade esperada
QUALITY_THRESHOLDS = {
    "min_confidence_score": 0.7,
    "min_data_cleaning_success_rate": 0.95,
    "min_fuzzy_matching_accuracy": 0.8,
    "max_false_positive_rate": 0.05,
    "required_fields": [
        "supplier_name",
        "invoice_number",
        "total_amount",
        "issue_date"
    ]
}