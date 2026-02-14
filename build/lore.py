# Drug-to-Tarot-Suit mapping extracted from mibera-codex/core-lore/tarot-cards.md

DRUG_SUITS = {
    # Wands (Fire) - Stimulants and energizers
    "ephedra": "wands",
    "chewing tobacco": "wands",
    "cocaine": "wands",
    "mda": "wands",
    "dextroamphetamine": "wands",
    "euphoria": "wands",
    "khat": "wands",
    "st. john's wort": "wands",
    "st. john\u2019s wort": "wands",
    "ethanol": "wands",
    "nos": "wands",
    "m-cat": "wands",
    "mucana pruriens": "wands",
    "datura": "wands",
    "ololiuqui": "wands",

    # Pentacles (Earth) - Sedatives and grounding
    "sober": "pentacles",
    "kwao krua": "pentacles",
    "clear pill": "pentacles",
    "coffee": "pentacles",
    "mimosa tenuiflora": "pentacles",
    "shroom tea": "pentacles",
    "cbd": "pentacles",
    "brahmi": "pentacles",
    "mmda": "pentacles",
    "mushrooms": "pentacles",
    "alcohol": "pentacles",
    "lithium": "pentacles",
    "tea": "pentacles",
    "nicotine": "pentacles",

    # Cups (Water) - Empathogens and entheogens
    "bhang": "cups",
    "tobacco": "cups",
    "sassafras": "cups",
    "sertraline": "cups",
    "sakae naa": "cups",
    "yohimbine": "cups",
    "sildenafil": "cups",
    "thc edibles": "cups",
    "weed": "cups",
    "kykeon": "cups",
    "peyote": "cups",
    "2c-b": "cups",
    "ibogaine": "cups",
    "psychotria viridis": "cups",

    # Swords (Air) - Nootropics and dissociatives
    "piracetam": "swords",
    "xanax": "swords",
    "iproniazid": "swords",
    "mandrake": "swords",
    "scopolamine": "swords",
    "grayanotoxin": "swords",
    "henbane": "swords",
    "acacia": "swords",
    "ancestral trance": "swords",
    "dmt": "swords",
    "arundo donax": "swords",
    "nymphaea caerulea": "swords",
    "poppers": "swords",

    # Major Arcana (assigned suit by elemental affinity)
    "pituri": "wands",         # The Magician - Fire
    "syrian rue": "pentacles", # The Hierophant - Earth
    "mdma": "cups",            # The Lovers - Water
    "tabernaemontana": "wands",# The Chariot - Fire
    "kratom": "pentacles",     # Strength - Earth
    "ashwagandha": "pentacles",# The Hermit - Earth
    "sugarcane": "pentacles",  # Wheel of Fortune - Earth
    "lamotrigine": "swords",   # Justice - Air
    "iboga": "cups",           # The Hanged Man - Water
    "ketamine": "swords",      # Death - Air
    "kava": "cups",            # Temperance - Water
    "bufotenine": "wands",     # The Tower - Fire
    "lsd": "swords",           # The Star - Air
    "nutmeg": "cups",          # The Moon - Water
    "caffeine": "wands",       # The Sun - Fire
    "benadryl": "swords",      # Judgment - Air
    "coca": "pentacles",       # The World - Earth
    "ayahuasca": "cups",       # The Fool - Water
    "psilacetin": "cups",      # High Priestess - Water
    "estrogen": "cups",        # The Empress - Water
    "testosterone": "wands",   # The Emperor - Fire
    "methamphetamine": "wands",# The Devil - Fire
    "ethylene": "swords",      # Dissociative gas - Air
}

# Fallback for drugs not in codex
DEFAULT_SUIT = "pentacles"

def get_drug_suit(drug_name):
    """Get the tarot suit for a drug. Returns default if not found."""
    return DRUG_SUITS.get(drug_name.strip().lower(), DEFAULT_SUIT)

# Zodiac signs grouped by element
SIGN_ELEMENTS = {
    "aries": "fire", "leo": "fire", "sagittarius": "fire",
    "taurus": "earth", "virgo": "earth", "capricorn": "earth",
    "gemini": "air", "libra": "air", "aquarius": "air",
    "cancer": "water", "scorpio": "water", "pisces": "water",
}

# Traditional zodiac compatibility scores (0-100)
# Based on standard astrological compatibility
ZODIAC_COMPAT = {}
SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo",
         "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"]

def _init_zodiac_compat():
    # Same element = 90, complementary element = 95, opposite sign = 100
    # Neutral = 60, challenging = 40, same sign = 80
    fire = {"aries", "leo", "sagittarius"}
    earth = {"taurus", "virgo", "capricorn"}
    air = {"gemini", "libra", "aquarius"}
    water = {"cancer", "scorpio", "pisces"}

    opposites = {
        "aries": "libra", "taurus": "scorpio", "gemini": "sagittarius",
        "cancer": "capricorn", "leo": "aquarius", "virgo": "pisces",
        "libra": "aries", "scorpio": "taurus", "sagittarius": "gemini",
        "capricorn": "cancer", "aquarius": "leo", "pisces": "virgo",
    }

    # Complementary elements: fire+air, earth+water
    complement = {
        "fire": "air", "air": "fire",
        "earth": "water", "water": "earth",
    }

    # Challenging pairs (square aspect - 90 degrees apart)
    def get_element(sign):
        if sign in fire: return "fire"
        if sign in earth: return "earth"
        if sign in air: return "air"
        if sign in water: return "water"
        return None

    for s1 in SIGNS:
        for s2 in SIGNS:
            key = (s1, s2)
            e1 = get_element(s1)
            e2 = get_element(s2)

            if s1 == s2:
                ZODIAC_COMPAT[key] = 80
            elif opposites.get(s1) == s2:
                ZODIAC_COMPAT[key] = 100
            elif e1 == e2:
                ZODIAC_COMPAT[key] = 90
            elif complement.get(e1) == e2:
                ZODIAC_COMPAT[key] = 95
            else:
                # Remaining: square/inconjunct = challenging
                ZODIAC_COMPAT[key] = 50

_init_zodiac_compat()

# Archetype descriptions for explanation templates
ARCHETYPES = {
    "freetekno": {
        "name": "Freetekno",
        "desc": "underground rave spirit",
        "long": "free-spirited underground rave energy",
        "season": "summer",
    },
    "milady": {
        "name": "Milady",
        "desc": "digital elegance",
        "long": "network spirituality and digital elegance",
        "season": "winter",
    },
    "chicago/detroit": {
        "name": "Chicago/Detroit",
        "desc": "house music pioneer",
        "long": "the pioneering soul of house music",
        "season": "spring",
    },
    "acidhouse": {
        "name": "Acidhouse",
        "desc": "PLUR ecstasy",
        "long": "peace, love, unity and psychedelic communion",
        "season": "fall",
    },
}
