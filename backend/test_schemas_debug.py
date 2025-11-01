"""
Script de diagnóstico para identificar RecursionError nos schemas
"""
import sys
import traceback
from pathlib import Path

# Adicionar o diretório backend ao path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

print("=" * 80)
print("DIAGNÓSTICO DE RECURSÃO NOS SCHEMAS")
print("=" * 80)

# Teste 1: Importar módulo base
print("\n[1] Testando import do módulo cash_flow...")
try:
    from app.schemas import cash_flow
    print("✅ Módulo importado com sucesso")
except RecursionError as e:
    print("❌ RecursionError ao importar módulo!")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao importar módulo: {e}")
    traceback.print_exc()
    sys.exit(1)

# Teste 2: Importar classes específicas
print("\n[2] Testando import das classes individuais...")
try:
    from app.schemas.cash_flow import (
        AlertTypeEnum,
        AlertSeverityEnum,
        Alert,
        RecommendationTypeEnum,
        RecommendationPriorityEnum,
        Recommendation,
        AlertsAndRecommendationsResponse
    )
    print("✅ Classes importadas com sucesso")
except RecursionError as e:
    print("❌ RecursionError ao importar classes!")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao importar classes: {e}")
    traceback.print_exc()
    sys.exit(1)

# Teste 3: Criar instâncias
print("\n[3] Testando criação de instâncias...")
from datetime import datetime

try:
    alert = Alert(
        id="test-1",
        type=AlertTypeEnum.LOW_BALANCE,
        severity=AlertSeverityEnum.WARNING,
        title="Teste",
        message="Mensagem de teste",
        date=datetime.now(),
        value=1000.0,
        threshold=5000.0,
        is_read=False
    )
    print(f"✅ Alert criado: {alert.id}")
except RecursionError as e:
    print("❌ RecursionError ao criar Alert!")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao criar Alert: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    recommendation = Recommendation(
        id="test-1",
        type=RecommendationTypeEnum.REDUCE_COSTS,
        priority=RecommendationPriorityEnum.HIGH,
        title="Teste",
        description="Descrição de teste",
        potential_impact="Alto impacto",
        suggested_actions=["Ação 1", "Ação 2"],
        estimated_value=5000.0,
        confidence_score=0.8,
        created_at=datetime.now(),
        is_implemented=False
    )
    print(f"✅ Recommendation criado: {recommendation.id}")
except RecursionError as e:
    print("❌ RecursionError ao criar Recommendation!")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao criar Recommendation: {e}")
    traceback.print_exc()
    sys.exit(1)

# Teste 4: Criar Response
print("\n[4] Testando criação de AlertsAndRecommendationsResponse...")
try:
    response = AlertsAndRecommendationsResponse(
        alerts=[alert],
        recommendations=[recommendation],
        summary={"total": 1}
    )
    print(f"✅ Response criado com {len(response.alerts)} alertas")
except RecursionError as e:
    print("❌ RecursionError ao criar AlertsAndRecommendationsResponse!")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao criar Response: {e}")
    traceback.print_exc()
    sys.exit(1)

# Teste 5: Serialização JSON
print("\n[5] Testando serialização para dict/JSON...")
try:
    alert_dict = alert.model_dump()
    print(f"✅ Alert serializado: {len(alert_dict)} campos")
except RecursionError as e:
    print("❌ RecursionError ao serializar Alert!")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao serializar Alert: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    recommendation_dict = recommendation.model_dump()
    print(f"✅ Recommendation serializado: {len(recommendation_dict)} campos")
except RecursionError as e:
    print("❌ RecursionError ao serializar Recommendation!")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao serializar Recommendation: {e}")
    traceback.print_exc()
    sys.exit(1)

try:
    response_dict = response.model_dump()
    print(f"✅ Response serializado: {len(response_dict)} campos")
except RecursionError as e:
    print("❌ RecursionError ao serializar Response!")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao serializar Response: {e}")
    traceback.print_exc()
    sys.exit(1)

# Teste 6: Representação (repr)
print("\n[6] Testando repr() dos objetos...")
try:
    repr(alert)
    print("✅ Alert repr() OK")
except RecursionError as e:
    print("❌ RecursionError ao fazer repr(Alert)!")
    print(">>> ESTE É O PROBLEMA! O erro está no __repr__ do Alert")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao fazer repr(Alert): {e}")
    traceback.print_exc()

try:
    repr(recommendation)
    print("✅ Recommendation repr() OK")
except RecursionError as e:
    print("❌ RecursionError ao fazer repr(Recommendation)!")
    print(">>> ESTE É O PROBLEMA! O erro está no __repr__ do Recommendation")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao fazer repr(Recommendation): {e}")
    traceback.print_exc()

try:
    repr(response)
    print("✅ Response repr() OK")
except RecursionError as e:
    print("❌ RecursionError ao fazer repr(Response)!")
    print(">>> ESTE É O PROBLEMA! O erro está no __repr__ do Response")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao fazer repr(Response): {e}")
    traceback.print_exc()

# Teste 7: Schema JSON
print("\n[7] Testando model_json_schema()...")
try:
    schema = AlertsAndRecommendationsResponse.model_json_schema()
    print(f"✅ JSON Schema gerado com sucesso")
except RecursionError as e:
    print("❌ RecursionError ao gerar JSON Schema!")
    print(">>> ESTE É O PROBLEMA! O erro está no JSON Schema do Response")
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao gerar JSON Schema: {e}")
    traceback.print_exc()

print("\n" + "=" * 80)
print("✅ TODOS OS TESTES PASSARAM!")
print("=" * 80)
