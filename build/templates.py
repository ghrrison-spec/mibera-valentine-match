import random

from build.lore import (
    ARCHETYPES, get_drug_suit, SIGN_ELEMENTS,
    ANCESTOR_DESCRIPTIONS, BACKGROUND_CATEGORIES, BACKGROUND_FLAVOR,
)


# --- Openers ---

OPENERS_HARMONY = [
    "The stars aligned for this one.",
    "Written in the cosmos long before they met.",
    "Some connections are just inevitable.",
    "The universe had this planned all along.",
    "A cosmic bond that transcends time.",
    "Destiny doesn't ask permission.",
    "The zodiac whispered this match into being.",
    "Two souls on the same wavelength.",
]

OPENERS_CONTRAST = [
    "Opposites don't just attract — they ignite.",
    "Different worlds, one undeniable pull.",
    "They shouldn't work together. And yet.",
    "Where contrast meets chemistry.",
    "The best matches break the rules.",
    "Two different frequencies, one perfect harmony.",
    "They came from opposite ends of the spectrum.",
    "Nobody saw this coming — except the stars.",
]

OPENERS_CHAOS = [
    "Against all cosmic odds, this happened.",
    "The universe threw the rulebook out for this one.",
    "Chaos brought them together, and it's beautiful.",
    "Some matches are forged in cosmic turbulence.",
    "When the elements clash, sparks fly.",
    "This match defies every astrological textbook.",
    "The stars couldn't agree — so they made it work anyway.",
    "Pure chaos energy. Pure magic.",
]

# --- Archetype contrast/harmony lines ---

def archetype_line(a1, a2):
    """Generate a line about archetype pairing."""
    k1 = a1.strip().lower()
    k2 = a2.strip().lower()
    default = {"name": a1, "long": a1, "desc": a1, "season": "eternal"}
    info1 = ARCHETYPES.get(k1, default)
    default2 = {"name": a2, "long": a2, "desc": a2, "season": "eternal"}
    info2 = ARCHETYPES.get(k2, default2)

    if k1 == k2:
        same_lines = [
            f"Both {info1['name']} through and through — they speak the same language of {info1['long']}.",
            f"Two {info1['name']} souls vibrating on the exact same frequency.",
            f"Shared {info1['name']} roots mean they understand each other without words.",
        ]
        return random.choice(same_lines)

    diff_lines = [
        f"Where {info1['long']} meets {info2['long']} — worlds collide in the best way.",
        f"{info1['name']} energy fused with {info2['name']} spirit creates something entirely new.",
        f"The {info1['desc']} of one and the {info2['desc']} of the other — a perfect counterbalance.",
        f"From {info1['name']}'s {info1['season']} heat to {info2['name']}'s {info2['season']} cool — the full spectrum.",
    ]
    return random.choice(diff_lines)


# --- Zodiac lines ---

ZODIAC_LINES = {
    100: [  # Opposite signs
        "{s1} and {s2} sit across the zodiac wheel, drawn together by cosmic magnetism.",
        "{s1} and {s2}: the ultimate axis of attraction in astrology.",
        "The {s1}-{s2} axis is one of the most powerful connections in the zodiac.",
    ],
    95: [  # Complementary elements
        "{s1} and {s2} feed each other's fire — a naturally harmonious pair.",
        "The {s1}-{s2} connection flows effortlessly, like their elements were made to dance.",
        "{s1} breathes life into {s2}, and {s2} gives {s1} direction.",
    ],
    90: [  # Same element
        "{s1} and {s2} share the same elemental soul — instant understanding.",
        "Both {s1} and {s2} run on {el} energy — a deep, intuitive bond.",
        "Same element, same wavelength: {s1} and {s2} just get each other.",
    ],
    80: [  # Same sign
        "Two {s1}s together? Double the intensity, double the passion.",
        "{s1} meets {s1} — they're mirrors of each other in the best way.",
        "Same sign, same soul: this {s1}-{s1} bond runs deep.",
    ],
    50: [  # Challenging
        "{s1} and {s2} challenge each other — and that's exactly what makes it electric.",
        "The tension between {s1} and {s2} is the kind that sparks growth.",
        "{s1} and {s2} don't take the easy road, but the view is worth it.",
    ],
}

def zodiac_line(sign1, sign2, score):
    """Generate a zodiac compatibility line."""
    s1 = sign1.strip().lower()
    s2 = sign2.strip().lower()
    el = SIGN_ELEMENTS.get(s1, "cosmic")

    bucket = 50
    for threshold in sorted(ZODIAC_LINES.keys()):
        if score >= threshold:
            bucket = threshold

    templates = ZODIAC_LINES[bucket]
    template = random.choice(templates)
    return template.format(
        s1=s1.capitalize(),
        s2=s2.capitalize(),
        el=el,
    )


# --- Element/drug lines ---

ELEMENT_LINES = {
    ("fire", "air"): [
        "Fire feeds Air and the flames grow brighter.",
        "Air fans Fire's blaze — together they're unstoppable.",
    ],
    ("water", "earth"): [
        "Water nourishes Earth — a grounding, nurturing bond.",
        "Earth gives Water form, and Water gives Earth life.",
    ],
    ("fire", "fire"): [
        "Double Fire — this match burns bright and fierce.",
        "Two flames merging into a bonfire of passion.",
    ],
    ("water", "water"): [
        "Two Water souls — flowing together into something deep.",
        "Water meets Water — emotions run deep and true.",
    ],
    ("earth", "earth"): [
        "Earth on Earth — steady, solid, built to last.",
        "Grounded in the same element, their foundation is unshakable.",
    ],
    ("air", "air"): [
        "Air meets Air — ideas swirl and minds connect instantly.",
        "Two Air signs create a whirlwind of connection.",
    ],
    ("fire", "water"): [
        "Fire and Water shouldn't mix — but when they do, steam rises.",
        "The clash of Fire and Water creates something the cosmos never planned.",
    ],
    ("earth", "air"): [
        "Earth and Air seem worlds apart, but the wind shapes the mountain.",
        "Where groundedness meets flight — an unlikely but magnetic pull.",
    ],
    ("fire", "earth"): [
        "Fire warms Earth from within — a slow-burning, steady flame.",
        "Earth contains Fire's wildness, turning chaos into creation.",
    ],
    ("air", "water"): [
        "Air ripples across Water's surface — subtle, beautiful, transformative.",
        "Wind and waves — unpredictable apart, mesmerizing together.",
    ],
}

# Drug-specific ritual lines (more specific than generic drug mentions)
DRUG_RITUAL_LINES = {
    "ayahuasca": "Their shared affinity for ayahuasca opens doorways between worlds.",
    "dmt": "DMT showed them the same hyperspace — now they navigate it together.",
    "peyote": "Peyote visions led them both to the same desert truth.",
    "lsd": "Acid opened the same doors in both their minds.",
    "mdma": "MDMA dissolved the walls between them before they even met.",
    "ketamine": "Ketamine took them to the same hole — and they found each other there.",
    "mushrooms": "The mycelium network connected their consciousness long ago.",
    "weed": "A shared love of herb keeps the conversation flowing endlessly.",
    "ibogaine": "Ibogaine stripped them both down to their core — and the cores matched.",
    "kava": "Kava ceremonies taught them both the art of communal calm.",
}

def element_drug_line(el1, el2, drug1, drug2):
    """Generate element/drug connection line."""
    e1 = el1.strip().lower()
    e2 = el2.strip().lower()

    # Normalize key order
    key = (e1, e2)
    if key not in ELEMENT_LINES:
        key = (e2, e1)
    if key not in ELEMENT_LINES:
        key = (e1, e2)  # fallback

    templates = ELEMENT_LINES.get(key, [
        f"Their {e1} and {e2} energies create an unexpected resonance.",
    ])
    line = random.choice(templates)

    # Add drug flavor if both have meaningful drugs
    d1 = drug1.strip().lower()
    d2 = drug2.strip().lower()
    if d1 and d2 and d1 != "sober" and d2 != "sober":
        # Check for specific drug ritual lines first
        if d1 == d2 and d1 in DRUG_RITUAL_LINES:
            line += " " + DRUG_RITUAL_LINES[d1]
        elif d1 in DRUG_RITUAL_LINES:
            line += " " + DRUG_RITUAL_LINES[d1]
        elif d2 in DRUG_RITUAL_LINES:
            line += " " + DRUG_RITUAL_LINES[d2]
        else:
            suit1 = get_drug_suit(d1)
            suit2 = get_drug_suit(d2)
            if suit1 != suit2:
                line += f" Their shared rituals — {d1} and {d2} — bridge the gap between worlds."
            else:
                line += f" A mutual affinity for {d1} and {d2} seals the bond."

    return line


# --- Ancestor lines ---

ANCESTOR_PAIR_TEMPLATES = [
    "{desc1} meets {desc2} — two ancestral traditions converging across centuries.",
    "The wisdom of {a1} ancestry fused with {a2} heritage creates something timeless.",
    "From {a1} bloodlines to {a2} roots — the ancestors approve this union.",
    "{desc1} and {desc2}: when lineages intertwine, new legends are born.",
]

ANCESTOR_SAME_TEMPLATES = [
    "Both carry {a1} ancestry in their veins — a bond written in shared blood.",
    "Two {a1} souls recognizing each other across the digital void.",
    "The {a1} ancestors sent them both — one to find the other.",
]

def ancestor_line(anc1, anc2):
    """Generate a line about ancestor pairing."""
    a1 = anc1.strip().lower()
    a2 = anc2.strip().lower()
    if not a1 or not a2:
        return ""

    desc1 = ANCESTOR_DESCRIPTIONS.get(a1, f"{a1} heritage bearer")
    desc2 = ANCESTOR_DESCRIPTIONS.get(a2, f"{a2} heritage bearer")

    if a1 == a2:
        template = random.choice(ANCESTOR_SAME_TEMPLATES)
        return template.format(a1=a1.title(), desc1=desc1, desc2=desc2)

    template = random.choice(ANCESTOR_PAIR_TEMPLATES)
    return template.format(
        a1=a1.title(), a2=a2.title(),
        desc1=desc1.capitalize(), desc2=desc2,
    )


# --- Time period lines ---

TIME_PERIOD_LINES_DIFF = [
    "Ancient soul meets modern rebel — time couldn't keep them apart.",
    "Across the ages they reach for each other — one rooted in the old world, one forging the new.",
    "Where ancient wisdom meets modern fire, the timeline bends.",
    "Millennia separate their origins, but the heart doesn't care about calendars.",
]

TIME_PERIOD_LINES_SAME = [
    "Children of the same era, speaking the same temporal language.",
    "Same time, same vibe — the era chose them both.",
]

def time_period_line(tp1, tp2):
    """Generate a time period harmony line."""
    t1 = tp1.strip().lower()
    t2 = tp2.strip().lower()
    if not t1 or not t2:
        return ""
    if t1 != t2:
        return random.choice(TIME_PERIOD_LINES_DIFF)
    return random.choice(TIME_PERIOD_LINES_SAME)


# --- Background flavor ---

def background_line(bg1, bg2):
    """Generate a background flavor line referencing their worlds."""
    b1 = bg1.strip().lower()
    b2 = bg2.strip().lower()
    if not b1 or not b2:
        return ""

    cat1 = BACKGROUND_CATEGORIES.get(b1, "")
    cat2 = BACKGROUND_CATEGORIES.get(b2, "")

    if not cat1 or not cat2:
        return ""

    flav1 = BACKGROUND_FLAVOR.get(cat1, "")
    flav2 = BACKGROUND_FLAVOR.get(cat2, "")

    if not flav1 or not flav2:
        return ""

    if cat1 == cat2:
        return f"Both born from {flav1} — they already know each other's world."

    return f"One emerged from {flav1}, the other from {flav2} — and the contrast is magnetic."


# --- Chaos lines ---

CHAOS_LINES = [
    "Against all cosmic odds, chaos brought them together.",
    "The universe threw the rulebook out — and something magical happened.",
    "Every astrologer would say no. The stars said yes anyway.",
    "This match was born from beautiful chaos.",
    "When the elements war, sometimes love wins.",
    "Turbulence is just the universe testing what's real.",
    "The most unlikely connections burn the brightest.",
    "Forged in the fire of incompatibility — tempered into something unbreakable.",
    "Cosmic chaos isn't a bug — it's the feature that makes this match unforgettable.",
    "They chose each other despite what the charts said. That's the real magic.",
]

# --- Closers ---

CLOSERS = [
    "A match written in the stars — and the bassline.",
    "The dancefloor brought them together. The cosmos will keep them there.",
    "This Valentine's match was inevitable.",
    "Two Miberas, one cosmic frequency.",
    "The rave never ends when you find your match.",
    "Some bonds transcend time periods, elements, and archetypes.",
    "Together, they're more than the sum of their traits.",
    "The beat drops. The match is made. Forever.",
    "This is what the ancients meant by 'soulmate.'",
    "No algorithm needed — just cosmic chemistry.",
    "Love at first trait.",
    "The universe's Valentine card, delivered.",
    "They were always going to find each other.",
    "Two flames in the eternal rave of existence.",
    "The codex predicted this. The heart confirms it.",
]


def generate_explanation(m1, m2, score, chaos):
    """Generate a 3-6 sentence match explanation with deep codex references."""
    # Seed RNG with both token IDs for deterministic output
    id1 = int(m1["token_id"])
    id2 = int(m2["token_id"])
    rng = random.Random(id1 * 10001 + id2)

    # Swap module-level random for deterministic one
    old_state = random.getstate()
    random.setstate(rng.getstate())

    parts = []

    # 1. Opener
    if chaos:
        parts.append(random.choice(OPENERS_CHAOS))
    elif m1["archetype"].lower() != m2["archetype"].lower():
        parts.append(random.choice(OPENERS_CONTRAST))
    else:
        parts.append(random.choice(OPENERS_HARMONY))

    # 2. Ancestor line (new — uses 33 unique ancestors for variety)
    anc = ancestor_line(m1.get("ancestor", ""), m2.get("ancestor", ""))
    if anc:
        parts.append(anc)

    # 3. Archetype line
    parts.append(archetype_line(m1["archetype"], m2["archetype"]))

    # 4. Zodiac line
    from build.matching import score_zodiac
    zscore = score_zodiac(m1["sun_sign"], m2["sun_sign"])
    parts.append(zodiac_line(m1["sun_sign"], m2["sun_sign"], zscore))

    # 5. Element/drug line
    parts.append(element_drug_line(
        m1["element"], m2["element"],
        m1["drug"], m2["drug"]
    ))

    # 6. Time period line (new — ancient vs modern tension)
    tp = time_period_line(m1.get("time_period", ""), m2.get("time_period", ""))
    if tp:
        parts.append(tp)

    # 7. Background flavor (new — 73 unique backgrounds)
    bg = background_line(m1.get("background", ""), m2.get("background", ""))
    if bg:
        parts.append(bg)

    # 8. Chaos mention (if applicable)
    if chaos:
        parts.append(random.choice(CHAOS_LINES))

    # 9. Closer
    parts.append(random.choice(CLOSERS))

    # Restore random state
    random.setstate(old_state)

    return " ".join(parts)
