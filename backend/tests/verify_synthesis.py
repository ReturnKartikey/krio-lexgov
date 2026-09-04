import json
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

test_cases = [
    {"query": "Front Running", "mode": "risk_brief"},
    {"query": "Angel One", "mode": "precedent_analysis"},
    {"query": "Unregistered Advisory", "mode": "entity_exposure"},
    {"query": "Insider Trading", "mode": "risk_brief"},
    {"query": "Reliance", "mode": "risk_brief"},
    {"query": "", "mode": "risk_brief"},
]

for tc in test_cases:
    q = tc["query"]
    mode = tc["mode"]
    req = urllib.request.Request(
        "http://127.0.0.1:8005/api/ai/synthesize",
        data=json.dumps(tc).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        label = q if q else "FULL COHORT OVERVIEW"
        print(f"\n==================== TEST CASE: [{label}] (Mode: {mode}) ====================")
        print(f"HEADLINE:     {data['headline']}")
        print(
            f"ORDERS FOUND: {data['order_count']} | EXPOSURE: Rs. {data['total_penalty_exposure']:,.2f} | RISK: {data['risk_level']}"
        )
        print(f"CONFIDENCE:   {int(data['confidence_score'] * 100)}% Audit Grade")
        print(f"SUMMARY:      {data['executive_summary']}")
        print(f"STATUTES:     {data['applicable_statutes']}")
        print(f"TAKEAWAYS:    {data['compliance_takeaways']}")
        if data["precedents"]:
            p = data["precedents"][0]
            print(f"TOP PRECEDENT: {p['title']} [{p['external_id']}]")
            print(f"LEGAL FINDING: {p['key_finding']}")
            print(f"RESPONDENTS:   {p['respondents']}")
