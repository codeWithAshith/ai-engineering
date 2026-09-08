# 01 — Why LangGraph
#
# Concept: a chain is linear — A → B → C → stop.
# LangGraph is for when a ticket needs more than a straight line:
#   cycles       — go back (retry lookup, agent ↔ tools)
#   branching    — pick the next desk from ticket state
#   shared state — many nodes read/write the same ticket fields
#
# Limitation overcome: a plain chain can only do normalize → lookup → reply → stop.
# It cannot: lookup → miss → lookup again → then stop.
#
# Order-support ticket (ORD-1 / ORD-2) is the example for this whole folder.
