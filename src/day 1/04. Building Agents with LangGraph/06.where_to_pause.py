# Where a pause can sit
#
# This page is the map. It does not run a graph.
#
# On the agent loop the person can wait at four boundaries:
#   before the model   interrupt_before=["chatbot"]
#   after the model    interrupt_after=["chatbot"]
#   before the tool    interrupt_before=["tools"]
#   after the tool     interrupt_after=["tools"]
#
# interrupt() inside request_refund is a fifth place: mid-tool.
# That is the next file. END is still tools_condition when the model
# writes no tool call.
