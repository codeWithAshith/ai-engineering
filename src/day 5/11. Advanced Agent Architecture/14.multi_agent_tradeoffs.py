# 14 — Multi-agent trade-offs (Acme order-support)
#
# More agents ≠ better results. Design from task shape, not fashion.
# Module capstone: after 13 picks *how* to coordinate, 14 asks *whether*
# multi-agent is worth it at all.
#
#   design → score → recommend → explain → END
#
# | More agents help when...          | More agents hurt when...           |
# |-----------------------------------|------------------------------------|
# | tasks need different expertise    | task is simple single-shot Q&A     |
# | parallel independent subtasks     | tight latency/cost budget          |
# | quality gates (critic/evaluator)  | errors compound across handoffs    |
# | compliance needs separation       | debugging becomes opaque           |
#
# Default: start with one agent; add roles only when metrics prove the need
# (same failure-first habit as Day 3 RAG metrics).
#
# Acme designs map to lessons you already built (01–13).

from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, START, StateGraph


class Design(TypedDict):
    name: str
    acme_ticket: str
    task_complexity: int  # 1-5
    latency_sensitive: bool
    needs_specialists: bool
    needs_quality_gate: bool
    expect: str


DESIGNS: list[Design] = [
    {
        "name": "Shipping FAQ",
        "acme_ticket": "How long does standard shipping take for ORD-88421?",
        "task_complexity": 1,
        "latency_sensitive": True,
        "needs_specialists": False,
        "needs_quality_gate": False,
        "expect": "Single agent (simplest)",
    },
    {
        "name": "Compliance dispute",
        "acme_ticket": (
            "Is it legal for Acme to refuse my ORD-88421 refund after 50 days?"
        ),
        "task_complexity": 4,
        "latency_sensitive": False,
        "needs_specialists": True,
        "needs_quality_gate": True,
        "expect": "Generator + critic/evaluator loop",
    },
    {
        "name": "Ops triage",
        "acme_ticket": (
            "Checkout API returns 500 for ORD-88421 — is payments down?"
        ),
        "task_complexity": 3,
        "latency_sensitive": True,
        "needs_specialists": True,
        "needs_quality_gate": False,
        "expect": "Router + specialist (no deep hierarchy)",
    },
    {
        "name": "Multi-skill refund packet",
        "acme_ticket": (
            "If I return ORD-88421, how long until the refund hits, what's "
            "standard shipping for a replacement, and who do I email?"
        ),
        "task_complexity": 4,
        "latency_sensitive": False,
        "needs_specialists": True,
        "needs_quality_gate": False,
        "expect": "Supervisor + workers (or hierarchical)",
    },
    {
        "name": "Grounded reply pipeline",
        "acme_ticket": (
            "Plan research then write a grounded ORD-88421 refund answer "
            "using shared artifacts (no critic yet)."
        ),
        "task_complexity": 4,
        "latency_sensitive": False,
        "needs_specialists": False,
        "needs_quality_gate": False,
        "expect": "Planner / executor with shared state",
    },
]

Architecture = str  # recommend() return label


def recommend(d: Design) -> Architecture:
    """Failure-first: cheapest architecture that fits the flags."""
    if d["task_complexity"] <= 2 and not d["needs_specialists"]:
        return "Single agent (simplest)"
    if d["needs_quality_gate"] and d["task_complexity"] >= 3:
        return "Generator + critic/evaluator loop"
    if d["needs_specialists"] and d["latency_sensitive"]:
        return "Router + specialist (no deep hierarchy)"
    if d["needs_specialists"]:
        return "Supervisor + workers (or hierarchical)"
    if d["task_complexity"] >= 4:
        return "Planner / executor with shared state"
    return "Sequential pipeline"


EXPLAIN: dict[str, dict[str, str]] = {
    "Single agent (simplest)": {
        "lessons": "04 chitchat / single RAG path",
        "why_not_more": "Extra agents add latency and failure modes for one-corpus FAQ",
        "next_metric": "Groundedness on shipping_policy.txt alone",
    },
    "Generator + critic/evaluator loop": {
        "lessons": "06 critic · 07 evaluator · 11 compliance handoff",
        "why_not_more": "Hierarchy without a quality gate still ships bad legal wording",
        "next_metric": "Pass rate on no_invention + not-legal-advice checklist",
    },
    "Router + specialist (no deep hierarchy)": {
        "lessons": "04 router · 05 specialist · 08 eng team (flat pick)",
        "why_not_more": "Deep hierarchy burns latency on ops pages",
        "next_metric": "p95 latency + correct team/intent rate",
    },
    "Supervisor + workers (or hierarchical)": {
        "lessons": "01 supervisor · 09 parallel · 08 hierarchy",
        "why_not_more": "Flat router cannot merge three corpora into one reply",
        "next_metric": "Citation coverage across refund/shipping/contacts",
    },
    "Planner / executor with shared state": {
        "lessons": "03 planner · 12 shared state · 10 sequential",
        "why_not_more": "No specialist split required — need an artifact bag",
        "next_metric": "Artifacts completeness before writer runs",
    },
    "Sequential pipeline": {
        "lessons": "10 sequential",
        "why_not_more": "Order matters; fan-out would race incomplete fields",
        "next_metric": "Stage error rate with optional 06/07 between writer/editor",
    },
}


class State(TypedDict):
    name: str
    acme_ticket: str
    task_complexity: int
    latency_sensitive: bool
    needs_specialists: bool
    needs_quality_gate: bool
    expect: str
    architecture: str
    score_line: str
    explanation: str
    match: bool
    log: list[str]


def score(state: State) -> dict:
    log = list(state.get("log") or [])
    line = (
        f"complexity={state['task_complexity']} · "
        f"latency={state['latency_sensitive']} · "
        f"specialists={state['needs_specialists']} · "
        f"quality_gate={state['needs_quality_gate']}"
    )
    log.append(f"score · {line}")
    return {"score_line": line, "log": log}


def recommend_node(state: State) -> dict:
    log = list(state["log"])
    architecture = recommend(state)  # type: ignore[arg-type]
    match = architecture == state["expect"]
    log.append(f"recommend · {architecture} · match={match}")
    return {"architecture": architecture, "match": match, "log": log}


def explain(state: State) -> dict:
    log = list(state["log"])
    meta = EXPLAIN.get(
        state["architecture"],
        {
            "lessons": "—",
            "why_not_more": "—",
            "next_metric": "—",
        },
    )
    text = (
        f"lessons: {meta['lessons']} · "
        f"why not more: {meta['why_not_more']} · "
        f"next metric: {meta['next_metric']}"
    )
    log.append(f"explain · {text}")
    return {"explanation": text, "log": log}


graph = StateGraph(State)
graph.add_node("score", score)
graph.add_node("recommend", recommend_node)
graph.add_node("explain", explain)
graph.add_edge(START, "score")
graph.add_edge("score", "recommend")
graph.add_edge("recommend", "explain")
graph.add_edge("explain", END)
app = graph.compile()

print("=" * 60)
print("14 — Multi-agent trade-offs (Acme)")
print("score → recommend → explain")
print("=" * 60)
print("Default: start with one agent; add roles when metrics prove the need.")
print("-" * 60)

match_n = 0
for d in DESIGNS:
    print(f"\ndesign: {d['name']}")
    print(f"ticket: {d['acme_ticket']}")
    result = app.invoke(
        {
            **d,
            "architecture": "",
            "score_line": "",
            "explanation": "",
            "match": False,
            "log": [],
        }
    )
    for line in result["log"]:
        print(f"  · {line}")
    print(f"  → {result['architecture']}")
    if result["match"]:
        match_n += 1

print("\n" + "=" * 60)
print(f"suite: {match_n}/{len(DESIGNS)} expect-match")
print("13 picked how to coordinate. 14 decided whether multi-agent is worth it.")
print("=" * 60)
