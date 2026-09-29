# 01 — When to build an agent
#
# This lesson is a decision. It does not need a program.
#
# LLM app    one prompt, no live data. FAQs, chitchat, policy.
#            "Can I get a refund for ORD-1?" — the model guesses. It cannot see ORDERS.
# Workflow   you already know the steps. Invoices, ETL, always normalize → lookup → format.
#            Same question always runs every step. It cannot skip lookup when the customer says hello.
# Agent      the model chooses the next tool. Status, list, refund, tracking — the path is not known.
#            Same question: the model may call lookup, refund policy, both, or neither.
#
# If you can write the steps on a whiteboard, do not start with an agent.
# An agent that always calls one tool in one order is a workflow with extra ways to fail.
