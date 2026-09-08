# 01 — Why context engineering (order-support)
#
# Concept: context engineering = choosing WHAT the model sees each turn.
# Layers: system · session history · user memory · retrieved docs/tools · current question.
#
# Limitation of Day 1 agent: full history + tool dumps blow the window; prefs die
# when the thread ends; policy answers are not in the ORDERS dict.
