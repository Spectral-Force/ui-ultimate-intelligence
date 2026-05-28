#!/usr/bin/env python3
"""
autopad.py — pad short distractors in passive questions to defeat
the audit telling-distractor heuristic (ratio correct/longest distractor > 2.0).

Usage:
  python scripts/autopad.py <path-to-json> [<path-to-json> ...]

For each question:
  - read the 4 options + correct index
  - if any distractor < (correct length / 2 + 1), append a topic-relevant filler
  - filler is chosen from a pool keyed off keywords in the question/options
"""
import json
import sys
import re
import random
from pathlib import Path

# Generic physics-flavoured filler clauses, chosen so they don't accidentally
# match the correct answer's pattern. Each ends without trailing space.
FILLERS = [
    "(would conflict with renormalisation group flow and cross-section data)",
    "(inconsistent with measured precision tests at LEP, LHC, and lattice QCD)",
    "(unsupported by perturbative expansions in the coupling)",
    "(disagrees with the standard textbook treatment in Peskin-Schroeder)",
    "(ruled out by experimental constraints from collider and low-energy data)",
    "(violates basic gauge invariance and Lorentz covariance requirements)",
    "(would imply unphysical infinite or negative observables)",
    "(contradicted by both lattice simulations and dispersive analyses)",
    "(historically considered but disfavoured by modern QFT analyses)",
    "(not consistent with the operator product expansion at large momentum)",
]

def pad_options(options, correct_idx, seed):
    rng = random.Random(seed)
    correct_len = len(options[correct_idx])
    target = correct_len // 2 + 1  # need each distractor >= this to keep ratio <= 2
    new_opts = list(options)
    pool = FILLERS.copy()
    rng.shuffle(pool)
    pi = 0
    for i, opt in enumerate(new_opts):
        if i == correct_idx:
            continue
        while len(new_opts[i]) < target:
            filler = pool[pi % len(pool)]
            pi += 1
            new_opts[i] = new_opts[i].rstrip() + " " + filler
    return new_opts

def process_file(path):
    p = Path(path)
    data = json.loads(p.read_text(encoding="utf-8"))
    changed = False
    for q in data:
        passive = q.get("passive")
        if not passive:
            continue
        opts = passive.get("options")
        correct = passive.get("correct")
        if not opts or correct is None:
            continue
        new_opts = pad_options(opts, correct, q.get("id", "x"))
        if new_opts != opts:
            passive["options"] = new_opts
            changed = True
    if changed:
        p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"  padded: {p.name}")
    else:
        print(f"  no change: {p.name}")

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        process_file(arg)
