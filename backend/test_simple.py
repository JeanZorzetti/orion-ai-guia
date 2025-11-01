import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

print("Test 1: Import schemas...")
from app.schemas.cash_flow import Alert, Recommendation, AlertsAndRecommendationsResponse
print("SUCCESS: Schemas imported")

print("\nTest 2: Create instances...")
from datetime import datetime
alert = Alert(
    id="1",
    type="low_balance",
    severity="warning",
    title="Test",
    message="Test message",
    date=datetime.now()
)
print(f"SUCCESS: Alert created with id={alert.id}")

rec = Recommendation(
    id="1",
    type="reduce_costs",
    priority="high",
    title="Test",
    description="Test desc",
    potential_impact="High",
    suggested_actions=["Action 1"],
    confidence_score=0.8,
    created_at=datetime.now()
)
print(f"SUCCESS: Recommendation created with id={rec.id}")

response = AlertsAndRecommendationsResponse(
    alerts=[alert],
    recommendations=[rec],
    summary={"total": 1}
)
print(f"SUCCESS: Response created with {len(response.alerts)} alerts")

print("\nTest 3: Serialize to dict...")
response_dict = response.model_dump()
print(f"SUCCESS: Serialized with {len(response_dict)} keys")

print("\nALL TESTS PASSED!")
