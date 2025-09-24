#!/usr/bin/env python3
"""
Script para executar todos os testes do sistema de extração
"""
import subprocess
import sys
import argparse
from pathlib import Path


def run_command(command, description):
    """Executa um comando e retorna o resultado"""
    print(f"\n{'='*60}")
    print(f"🔄 {description}")
    print(f"{'='*60}")

    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent
        )

        if result.stdout:
            print(result.stdout)

        if result.stderr and result.returncode != 0:
            print("STDERR:", result.stderr)

        return result.returncode == 0

    except Exception as e:
        print(f"❌ Erro ao executar comando: {e}")
        return False


def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description="Executar testes do sistema de extração")
    parser.add_argument(
        "--type",
        choices=["unit", "integration", "performance", "all"],
        default="all",
        help="Tipo de teste a executar"
    )
    parser.add_argument(
        "--coverage",
        action="store_true",
        help="Gerar relatório de cobertura"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Modo verboso"
    )
    parser.add_argument(
        "--parallel",
        action="store_true",
        help="Executar testes em paralelo"
    )

    args = parser.parse_args()

    # Configurações base do pytest
    pytest_args = [
        "pytest",
        "--tb=short",
        "--strict-markers"
    ]

    if args.verbose:
        pytest_args.append("-v")

    if args.parallel:
        pytest_args.extend(["-n", "auto"])

    if args.coverage:
        pytest_args.extend([
            "--cov=app",
            "--cov-report=term-missing",
            "--cov-report=html:htmlcov",
            "--cov-fail-under=80"
        ])

    results = []

    print("🧪 Iniciando execução dos testes do sistema de extração")
    print(f"📂 Diretório: {Path(__file__).parent}")

    if args.type in ["unit", "all"]:
        print("\n" + "="*60)
        print("📋 TESTES UNITÁRIOS")
        print("="*60)

        # Testes unitários específicos
        unit_tests = [
            ("tests/unit/test_data_cleaner.py", "DataCleaner - Limpeza de dados"),
            ("tests/unit/test_supplier_matcher.py", "SupplierMatcher - Fuzzy matching"),
            ("tests/unit/test_document_processor.py", "DocumentProcessor - Processamento de documentos")
        ]

        for test_file, description in unit_tests:
            if Path(test_file).exists():
                cmd = " ".join(pytest_args + [test_file, "-m", "not slow"])
                success = run_command(cmd, f"Testes unitários: {description}")
                results.append(("Unit - " + description, success))
            else:
                print(f"⚠️  Arquivo de teste não encontrado: {test_file}")

    if args.type in ["integration", "all"]:
        print("\n" + "="*60)
        print("🔗 TESTES DE INTEGRAÇÃO")
        print("="*60)

        integration_tests = [
            ("tests/integration/test_invoice_upload_api.py", "API de upload de faturas"),
        ]

        for test_file, description in integration_tests:
            if Path(test_file).exists():
                cmd = " ".join(pytest_args + [test_file, "-m", "integration"])
                success = run_command(cmd, f"Testes de integração: {description}")
                results.append(("Integration - " + description, success))

    if args.type in ["performance", "all"]:
        print("\n" + "="*60)
        print("⚡ TESTES DE PERFORMANCE")
        print("="*60)

        performance_tests = [
            ("tests/integration/test_extraction_performance.py", "Performance do sistema de extração")
        ]

        for test_file, description in performance_tests:
            if Path(test_file).exists():
                cmd = " ".join(pytest_args + [test_file, "-m", "slow", "--durations=10"])
                success = run_command(cmd, f"Testes de performance: {description}")
                results.append(("Performance - " + description, success))

    # Relatório final
    print("\n" + "="*60)
    print("📊 RELATÓRIO FINAL")
    print("="*60)

    passed = sum(1 for _, success in results if success)
    total = len(results)

    for test_name, success in results:
        status = "✅ PASSOU" if success else "❌ FALHOU"
        print(f"{status} - {test_name}")

    print(f"\n📈 Resumo: {passed}/{total} suites de teste passaram")

    if args.coverage and Path("htmlcov/index.html").exists():
        print(f"📄 Relatório de cobertura: file://{Path('htmlcov/index.html').absolute()}")

    # Comandos úteis
    print("\n" + "="*60)
    print("🛠️  COMANDOS ÚTEIS")
    print("="*60)
    print("# Executar testes específicos:")
    print("python run_tests.py --type unit")
    print("python run_tests.py --type integration")
    print("python run_tests.py --type performance")
    print()
    print("# Com cobertura de código:")
    print("python run_tests.py --coverage")
    print()
    print("# Modo verboso:")
    print("python run_tests.py --verbose")
    print()
    print("# Executar em paralelo:")
    print("python run_tests.py --parallel")
    print()
    print("# Executar teste específico:")
    print("pytest tests/unit/test_data_cleaner.py::TestDataCleaner::test_clean_cnpj -v")

    # Status de saída
    if passed == total:
        print("\n🎉 Todos os testes passaram!")
        sys.exit(0)
    else:
        print(f"\n💥 {total - passed} suite(s) de teste falharam!")
        sys.exit(1)


if __name__ == "__main__":
    main()