#!/usr/bin/env python3
"""Mibera Valentine Match — Build Script

Parses CSV + codex lore, runs matching algorithm for all 10,000 Miberas,
generates miberas.json and matches.json for the static site.
"""

import csv
import json
import os
import sys
import time

# Add project root to path so we can import build modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from build.matching import find_best_match, precompute_mibera, scale_display_scores
from build.templates import generate_explanation
from build.lore import get_drug_suit

CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                         "..", "Downloads", "mibera_all_traits.csv")
# Try home directory path
if not os.path.exists(CSV_PATH):
    CSV_PATH = os.path.expanduser("~/Downloads/mibera_all_traits.csv")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")


def parse_csv(path):
    """Parse mibera_all_traits.csv into a dict keyed by token_id."""
    miberas = {}
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tid = row["token_id"].strip()
            miberas[tid] = {
                "token_id": tid,
                "name": row["name"].strip(),
                "image": row["image"].strip(),
                "archetype": row["archetype"].strip().lower(),
                "sun_sign": row["sun sign"].strip().lower(),
                "moon_sign": row["moon sign"].strip().lower(),
                "ascending_sign": row["ascending sign"].strip().lower(),
                "element": row["element"].strip().lower(),
                "drug": row["drug"].strip().lower(),
                "drug_suit": get_drug_suit(row["drug"].strip()),
                "ancestor": row["ancestor"].strip(),
                "swag_rank": row["swag rank"].strip(),
                "swag_score": row["swag score"].strip(),
                "time_period": row["time period"].strip(),
                "background": row["background"].strip(),
                "body": row["body"].strip(),
                "hair": row["hair"].strip(),
                "eyes": row["eyes"].strip(),
                "eyebrows": row["eyebrows"].strip(),
                "mouth": row["mouth"].strip(),
                "shirt": row["shirt"].strip(),
                "hat": row["hat"].strip(),
                "glasses": row["glasses"].strip(),
                "mask": row["mask"].strip(),
                "earrings": row["earrings"].strip(),
                "face_accessory": row["face accessory"].strip(),
                "tattoo": row["tattoo"].strip(),
                "item": row["item"].strip(),
                "grail": row.get("grail", "").strip(),
            }
    return miberas


def build_all_matches(miberas):
    """Find best match for every Mibera. Returns dict of match results."""
    matches = {}
    total = len(miberas)
    chaos_count = 0
    ids = list(miberas.keys())

    # Pre-compute scoring lookups for all miberas (once, not per-comparison)
    print("  Pre-computing scoring lookups...")
    precomputed = {mid: precompute_mibera(m) for mid, m in miberas.items()}

    # First pass: compute raw scores
    for i, mid in enumerate(ids):
        if (i + 1) % 1000 == 0 or i == 0:
            print(f"  Matching {i + 1}/{total}...")

        match_id, score, chaos = find_best_match(mid, precomputed, ids)

        explanation = generate_explanation(
            miberas[mid], miberas[match_id], score, chaos
        )

        matches[mid] = {
            "match_id": int(match_id),
            "raw_score": score,
            "chaos": chaos,
            "explanation": explanation,
        }

        if chaos:
            chaos_count += 1

    # Second pass: scale raw scores to 90-100 display range using percentile rank
    raw_scores_dict = {mid: m["raw_score"] for mid, m in matches.items()}
    raw_vals = list(raw_scores_dict.values())
    print(f"  Raw score range: {min(raw_vals)} - {max(raw_vals)} (mean: {sum(raw_vals)/len(raw_vals):.1f})")

    display_map = scale_display_scores(raw_scores_dict)
    for mid in matches:
        matches[mid]["score"] = display_map[mid]
        del matches[mid]["raw_score"]

    display_scores = [m["score"] for m in matches.values()]
    print(f"  Display score range: {min(display_scores)} - {max(display_scores)} (mean: {sum(display_scores)/len(display_scores):.1f})")

    return matches, chaos_count


def main():
    print("=" * 50)
    print("  Mibera Valentine Match — Build")
    print("=" * 50)
    print()

    # Step 1: Parse CSV
    print(f"[1/3] Parsing CSV: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print(f"  ERROR: CSV not found at {CSV_PATH}")
        sys.exit(1)

    miberas = parse_csv(CSV_PATH)
    print(f"  Parsed {len(miberas)} Miberas")

    # Check for unmapped drugs
    unmapped = set()
    for m in miberas.values():
        if m["drug"] and m["drug"] not in ("", "none"):
            suit = get_drug_suit(m["drug"])
            if suit == "pentacles" and m["drug"] not in (
                "sober", "kwao krua", "clear pill", "coffee",
                "mimosa tenuiflora", "shroom tea", "cbd", "brahmi",
                "mmda", "mushrooms", "alcohol", "lithium", "tea",
                "nicotine", "kratom", "ashwagandha", "sugarcane",
                "coca", "syrian rue",
            ):
                unmapped.add(m["drug"])

    if unmapped:
        print(f"  WARNING: {len(unmapped)} unmapped drugs (using default suit): {sorted(unmapped)}")

    # Step 2: Run matching
    print()
    print("[2/3] Running matching algorithm (10K × 10K)...")
    start = time.time()
    matches, chaos_count = build_all_matches(miberas)
    elapsed = time.time() - start
    print(f"  Completed in {elapsed:.1f}s")
    print(f"  Chaos matches: {chaos_count}/{len(matches)}")

    # Step 3: Write JSON
    print()
    print("[3/3] Writing JSON files...")
    os.makedirs(DATA_DIR, exist_ok=True)

    # miberas.json - all trait data for display
    miberas_path = os.path.join(DATA_DIR, "miberas.json")
    with open(miberas_path, "w") as f:
        json.dump(miberas, f, separators=(",", ":"))
    miberas_size = os.path.getsize(miberas_path)
    print(f"  {miberas_path}: {miberas_size / 1024 / 1024:.1f} MB")

    # matches.json - match results
    matches_path = os.path.join(DATA_DIR, "matches.json")
    with open(matches_path, "w") as f:
        json.dump(matches, f, separators=(",", ":"))
    matches_size = os.path.getsize(matches_path)
    print(f"  {matches_path}: {matches_size / 1024 / 1024:.1f} MB")

    # Sample output
    print()
    print("  Sample match:")
    sample_id = "42"
    if sample_id in matches:
        m = matches[sample_id]
        print(f"    Mibera #{sample_id} → Mibera #{m['match_id']} (score: {m['score']}, chaos: {m['chaos']})")
        print(f"    \"{m['explanation'][:120]}...\"")

    print()
    print("Build complete!")


if __name__ == "__main__":
    main()
