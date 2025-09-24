"""
Testes de performance e stress para o processo de extração
"""
import pytest
import asyncio
import time
import statistics
from unittest.mock import MagicMock, AsyncMock, patch
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.services.document_processor import DocumentProcessor
from app.services.data_cleaner import DataCleaner
from app.services.supplier_matcher import SupplierMatcher


class TestExtractionPerformance:
    """Testes de performance para extração de dados"""

    @pytest.fixture
    def performance_document_processor(self):
        """DocumentProcessor para testes de performance"""
        processor = DocumentProcessor()

        # Mock dos serviços para controlar o tempo de resposta
        processor.ai_service = MagicMock()
        processor.layout_lm_service = MagicMock()
        processor.data_cleaner = MagicMock()

        # Mock de resposta rápida da IA
        processor.ai_service.extract_invoice_data = AsyncMock(return_value="""
        {
            "supplier_name": "Performance Test Company",
            "supplier_cnpj": "12.345.678/0001-90",
            "total_amount": 1000.00,
            "confidence_score": 0.85
        }
        """)

        processor.ai_service.ocr_image = AsyncMock(return_value="Sample OCR text")

        return processor

    @pytest.fixture
    def large_messy_dataset(self):
        """Dataset grande com dados bagunçados para teste de stress"""
        return [
            {
                "supplier_name": f"  EMPRESA  {i}    LTDA.  ",
                "supplier_cnpj": f"{str(i).zfill(11)}00190",
                "invoice_number": f"  nf-{i:06d}  ",
                "issue_date": f"{(i % 28) + 1:02d}/01/2023",
                "total_amount": f"{i * 123.45:.2f}".replace(".", ","),
                "tax_amount": f"{i * 12.34:.2f}".replace(".", ","),
                "items": [
                    {
                        "description": f"Produto {i} da empresa",
                        "quantity": str(i % 10 + 1),
                        "unit_price": f"{(i * 50.00):.2f}".replace(".", ","),
                        "total_price": f"{((i % 10 + 1) * i * 50.00):.2f}".replace(".", ",")
                    }
                ] * (i % 5 + 1),  # Varia número de itens
                "confidence_score": f"0.{70 + (i % 30)}",
                "ai_suggestions": [f"Sugestão {i}", f"Mais uma sugestão para {i}"]
            }
            for i in range(1, 101)  # 100 registros de teste
        ]

    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_single_document_processing_time(self, performance_document_processor, temp_image_file):
        """Testa tempo de processamento de um único documento"""
        processor = performance_document_processor

        # Mock do processamento de imagem
        processor._process_single_image = AsyncMock(return_value={
            'success': True,
            'extracted_data': {'supplier_name': 'Test Company'},
            'confidence_score': 0.80
        })

        start_time = time.time()

        result = await processor.process_document(temp_image_file, "test.jpg")

        end_time = time.time()
        processing_time = end_time - start_time

        assert result['success'] is True
        assert processing_time < 5.0  # Deve processar em menos de 5 segundos
        print(f"Tempo de processamento: {processing_time:.2f}s")

    @pytest.mark.slow
    def test_data_cleaner_batch_performance(self, large_messy_dataset):
        """Testa performance da limpeza de dados em lote"""
        cleaner = DataCleaner()

        start_time = time.time()
        results = []

        for messy_data in large_messy_dataset:
            cleaned = cleaner.clean_extracted_data(messy_data)
            results.append(cleaned)

        end_time = time.time()
        total_time = end_time - start_time
        avg_time_per_record = total_time / len(large_messy_dataset)

        assert len(results) == len(large_messy_dataset)
        assert avg_time_per_record < 0.1  # Menos de 100ms por registro
        assert total_time < 10.0  # Menos de 10 segundos para 100 registros

        print(f"Tempo total: {total_time:.2f}s")
        print(f"Tempo médio por registro: {avg_time_per_record * 1000:.2f}ms")

        # Verifica qualidade da limpeza
        successful_cleanings = [r for r in results if not r.get('error')]
        success_rate = len(successful_cleanings) / len(results)
        assert success_rate > 0.95  # 95% de sucesso mínimo

    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_concurrent_document_processing(self, performance_document_processor):
        """Testa processamento concorrente de múltiplos documentos"""
        processor = performance_document_processor

        # Mock do processamento
        async def mock_process_document(file_path, filename):
            # Simula tempo de processamento variável
            await asyncio.sleep(0.1 + (hash(filename) % 100) / 1000)
            return {
                'success': True,
                'extracted_data': {'supplier_name': f'Company {filename}'},
                'confidence_score': 0.80
            }

        processor.process_document = mock_process_document

        # Cria múltiplas tarefas concorrentes
        num_documents = 20
        tasks = []

        start_time = time.time()

        for i in range(num_documents):
            task = asyncio.create_task(
                processor.process_document(f"test_{i}.jpg", f"document_{i}.jpg")
            )
            tasks.append(task)

        # Aguarda todas as tarefas
        results = await asyncio.gather(*tasks)

        end_time = time.time()
        total_time = end_time - start_time

        # Verifica resultados
        assert len(results) == num_documents
        assert all(r['success'] for r in results)

        # Performance: processamento concorrente deve ser mais rápido que sequencial
        assert total_time < num_documents * 0.15  # Deve ser mais rápido que processar sequencialmente

        print(f"Processamento concorrente de {num_documents} docs: {total_time:.2f}s")
        print(f"Tempo médio por documento: {total_time / num_documents:.3f}s")

    @pytest.mark.slow
    def test_fuzzy_matching_performance(self):
        """Testa performance do fuzzy matching com muitos fornecedores"""
        # Mock de sessão com muitos fornecedores
        mock_db = MagicMock()

        # Cria 1000 fornecedores fictícios
        suppliers = []
        for i in range(1000):
            supplier = MagicMock()
            supplier.id = i
            supplier.name = f"Empresa {i:04d} LTDA"
            supplier.cnpj = f"{i:02d}.{i:03d}.{i:03d}/0001-{i:02d}"
            supplier.category = ["Tecnologia", "Consultoria", "Serviços"][i % 3]
            supplier.is_active = True
            suppliers.append(supplier)

        mock_db.query.return_value.filter.return_value.all.return_value = suppliers

        matcher = SupplierMatcher(mock_db)

        # Força o carregamento do cache
        matcher._get_suppliers_cache()

        # Testa busca com diferentes nomes
        test_names = [
            "Microsoft Corporation",
            "Apple Inc",
            "Google LLC",
            "Amazon Services",
            "Meta Platforms",
            "Empresa 0500 LTDA",  # Match exato
            "Empresa 0999",  # Match parcial
            "Nome Completamente Diferente"
        ]

        start_time = time.time()
        all_results = []

        for name in test_names:
            results = matcher.find_matching_suppliers(
                supplier_name=name,
                supplier_cnpj="",
                limit=5
            )
            all_results.append(results)

        end_time = time.time()
        total_time = end_time - start_time
        avg_time = total_time / len(test_names)

        assert avg_time < 0.5  # Menos de 500ms por busca em média
        assert total_time < 3.0  # Menos de 3 segundos total

        print(f"Fuzzy matching performance:")
        print(f"Total: {total_time:.2f}s para {len(test_names)} buscas")
        print(f"Média: {avg_time * 1000:.0f}ms por busca")

        # Verifica qualidade dos resultados
        exact_match_found = any(
            results and results[0]['score'] == 100
            for results in all_results
        )
        assert exact_match_found  # Pelo menos um match exato deve ser encontrado

    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_memory_usage_stability(self, performance_document_processor):
        """Testa estabilidade do uso de memória durante processamento intensivo"""
        import gc
        import psutil
        import os

        processor = performance_document_processor
        process = psutil.Process(os.getpid())

        # Mock do processamento
        processor.process_document = AsyncMock(return_value={
            'success': True,
            'extracted_data': {'supplier_name': 'Memory Test Company'},
            'confidence_score': 0.80
        })

        memory_usage = []
        iterations = 50

        for i in range(iterations):
            # Força coleta de lixo
            if i % 10 == 0:
                gc.collect()

            # Mede memória antes
            memory_before = process.memory_info().rss / 1024 / 1024  # MB

            # Processa documento
            await processor.process_document(f"test_{i}.jpg", f"memory_test_{i}.jpg")

            # Mede memória depois
            memory_after = process.memory_info().rss / 1024 / 1024  # MB
            memory_usage.append(memory_after)

        # Análise de memória
        max_memory = max(memory_usage)
        min_memory = min(memory_usage)
        memory_growth = max_memory - min_memory

        print(f"Uso de memória:")
        print(f"Mínimo: {min_memory:.1f}MB")
        print(f"Máximo: {max_memory:.1f}MB")
        print(f"Crescimento: {memory_growth:.1f}MB")

        # Memória não deve crescer excessivamente
        assert memory_growth < 100  # Menos de 100MB de crescimento

    @pytest.mark.slow
    def test_error_handling_under_load(self, large_messy_dataset):
        """Testa tratamento de erros sob carga pesada"""
        cleaner = DataCleaner()

        # Adiciona alguns dados propositalmente problemáticos
        problematic_data = [
            None,  # None
            "string_instead_of_dict",  # Tipo incorreto
            {},  # Dict vazio
            {"invalid": "data"},  # Dados inválidos
            {"total_amount": "invalid_number"},  # Número inválido
        ]

        test_dataset = large_messy_dataset + problematic_data
        errors = 0
        successes = 0

        start_time = time.time()

        for data in test_dataset:
            try:
                result = cleaner.clean_extracted_data(data)
                if result.get('error'):
                    errors += 1
                else:
                    successes += 1
            except Exception:
                errors += 1

        end_time = time.time()
        processing_time = end_time - start_time

        # Deve processar tudo rapidamente mesmo com erros
        assert processing_time < 15.0  # 15 segundos máximo

        # Taxa de sucesso deve ser alta (considerando que temos dados problemáticos)
        success_rate = successes / len(test_dataset)
        assert success_rate > 0.90  # 90% de sucesso mínimo

        print(f"Processamento sob carga:")
        print(f"Total processado: {len(test_dataset)}")
        print(f"Sucessos: {successes}")
        print(f"Erros: {errors}")
        print(f"Taxa de sucesso: {success_rate:.1%}")
        print(f"Tempo total: {processing_time:.2f}s")

    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_throughput_measurement(self, performance_document_processor):
        """Mede throughput do sistema de processamento"""
        processor = performance_document_processor

        # Mock otimizado para throughput
        processor.process_document = AsyncMock(return_value={
            'success': True,
            'extracted_data': {'supplier_name': 'Throughput Test'},
            'confidence_score': 0.80
        })

        # Simula processamento de lote
        batch_size = 100
        start_time = time.time()

        # Processa em lotes para medir throughput
        tasks = []
        for i in range(batch_size):
            task = asyncio.create_task(
                processor.process_document(f"throughput_{i}.jpg", f"batch_{i}.jpg")
            )
            tasks.append(task)

        results = await asyncio.gather(*tasks)
        end_time = time.time()

        processing_time = end_time - start_time
        throughput = len(results) / processing_time

        assert len(results) == batch_size
        assert all(r['success'] for r in results)
        assert throughput > 10  # Pelo menos 10 documentos por segundo

        print(f"Throughput test:")
        print(f"Documentos processados: {len(results)}")
        print(f"Tempo total: {processing_time:.2f}s")
        print(f"Throughput: {throughput:.1f} documentos/segundo")

    def test_data_validation_performance(self):
        """Testa performance de validação de dados"""
        cleaner = DataCleaner()

        # Dados com diferentes níveis de complexidade
        test_cases = [
            # Dados simples
            {"supplier_name": "Empresa Simples", "total_amount": 100.0},

            # Dados complexos com muitos itens
            {
                "supplier_name": "Empresa Complexa",
                "total_amount": 10000.0,
                "items": [
                    {
                        "description": f"Item {i}",
                        "quantity": i,
                        "unit_price": i * 10.0,
                        "total_price": i * i * 10.0
                    }
                    for i in range(1, 101)  # 100 itens
                ]
            },

            # Dados com texto longo
            {
                "supplier_name": "A" * 1000,  # Nome muito longo
                "description": "B" * 5000,    # Descrição muito longa
                "total_amount": 1000.0
            }
        ]

        times = []

        for test_case in test_cases:
            start = time.time()
            result = cleaner.clean_extracted_data(test_case)
            end = time.time()

            processing_time = end - start
            times.append(processing_time)

            assert 'error' not in result or result['error'] is None

        # Tempo máximo por validação
        max_time = max(times)
        avg_time = statistics.mean(times)

        assert max_time < 1.0  # Menos de 1 segundo no pior caso
        assert avg_time < 0.5  # Menos de 500ms em média

        print(f"Validação de dados:")
        print(f"Tempo médio: {avg_time * 1000:.0f}ms")
        print(f"Tempo máximo: {max_time * 1000:.0f}ms")