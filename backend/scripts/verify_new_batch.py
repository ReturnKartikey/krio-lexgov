import json
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

new_test_values = [
    {"name": "Bharat Global", "type": "Listed Agro/Infra Developer"},
    {"name": "Nirman Agri", "type": "Listed Hybrid Seeds Company"},
    {"name": "Max Financial", "type": "Financial Services Holding Group"},
    {"name": "Vadilal", "type": "Famous Ice Cream & Food Brand"},
    {"name": "Corporate Capital", "type": "SEBI-Registered Merchant Banker"},
    {"name": "Advantedge", "type": "Early-Stage Tech Venture Fund"},
    {"name": "Kshitij", "type": "Venture Capital AIF Fund"},
    {"name": "Saurashtra", "type": "Cement Manufacturing Corporation"},
]

print("\n" + "=" * 80)
print("           BRAND NEW VERIFIED VALUES FOR SYNTHESIZER TESTING (`⌘K`)")
print("=" * 80 + "\n")

for item in new_test_values:
    val = item["name"]
    category = item["type"]
    req = urllib.request.Request(
        "http://127.0.0.1:8005/api/ai/synthesize",
        data=json.dumps({"query": val, "mode": "risk_brief"}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        d = json.loads(resp.read().decode("utf-8"))
        exposure = d["total_penalty_exposure"]
        amt_str = f"Rs. {exposure:,.2f}" if exposure > 0 else "Non-Monetary Injunction"
        score_str = f"{int(d['confidence_score'] * 100)}%"
        p = d["precedents"][0]

        print(f"🔹 QUERY: [{val}]  ({category})")
        print(f"   • Expected Orders:    {d['order_count']} Proceeding(s)")
        print(f"   • Expected Exposure:  {amt_str}")
        print(f"   • Risk Level:         {d['risk_level']} ENFORCEMENT INTENSITY")
        print(f"   • Confidence Score:   {score_str} Audit Grade")
        print(f"   • Matched Case:       {p['title']}")
        print(f"   • Case External ID:   {p['external_id']}")
        print(f"   • Primary Statute:    {d['applicable_statutes'][0]}")
        print(f"   • Noticees Tracked:   {p['respondents']}")
        print("-" * 80)
