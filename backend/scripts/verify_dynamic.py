import json
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

# Arbitrary, unique terms to prove dynamic database retrieval & synthesis
queries = [
    "Kalahridhaan",
    "Cressanda",
    "Modulus",
    "Mudassir",
    "TotallyUnrelatedCompanyNameXYZ",
]

for q in queries:
    req = urllib.request.Request(
        "http://127.0.0.1:8005/api/ai/synthesize",
        data=json.dumps({"query": q, "mode": "risk_brief"}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(f"QUERY: [{q}]")
        print(
            f"  • Matched Orders: {data['order_count']} | Penalty Exposure: Rs. {data['total_penalty_exposure']:,.2f}"
        )
        print(f"  • Headline:       {data['headline']}")
        print(f"  • Live Summary:   {data['executive_summary']}")
        print(f"  • Precedents:     {[p['title'] for p in data['precedents']]}")
        print(f"  • Statutes:       {data['applicable_statutes']}")
        print("-" * 75)
