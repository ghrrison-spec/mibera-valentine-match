from build.lore import (
    get_drug_suit, SIGN_ELEMENTS, ZODIAC_COMPAT, SIGNS
)


def score_zodiac(sign1, sign2):
    """Score zodiac compatibility (0-100). Sun, moon, or ascending."""
    s1 = sign1.strip().lower()
    s2 = sign2.strip().lower()
    return ZODIAC_COMPAT.get((s1, s2), 50)


def score_element(el1, el2):
    """Score element pairing (0-100). Returns (score, is_chaotic)."""
    e1 = el1.strip().lower()
    e2 = el2.strip().lower()

    complement = {
        ("fire", "air"): 100, ("air", "fire"): 100,
        ("water", "earth"): 100, ("earth", "water"): 100,
    }
    if e1 == e2:
        return 80, False
    if (e1, e2) in complement:
        return 100, False

    # Moderate
    moderate = {
        ("fire", "earth"): 50, ("earth", "fire"): 50,
        ("air", "water"): 50, ("water", "air"): 50,
    }
    if (e1, e2) in moderate:
        return 50, False

    # Chaotic: fire+water, earth+air
    return 30, True


def score_archetype(arch1, arch2):
    """Different archetypes score higher (opposites attract)."""
    a1 = arch1.strip().lower()
    a2 = arch2.strip().lower()
    return 100 if a1 != a2 else 40


def score_drug_tarot(drug1, drug2):
    """Complementary tarot suits score highest."""
    s1 = get_drug_suit(drug1)
    s2 = get_drug_suit(drug2)

    complement = {
        ("wands", "cups"): 100, ("cups", "wands"): 100,
        ("swords", "pentacles"): 100, ("pentacles", "swords"): 100,
    }
    if s1 == s2:
        return 60
    return complement.get((s1, s2), 70)


def compute_match_score(m1, m2):
    """Compute weighted match score between two Miberas.
    Returns (total_score, is_chaotic).
    """
    sun_score = score_zodiac(m1["sun_sign"], m2["sun_sign"])

    el_score, el_chaos = score_element(m1["element"], m2["element"])

    arch_score = score_archetype(m1["archetype"], m2["archetype"])

    moon_score = score_zodiac(m1["moon_sign"], m2["moon_sign"])
    asc_score = score_zodiac(m1["ascending_sign"], m2["ascending_sign"])
    moon_asc_score = (moon_score + asc_score) / 2

    drug_score = score_drug_tarot(m1["drug"], m2["drug"])

    chaos = el_chaos
    chaos_bonus = 100 if chaos else 0

    total = (
        sun_score * 0.30
        + el_score * 0.20
        + arch_score * 0.20
        + moon_asc_score * 0.15
        + drug_score * 0.10
        + chaos_bonus * 0.05
    )

    return round(total, 1), chaos


def find_best_match(mibera_id, all_miberas):
    """Find the best match for a given Mibera. Returns (match_id, score, chaos)."""
    m1 = all_miberas[mibera_id]
    best_id = None
    best_score = -1
    best_chaos = False

    for mid, m2 in all_miberas.items():
        if mid == mibera_id:
            continue
        score, chaos = compute_match_score(m1, m2)
        if score > best_score:
            best_score = score
            best_id = mid
            best_chaos = chaos

    return best_id, best_score, best_chaos
