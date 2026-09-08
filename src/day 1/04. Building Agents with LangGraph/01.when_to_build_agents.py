# 01 — When to build an agent
#
# Concept:
#   LLM app   — fixed prompt → one answer
#   Workflow  — you choose the path (fixed steps)
#   Agent     — the model chooses the next action (tools / loops)
# Prefer an agent when steps or tool choice are unclear; a workflow when steps are known.
#
# Order-support examples (ORD-1 / ORD-2 domain):
#   Always: normalize ORD-* → lookup → email     → workflow / chain
#   Order support: status, list, refund, tracking → agent (tool choice unclear)
#   Invoice: extract → validate → save           → workflow / chain
