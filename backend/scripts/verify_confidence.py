import json
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

test_queries = [
    # 1. Broad / high-cardinality terms (Expected: LOW confidence 58%)
    "Limited",
    "Fund",
    "Trading",
    "Order",
    "India",
    # 2. Moderate scope terms (Expected: MODERATE confidence 74%)
    "Advisory",
    "Settlement",
    # 3. Exact target entities (Expected: HIGH confidence 98%)
    "Angel One",
    "Jetha",
    "Madhav Stock Vision",
]

for q in test_queries:
    req = urllib.request.Request(
        "http://127.0.0.1:8005/api/ai/synthesize",
        data=json.dumps({"query": q, "mode": "risk_brief"}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        score_pct = int(data["confidence_score"] * 100)
        grade = (
            "High Precision"
            if score_pct >= 85
            else ("Moderate Cohort" if score_pct >= 70 else "Low / High Dispersion")
        )
        print(
            f"QUERY: [{q:18}] -> Confidence: {score_pct}% ({grade}) | Matches: {data['order_count']} orders"
        )
