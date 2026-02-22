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

# Ancestor heritage groups and descriptions
ANCESTOR_DESCRIPTIONS = {
    "aboriginal": "dreamtime keeper of the oldest living culture",
    "arabs": "desert navigator guided by star and sand",
    "ballroom": "house and ball culture legend, walking the category",
    "bong bear": "wandering herbalist of the sacred smoke",
    "buddhist": "seeker of the middle path and inner stillness",
    "chinese": "heir to the celestial empire's ancient wisdom",
    "cypherpunk": "digital rebel encrypting freedom into code",
    "ethiopian": "stargazer from the cradle of civilization",
    "gabon": "keeper of iboga mysteries and forest spirits",
    "greek": "philosopher-warrior of the Mediterranean mind",
    "haitian": "vodou practitioner dancing with the loa",
    "hindu": "devotee walking the path of a thousand gods",
    "indian": "inheritor of subcontinental spiritual traditions",
    "irish druids": "oak-sage channeling the green island's magic",
    "japanese": "bushido soul balancing honor and innovation",
    "mayan": "calendar keeper reading time in stone and stars",
    "mongolian": "steppe rider whose throat-song shakes the sky",
    "native american": "earth guardian carrying medicine wheel wisdom",
    "nepal": "mountain mystic dwelling at the roof of the world",
    "orthodox jew": "keeper of the covenant and Talmudic depth",
    "palestinian": "olive-branch bearer rooted in ancient soil",
    "polynesian": "ocean wayfinder navigating by stars and swells",
    "punjabi": "bhangra warrior with a lion's heart",
    "pythia": "oracle inhaling the vapors of prophecy",
    "rastafarians": "Zion-bound soul riding the roots reggae riddim",
    "sami": "reindeer herder singing joik under the northern lights",
    "satanist": "left-hand path walker embracing the adversary",
    "sicanje": "Balkan tattoo bearer marked by ancestral ink",
    "stonewall": "liberation fighter whose riot changed the world",
    "sufis": "whirling dervish dissolving ego in divine love",
    "thai": "spirit house keeper blending Theravada and animism",
    "traveller": "nomadic soul whose home is the open road",
    "turkey": "crossroads guardian bridging East and West",
}

# Heritage group classification for compatibility scoring
ANCESTOR_HERITAGE_GROUPS = {
    "aboriginal": "oceanic", "polynesian": "oceanic",
    "arabs": "middle_eastern", "palestinian": "middle_eastern", "turkey": "middle_eastern", "sufis": "middle_eastern",
    "buddhist": "asian_spiritual", "hindu": "asian_spiritual", "nepal": "asian_spiritual",
    "chinese": "east_asian", "japanese": "east_asian", "mongolian": "east_asian",
    "indian": "south_asian", "punjabi": "south_asian", "thai": "south_asian",
    "greek": "mediterranean", "sicanje": "mediterranean",
    "ethiopian": "african", "gabon": "african", "haitian": "african",
    "irish druids": "celtic_northern", "sami": "celtic_northern",
    "mayan": "indigenous_american", "native american": "indigenous_american",
    "cypherpunk": "counter_culture", "satanist": "counter_culture",
    "ballroom": "liberation", "stonewall": "liberation", "rastafarians": "liberation",
    "pythia": "mystical", "bong bear": "mystical", "traveller": "mystical",
    "orthodox jew": "abrahamic",
}

def score_ancestor(anc1, anc2):
    """Score ancestor compatibility (0-100).
    Same ancestor = 60 (too similar), same group = 80, cross-group = varies.
    """
    a1 = anc1.strip().lower()
    a2 = anc2.strip().lower()
    if not a1 or not a2:
        return 50
    if a1 == a2:
        return 60
    g1 = ANCESTOR_HERITAGE_GROUPS.get(a1, "unknown")
    g2 = ANCESTOR_HERITAGE_GROUPS.get(a2, "unknown")
    if g1 == "unknown" or g2 == "unknown":
        return 50
    if g1 == g2:
        return 80
    # Cross-cultural pairings get high scores for diversity
    return 90


def score_time_period(tp1, tp2):
    """Score time period harmony (0-100).
    Ancient+modern = 100 (opposites attract across time),
    same period = 70, one empty = 50.
    """
    t1 = tp1.strip().lower()
    t2 = tp2.strip().lower()
    if not t1 or not t2:
        return 50
    if t1 != t2:
        return 100  # ancient meets modern — maximum intrigue
    return 70  # same era — comfortable but less spark


# Background categories for thematic grouping and flavor text
BACKGROUND_CATEGORIES = {
    # Rave / music scenes
    "rave 1": "rave", "rave 2": "rave", "rave 3": "rave",
    "milady rave": "rave", "milady rave 2": "rave",
    "castlemorton": "rave", "hor berlin": "rave",
    "speakers": "rave", "freetekno": "rave",
    # Labs / science
    "home lab": "lab", "jungle lab": "lab",
    "super lab": "lab", "owsley lab": "lab",
    # Nature
    "mountain": "nature", "volcano": "nature", "tree": "nature",
    "sunset": "nature", "sunrise": "nature", "clouds": "nature",
    "poppy field": "nature", "starry": "nature",
    "great barrier reef": "nature", "great bear lake": "nature",
    "kaieteur": "nature", "peyote desert": "nature",
    "mississippi river": "nature", "river boyne": "nature",
    "uluru": "nature", "twelve apostles": "nature",
    # Urban / industrial
    "detroit": "urban", "techno city": "urban",
    "factory": "urban", "prison": "urban",
    "roadside": "urban", "record store": "urban",
    "ford": "urban", "mobile records": "urban",
    "no more walls": "urban",
    # Ancient / mystical
    "cave art": "ancient", "stonehenge": "ancient",
    "newgrange": "ancient", "el dorado": "ancient",
    "rock walls": "ancient", "midas in pactolus": "ancient",
    # Cosmic / zodiac
    "aquarius": "cosmic", "aries": "cosmic", "cancer": "cosmic",
    "capricornus": "cosmic", "gemini": "cosmic", "leo": "cosmic",
    "libra": "cosmic", "ophiuchus": "cosmic", "pisces": "cosmic",
    "sagittarius": "cosmic", "scorpius": "cosmic", "taurus": "cosmic",
    "virgo": "cosmic", "constellations": "cosmic",
    # Chaos / counterculture
    "fyre festival": "chaos", "acid test": "chaos",
    "yeet": "chaos", "swirly": "chaos",
    # Digital / crypto
    "apdao": "digital", "boyco": "digital",
    "bullas": "digital", "honeyroad": "digital",
    "undersea cable": "digital", "pacioli": "digital",
    # Other
    "7eleven": "mundane", "bear cave": "shelter",
    "panama": "tropical", "sasha": "music_legend",
    "simple background": "minimal",
}

BACKGROUND_FLAVOR = {
    "rave": "the strobe-lit underground",
    "lab": "the fluorescent glow of a clandestine lab",
    "nature": "the untamed wild",
    "urban": "the concrete jungle",
    "ancient": "the ruins of forgotten civilizations",
    "cosmic": "the star-mapped heavens",
    "chaos": "beautiful pandemonium",
    "digital": "the encrypted datastream",
    "mundane": "the mundane world hiding magic in plain sight",
    "shelter": "a hidden sanctuary",
    "tropical": "sun-drenched shores",
    "music_legend": "the mixing desk of legend",
    "minimal": "the void before creation",
}
