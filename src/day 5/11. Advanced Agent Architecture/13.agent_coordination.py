# 13 — Agent coordination (Acme order-support)
#
# How multi-agent systems stay aligned. Pick a mechanism by how coupled
# the agents are — not by fashion. Capstone decision aid before 14.
#
#   ticket → pick_pattern → emit_checklist → END
#
# Patterns map back to earlier lessons (01, 08–12). Same Acme tickets
# you already ran — here we only choose *how* to coordinate.
#
# Catalog (also printed at runtime):
# - Central supervisor (01 / 08)
# - Peer handoffs (11)
# - Shared blackboard (12)
# - Parallel fan-out (09)
# - Sequential pipeline (10)
# - Flat router (04) when one specialist path is enough
#
# When: you are about to wire 2+ agents and need a stop/logging plan.
# Skip when: a single agent already meets the metric (go to 14).

from __future__ import annotations

from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph

Pattern = Literal[
    "central_supervisor",
    "peer_handoffs",
    "shared_blackboard",
    "parallel_fanout",
    "sequential_pipeline",
    "flat_router",
]

COORDINATION: dict[Pattern, dict[str, str]] = {
    "central_supervisor": {
        "label": "Central supervisor",
        "lesson": "01 / 08",
        "strength": "Simple assign + merge / team ownership",
        "watch_out": "Bottleneck; extra latency hops",
        "acme": "Refund + who to email → policy + contacts workers, then synthesize",
    },
    "peer_handoffs": {
        "label": "Peer handoffs",
        "lesson": "11",
        "strength": "Flexible mid-thread domain switch",
        "watch_out": "Harder to trace without handoff_reason logs",
        "acme": "Refund thread → latest turn asks legal advice → compliance",
    },
    "shared_blackboard": {
        "label": "Shared blackboard",
        "lesson": "12",
        "strength": "Artifacts accumulate via reducers",
        "watch_out": "Stale artifacts if nobody clears the bag",
        "acme": "planner → researcher → writer on one SharedState",
    },
    "parallel_fanout": {
        "label": "Parallel fan-out",
        "lesson": "09",
        "strength": "Fast when subtasks are independent",
        "watch_out": "Needs join + dedupe of citations",
        "acme": "Refund timing + shipping ETA + contacts at once",
    },
    "sequential_pipeline": {
        "label": "Sequential pipeline",
        "lesson": "10",
        "strength": "Predictable; easy to insert 06/07 gates",
        "watch_out": "Slower; errors propagate without gates",
        "acme": "intake → retrieve → outline → writer → editor",
    },
    "flat_router": {
        "label": "Flat router",
        "lesson": "04 / 05",
        "strength": "One hop to one specialist",
        "watch_out": "No merge — wrong when ticket needs two corpora",
        "acme": "Shipping ETA only → shipping agent",
    },
}

# Acme tickets that force a clear coordination choice.
TICKETS = [
    {
        "label": "refund_and_email",
        "question": (
            "If I return ORD-88421, how long until the refund hits my card, "
            "and who do I email?"
        ),
        "expect": "central_supervisor",
    },
    {
        "label": "legal_mid_thread",
        "question": (
            "Earlier you helped with my ORD-88421 refund. Now: is it legal "
            "for Acme to refuse after 50 days? I need legal advice on my contract."
        ),
        "expect": "peer_handoffs",
    },
    {
        "label": "multi_part_independent",
        "question": (
            "If I return ORD-88421, how long until the refund hits my card, "
            "what's standard shipping for a replacement, and who do I email?"
        ),
        "expect": "parallel_fanout",
    },
    {
        "label": "polish_pipeline",
        "question": (
            "Draft then polish a customer reply for: Can I return ORD-88421 "
            "and get money back to my card?"
        ),
        "expect": "sequential_pipeline",
    },
    {
        "label": "shipping_only",
        "question": "How long does standard shipping take for ORD-88421?",
        "expect": "flat_router",
    },
    {
        "label": "research_write",
        "question": (
            "Plan research then write a grounded answer for ORD-88421 refund "
            "using shared artifacts."
        ),
        "expect": "shared_blackboard",
    },
]


class State(TypedDict):
    label: str
    question: str
    expect: str
    pattern: str
    why: str
    checklist: list[str]
    match: bool
    log: list[str]


def pick_coordination(question: str) -> tuple[Pattern, str]:
    """Rule-based picker — production often uses an LLM; rules stay auditable."""
    q = question.lower()

    if "legal" in q or "contract" in q or "is it legal" in q:
        return "peer_handoffs", "latest turn needs compliance / legal boundary"

    if "shared artifacts" in q or ("plan research" in q and "write" in q):
        return "shared_blackboard", "explicit plan → research → write bag"

    if "draft then polish" in q or ("outline" in q and "edit" in q):
        return "sequential_pipeline", "ordered content stages"

    # Three independent asks → fan-out (check before the two-ask supervisor rule).
    has_refund = "refund" in q or "return" in q
    has_shipping = "shipping" in q
    has_contacts = "email" in q or "who do i" in q
    if has_refund and has_shipping and has_contacts:
        return "parallel_fanout", "three independent corpora — join once"

    if has_refund and has_contacts and not has_shipping:
        return "central_supervisor", "two skills need merge (policy + contacts)"

    if has_shipping and not has_refund and "email" not in q:
        return "flat_router", "single specialist path is enough"

    return "flat_router", "default: cheapest one-hop path"


CHECKLIST = [
    "define stop conditions (max steps, token/budget cap)",
    "log active_agent + handoff_reason on every transfer",
    "add critic (06) / evaluator (07) for high-stakes replies",
    "checkpoint long-running multi-agent runs (Day 2)",
]


def pick_pattern(state: State) -> dict:
    log = list(state.get("log") or [])
    pattern, why = pick_coordination(state["question"])
    match = pattern == state["expect"]
    meta = COORDINATION[pattern]
    log.append(
        f"pick_pattern · {meta['label']} ({meta['lesson']}) · {why} · "
        f"expect={state['expect']} match={match}"
    )
    return {"pattern": pattern, "why": why, "match": match, "log": log}


def emit_checklist(state: State) -> dict:
    log = list(state["log"])
    meta = COORDINATION[state["pattern"]]  # type: ignore[index]
    lines = [
        f"pattern={meta['label']}",
        f"acme cue: {meta['acme']}",
        f"watch-out: {meta['watch_out']}",
        *CHECKLIST,
    ]
    log.append("emit_checklist · ops gates stamped")
    return {"checklist": lines, "log": log}


graph = StateGraph(State)
graph.add_node("pick_pattern", pick_pattern)
graph.add_node("emit_checklist", emit_checklist)
graph.add_edge(START, "pick_pattern")
graph.add_edge("pick_pattern", "emit_checklist")
graph.add_edge("emit_checklist", END)
app = graph.compile()

print("=" * 60)
print("13 — Agent coordination (Acme)")
print("Catalog → pick_pattern → emit_checklist")
print("=" * 60)

print("\nCoordination catalog:")
for key, meta in COORDINATION.items():
    print(f"  {meta['label']:22} · lesson {meta['lesson']}")
    print(f"    strength: {meta['strength']}")
    print(f"    watch-out: {meta['watch_out']}")
    print(f"    acme: {meta['acme']}")

print("\n" + "-" * 60)
match_n = 0
for case in TICKETS:
    print(f"\ncase: {case['label']}")
    print(f"ticket: {case['question'][:90]}{'…' if len(case['question']) > 90 else ''}")
    result = app.invoke(
        {
            "label": case["label"],
            "question": case["question"],
            "expect": case["expect"],
            "pattern": "",
            "why": "",
            "checklist": [],
            "match": False,
            "log": [],
        }
    )
    for line in result["log"]:
        print(f"  · {line}")
    print(f"  checklist:")
    for item in result["checklist"]:
        print(f"    – {item}")
    if result["match"]:
        match_n += 1

print("\n" + "=" * 60)
print(f"suite: {match_n}/{len(TICKETS)} expect-match")
print("Mix-up to avoid: wiring three patterns at once with no stop condition.")
print("=" * 60)
