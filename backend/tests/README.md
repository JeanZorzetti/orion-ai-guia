# 🧪 Testes do Sistema de Extração de Faturas

Este diretório contém uma suíte abrangente de testes para garantir a robustez, precisão e performance do sistema de extração de dados de faturas.

## 📁 Estrutura dos Testes

```
tests/
├── conftest.py              # Configurações e fixtures globais
├── pytest.ini              # Configuração do pytest
├── run_tests.py            # Script para executar todos os testes
├── fixtures/               # Dados de teste realistas
│   ├── sample_invoices.py  # Amostras de faturas e cenários
│   └── __init__.py
├── unit/                   # Testes unitários
│   ├── test_data_cleaner.py           # DataCleaner
│   ├── test_supplier_matcher.py      # SupplierMatcher
│   ├── test_document_processor.py    # DocumentProcessor
│   └── __init__.py
└── integration/            # Testes de integração
    ├── test_invoice_upload_api.py     # API de upload
    ├── test_extraction_performance.py # Performance e stress
    └── __init__.py
```

## 🚀 Como Executar os Testes

### Instalação das Dependências

```bash
# No diretório backend/
pip install -r requirements.txt
```

### Executar Todos os Testes

```bash
python run_tests.py
```

### Executar Tipos Específicos

```bash
# Apenas testes unitários
python run_tests.py --type unit

# Apenas testes de integração
python run_tests.py --type integration

# Apenas testes de performance
python run_tests.py --type performance
```

### Com Opções Avançadas

```bash
# Com relatório de cobertura
python run_tests.py --coverage

# Modo verboso
python run_tests.py --verbose

# Execução em paralelo
python run_tests.py --parallel

# Combinando opções
python run_tests.py --coverage --verbose --type unit
```

### Pytest Direto

```bash
# Executar arquivo específico
pytest tests/unit/test_data_cleaner.py -v

# Executar teste específico
pytest tests/unit/test_data_cleaner.py::TestDataCleaner::test_clean_cnpj -v

# Com marcadores
pytest -m "unit and not slow" -v
pytest -m "integration" -v
pytest -m "slow" -v --durations=10
```

## 🎯 Tipos de Teste

### 1. **Testes Unitários** (`unit/`)

Testam componentes individuais isoladamente:

- **DataCleaner**: Limpeza e formatação de dados
  - Normalização de CNPJs, datas, valores monetários
  - Validação de consistência
  - Tratamento de dados inválidos

- **SupplierMatcher**: Fuzzy matching de fornecedores
  - Algoritmos de correspondência
  - Normalização de texto
  - Cache e performance

- **DocumentProcessor**: Processamento de documentos
  - Pipeline completo de extração
  - Integração de serviços
  - Tratamento de erros

### 2. **Testes de Integração** (`integration/`)

Testam a integração entre componentes:

- **API de Upload**: Endpoint completo de upload
  - Diferentes formatos de arquivo
  - Processamento assíncrono
  - Respostas e códigos de erro

### 3. **Testes de Performance** (`integration/`)

Testam performance e escalabilidade:

- **Throughput**: Documentos processados por segundo
- **Latência**: Tempo de resposta por documento
- **Memória**: Uso de memória sob carga
- **Concorrência**: Processamento simultâneo
- **Stress**: Comportamento sob carga pesada

## 📊 Métricas de Qualidade

Os testes verificam as seguintes métricas:

### Precisão da Extração
- **Score de Confiança**: ≥ 70% em média
- **Taxa de Sucessо**: ≥ 95% para dados válidos
- **Campos Obrigatórios**: 100% identificados em dados limpos

### Performance
- **Tempo por Documento**: < 5 segundos
- **Throughput**: ≥ 10 documentos/segundo
- **Uso de Memória**: < 500MB em pico
- **Fuzzy Matching**: < 500ms por busca

### Robustez
- **Taxa de Erro**: < 5% para dados válidos
- **Recuperação**: 100% dos erros tratados graciosamente
- **Consistência**: Resultados determinísticos

## 🔧 Fixtures e Dados de Teste

### Amostras de Faturas (`fixtures/sample_invoices.py`)

- **clean_invoice**: Dados perfeitos e bem formatados
- **messy_invoice**: Dados bagunçados típicos de OCR
- **incomplete_invoice**: Dados parciais e campos faltando
- **invalid_data_invoice**: Dados inválidos e corrompidos
- **large_invoice**: Fatura com muitos itens
- **service_invoice**: Nota fiscal de serviços
- **foreign_company**: Empresa estrangeira sem CNPJ

### Cenários de Erro

- **network_timeout**: Timeout de rede
- **ai_service_unavailable**: Serviço de IA indisponível
- **invalid_pdf**: PDF corrompido
- **image_too_small**: Imagem de baixa qualidade
- **ocr_failure**: Falha na extração de texto

### Dados de Fuzzy Matching

- Variações realistas de nomes de empresas
- Erros de digitação comuns
- Diferentes formatações de CNPJ
- Abreviações e sinônimos

## 🏷️ Marcadores de Teste

Os testes usam marcadores pytest para organização:

- `@pytest.mark.unit`: Testes unitários
- `@pytest.mark.integration`: Testes de integração
- `@pytest.mark.slow`: Testes que demoram (>1s)
- `@pytest.mark.requires_db`: Requer banco de dados
- `@pytest.mark.requires_ai`: Requer serviços de IA

## 📈 Relatórios

### Cobertura de Código
```bash
# Gerar relatório HTML
python run_tests.py --coverage

# Abrir relatório
open htmlcov/index.html
```

### Performance Profiling
```bash
# Com detalhes de duração
pytest --durations=10 -m slow

# Com profiling detalhado
pytest --profile --profile-svg
```

## 🔍 Debugging

### Logs Detalhados
```bash
# Com logs de debug
pytest --log-level=DEBUG -s

# Apenas falhas
pytest --tb=short --maxfail=1
```

### Modo Interativo
```bash
# Para no primeiro erro
pytest --pdb

# Com debugger ipdb
pytest --pdbcls=IPython.terminal.debugger:Pdb
```

## ✅ Critérios de Sucesso

Para que o sistema seja considerado robusto, todos os testes devem:

1. **✅ Passar**: Taxa de sucesso de 100% nos testes unitários
2. **⚡ Performance**: Atender métricas de tempo e memória
3. **🔒 Robustez**: Tratar todos os cenários de erro graciosamente
4. **📊 Cobertura**: ≥ 80% de cobertura de código
5. **🎯 Precisão**: ≥ 95% de precisão na extração de dados válidos

## 🚨 Monitoramento Contínuo

### CI/CD Integration
```yaml
# Exemplo para GitHub Actions
- name: Run Tests
  run: |
    python run_tests.py --coverage --parallel

- name: Upload Coverage
  uses: codecov/codecov-action@v1
```

### Alertas de Regressão
- Performance degradada > 20%
- Taxa de erro aumentada > 5%
- Cobertura de código < 80%
- Falhas em testes críticos

---

**💡 Dica**: Execute `python run_tests.py --help` para ver todas as opções disponíveis.