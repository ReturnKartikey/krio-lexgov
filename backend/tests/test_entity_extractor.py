from app.etl.entity_extractor import (
    extract_entities_from_text,
    extract_location,
    extract_penalties,
    extract_regulations,
    normalize_entity_name,
    parse_inr_amount,
)


def test_normalize_entity_name():
    assert (
        normalize_entity_name("Reliance Infrastructure Advisory Pvt Ltd")
        == "reliance infrastructure advisory"
    )
    assert normalize_entity_name("M/s. Zenith Birla (India) Limited") == "zenith birla india"
    assert normalize_entity_name("Shri Arvind Shenoy") == "arvind shenoy"


def test_parse_inr_amount():
    assert parse_inr_amount("25,00,000") == 2500000.0
    assert parse_inr_amount("1.50", "Crore") == 15000000.0
    assert parse_inr_amount("50", "Lakhs") == 5000000.0
    assert parse_inr_amount("10000") == 10000.0


def test_extract_penalties():
    text = "The Adjudicating Officer hereby imposes a monetary penalty of Rs. 25,00,000/- on the Noticees."
    amount = extract_penalties(text)
    assert amount == 2500000.0


def test_extract_entities_from_text():
    title = "Adjudication order in respect of Reliance Infrastructure Advisory Pvt Ltd and Shri Rajesh Agrawal"
    body = "Apex Securities LLP also participated in the synchronized trades."
    entities = extract_entities_from_text(title, body)

    names = [e.name for e in entities]
    assert any("Reliance Infrastructure Advisory" in n for n in names)
    assert any("Rajesh Agrawal" in n for n in names)


def test_extract_location():
    text = "Order passed at Mumbai Bench, Maharashtra regarding violation at BSE."
    jurisdiction, state, city = extract_location(text)
    assert state == "Maharashtra"
    assert city == "Mumbai"


def test_extract_regulations():
    text = "Violations under Section 15HA of the SEBI Act and PFUTP Regulations, 2003 observed."
    regs = extract_regulations(text)
    assert any("PFUTP Regulations" in r for r in regs)
    assert any("Section 15HA" in r for r in regs)
