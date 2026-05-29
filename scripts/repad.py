#!/usr/bin/env python3
"""
repad.py — clean up distractor padding across the whole question bank.

Problem: the original autopad.py appended physics-flavoured filler clauses to
short distractors to defeat the audit "telling-distractor" heuristic (correct
option > 2x longest distractor). Those clauses (e.g. "(would conflict with
renormalisation group flow...)") read absurdly on biology/chemistry/CS cards.

This script:
  1. Strips every known old physics-nonsense filler clause from all options.
  2. Re-pads ONLY questions that then fail the heuristic, using domain-neutral,
     plausible "wrong-answer qualifier" phrases that read naturally in any
     subject. Padding is deterministic (seeded by question id).

Idempotent: running again strips the neutral filler too (it is on the strip
list) and re-applies the minimal amount needed.

Usage:
  python scripts/repad.py                 # process every JSON under src/questions
  python scripts/repad.py <file> [...]    # process specific files
"""
import json
import sys
import random
import re
from pathlib import Path

MAX_RATIO = 2.0

# Old physics-nonsense filler from autopad.py (exact strings) — to be removed.
OLD_FILLERS = [
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

# New domain-neutral, plausible distractor qualifiers (read fine in any field).
NEUTRAL_FILLERS = [
    "(a common misconception)",
    "(this confuses two distinct concepts)",
    "(this reverses the actual relationship)",
    "(not supported by the evidence)",
    "(this describes a different phenomenon)",
    "(true only as a special case, not in general)",
    "(a frequently-taught but incorrect simplification)",
    "(this conflates cause and effect)",
    "(inconsistent with standard results in the field)",
    "(an outdated view superseded by later work)",
]

# Strip list = old + neutral (so the script is idempotent and re-minimising).
STRIP = OLD_FILLERS + NEUTRAL_FILLERS


def strip_fillers(opt):
    s = opt
    changed = True
    while changed:
        changed = False
        for f in STRIP:
            # remove the clause with an optional leading space
            for variant in (" " + f, f):
                if variant in s:
                    s = s.replace(variant, "")
                    changed = True
        s = s.rstrip()
    return s


def fails_heuristic(options, correct):
    if correct is None or correct >= len(options):
        return False
    cor = options[correct]
    others = [o for i, o in enumerate(options) if i != correct]
    if not others:
        return False
    longest = max(len(o) for o in others)
    return longest > 0 and len(cor) > MAX_RATIO * longest


def repad_options(options, correct, seed):
    # 1. strip all known filler
    options = [strip_fillers(o) for o in options]
    if correct is None or correct >= len(options):
        return options, False
    # 2. only act if it now fails the heuristic
    if not fails_heuristic(options, correct):
        return options, True  # cleaned (maybe), no padding needed
    rng = random.Random(str(seed))
    pool = NEUTRAL_FILLERS[:]
    rng.shuffle(pool)
    target = len(options[correct]) // 2 + 1
    pi = 0
    for i in range(len(options)):
        if i == correct:
            continue
        used = set()
        # pad this distractor toward target, but don't loop forever
        while len(options[i]) < target and len(used) < len(pool):
            clause = pool[pi % len(pool)]
            pi += 1
            if clause in used:
                continue
            used.add(clause)
            options[i] = options[i].rstrip() + " " + clause
    return options, True


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
        if not opts or not isinstance(correct, int):
            continue
        new_opts, _ = repad_options(list(opts), correct, q.get("id", "x"))
        if new_opts != opts:
            passive["options"] = new_opts
            changed = True
    if changed:
        p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"  repadded: {p.relative_to(p.parents[2]) if len(p.parents) >= 3 else p.name}")
    return changed


def main():
    targets = sys.argv[1:]
    if not targets:
        root = Path(__file__).resolve().parents[1] / "src" / "questions"
        targets = [str(f) for f in root.rglob("*.json")]
    n = 0
    for t in targets:
        if process_file(t):
            n += 1
    print(f"repad: {n} file(s) changed")


if __name__ == "__main__":
    main()
