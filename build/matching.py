from build.lore import (
    get_drug_suit, SIGN_ELEMENTS, ZODIAC_COMPAT, SIGNS,
    ANCESTOR_HERITAGE_GROUPS,
)


def score_zodiac(sign1, sign2):
    """Score zodiac compatibility (0-100). Sun, moon, or ascending."""
    s1 = sign1.strip().lower()
    s2 = sign2.strip().lower()
    return ZODIAC_COMPAT.get((s1, s2), 50)


def scale_display_scores(raw_scores_dict):
    """Scale raw scores to 90-100 display range using percentile rank.
    This ensures even spread across the range regardless of raw clustering.
    Returns dict of {id: display_score}.
    """
    # Sort by raw score to get rank
    sorted_items = sorted(raw_scores_dict.items(), key=lambda x: x[1])
    n = len(sorted_items)
    result = {}
    for rank, (mid, raw) in enumerate(sorted_items):
        # Percentile rank → 90-100
        percentile = rank / max(n - 1, 1)
        result[mid] = round(90.0 + percentile * 10.0, 1)
    return result


# --- Pre-computation for fast matching ---

# Element scoring lookup (all pairs pre-computed)
_ELEMENT_SCORES = {}

def _init_element_scores():
    elements = ["fire", "water", "earth", "air"]
    complement = {("fire", "air"), ("air", "fire"), ("water", "earth"), ("earth", "water")}
    moderate = {("fire", "earth"), ("earth", "fire"), ("air", "water"), ("water", "air")}
    for e1 in elements:
        for e2 in elements:
            if e1 == e2:
                _ELEMENT_SCORES[(e1, e2)] = (80, False)
            elif (e1, e2) in complement:
                _ELEMENT_SCORES[(e1, e2)] = (100, False)
            elif (e1, e2) in moderate:
                _ELEMENT_SCORES[(e1, e2)] = (50, False)
            else:
                _ELEMENT_SCORES[(e1, e2)] = (30, True)

_init_element_scores()

# Drug tarot scoring lookup
_DRUG_COMPLEMENT = {
    ("wands", "cups"): 100, ("cups", "wands"): 100,
    ("swords", "pentacles"): 100, ("pentacles", "swords"): 100,
}


def precompute_mibera(m):
    """Pre-compute all scoring lookups for a mibera. Call once per mibera."""
    anc = m.get("ancestor", "").strip().lower()
    tp = m.get("time_period", "").strip().lower()
    return {
        "sun": m["sun_sign"],       # already lowered in parse_csv
        "moon": m["moon_sign"],
        "asc": m["ascending_sign"],
        "element": m["element"],
        "archetype": m["archetype"],
        "drug_suit": get_drug_suit(m["drug"]),
        "anc_group": ANCESTOR_HERITAGE_GROUPS.get(anc, "unknown") if anc else "",
        "anc": anc,
        "tp": tp,
    }


def fast_match_score(p1, p2):
    """Compute match score using pre-computed values. Returns (score, is_chaotic)."""
    # Sun sign: 25%
    sun_score = ZODIAC_COMPAT.get((p1["sun"], p2["sun"]), 50)

    # Element: 15%
    el_score, el_chaos = _ELEMENT_SCORES.get((p1["element"], p2["element"]), (50, False))

    # Archetype: 15%
    arch_score = 100 if p1["archetype"] != p2["archetype"] else 40

    # Moon + ascending average: 15%
    moon_score = ZODIAC_COMPAT.get((p1["moon"], p2["moon"]), 50)
    asc_score = ZODIAC_COMPAT.get((p1["asc"], p2["asc"]), 50)
    moon_asc_score = (moon_score + asc_score) * 0.5

    # Drug tarot: 10%
    s1, s2 = p1["drug_suit"], p2["drug_suit"]
    if s1 == s2:
        drug_score = 60
    else:
        drug_score = _DRUG_COMPLEMENT.get((s1, s2), 70)

    # Ancestor: 10%
    a1, a2 = p1["anc"], p2["anc"]
    if not a1 or not a2:
        anc_score = 50
    elif a1 == a2:
        anc_score = 60
    elif p1["anc_group"] == p2["anc_group"] and p1["anc_group"] != "unknown":
        anc_score = 80
    elif p1["anc_group"] != "unknown" and p2["anc_group"] != "unknown":
        anc_score = 90
    else:
        anc_score = 50

    # Chaos: 5%
    chaos_bonus = 100 if el_chaos else 0

    # Time period: 5%
    t1, t2 = p1["tp"], p2["tp"]
    if not t1 or not t2:
        tp_score = 50
    elif t1 != t2:
        tp_score = 100
    else:
        tp_score = 70

    total = (
        sun_score * 0.25
        + el_score * 0.15
        + arch_score * 0.15
        + moon_asc_score * 0.15
        + drug_score * 0.10
        + anc_score * 0.10
        + chaos_bonus * 0.05
        + tp_score * 0.05
    )

    return round(total, 1), el_chaos


def find_best_match(mibera_id, all_precomputed, precomputed_ids):
    """Find the best match for a given Mibera using pre-computed data.
    Returns (match_id, score, chaos).
    """
    p1 = all_precomputed[mibera_id]
    best_id = None
    best_score = -1
    best_chaos = False

    for mid in precomputed_ids:
        if mid == mibera_id:
            continue
        score, chaos = fast_match_score(p1, all_precomputed[mid])
        if score > best_score:
            best_score = score
            best_id = mid
            best_chaos = chaos

    return best_id, best_score, best_chaos
