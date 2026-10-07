# 18 — GraphRAG (entity–relation graph over Acme policies)
#
# Flat RAG (02–14) embeds chunks and ranks by similarity.
# GraphRAG adds an explicit graph: entities + relations, then walks links.
#
# KEEP: flat semantic retrieve on the same ticket (from 02).
# NEW: knowledge graph from the policy files → seed entities from the question
#      → traverse edges → collect linked passages.
#
# Why / when this is required:
#   Multi-hop asks need facts that live in *different* files and are joined
#   by a shared entity (ORD-* → refund timing AND support email).
#   Flat Top-K may return only the nearest neighborhood.
#   A graph walk follows the link even when the second hop is a weak embed match.
#
# This lesson is comments-only (concept). Teaching GraphRAG idea:
#   hand-built nodes/edges from Acme txts, BFS a few hops.
# Production GraphRAG (Microsoft-style communities, LLM entity extract) is heavier;
# same idea: retrieve by structure, not only by vector distance.
#
# Not required when every answer sits in one short chunk (early ladder).
# Full failure map: 01.rag_failure_analysis.py
#
# ---------------------------------------------------------------------------
# Demo ticket (multi-hop)
# ---------------------------------------------------------------------------
#
#   "If I return ORD-88421, how long until the refund hits my card,
#    and who do I email about the ticket?"
#
#   Needs: refund_policy.txt (timing / payment) + contacts.txt (email)
#   Join key: ORD-* (order pattern shared across files)
#
# ---------------------------------------------------------------------------
# KEEP — flat semantic (chunk RAG)
# ---------------------------------------------------------------------------
#
#   Embed the question → Top-K chunks (small k, e.g. 2).
#   Often lands in refund_policy neighborhood only.
#   contacts.txt can miss even though the ticket asks "who do I email?"
#
# ---------------------------------------------------------------------------
# NEW — GraphRAG shape
# ---------------------------------------------------------------------------
#
# 1) Nodes (entities / policy bags) — teaching sketch:
#      ORD-*            hub order pattern
#      RefundPolicy     refund_policy.txt
#      ShippingPolicy   shipping_policy.txt
#      Contacts         contacts.txt
#      OriginalPayment  refund timing / original payment method
#      HelpEmail        help@acme.example
#      VIPDesk          VIP phone line
#
# 2) Edges (relations), e.g.:
#      ORD-* -[governed_by]-> RefundPolicy
#      ORD-* -[shipped_under]-> ShippingPolicy
#      ORD-* -[supported_by]-> Contacts
#      RefundPolicy -[pays_via]-> OriginalPayment
#      Contacts -[has_email]-> HelpEmail
#      Contacts -[has_vip_line]-> VIPDesk
#      (and mentions_orders links back to ORD-*)
#
# 3) Seed entities from the ticket (entity linker idea):
#      "ORD-88421" / return / refund / card → ORD-*, RefundPolicy, OriginalPayment
#      "email" / who → Contacts, HelpEmail
#
# 4) Walk (BFS) from seeds up to ~2 hops; collect node text as context.
#
# 5) Coverage check:
#      needed sources = {refund_policy.txt, contacts.txt}
#      flat Top-2  → often incomplete (refund only)
#      graph walk  → can reach both via ORD-* links
#
# ---------------------------------------------------------------------------
# Vs neighbors
# ---------------------------------------------------------------------------
#
#   Vs 02 flat RAG:    rank by embedding distance only
#   Vs 14 multi-source: fan-out separate indexes (corpuses), not entity edges
#   Vs 19:             full desk loop; GraphRAG is one retrieve strategy option
#
# One line: Flat RAG ranks by vector distance. GraphRAG follows ORD-* links
# across files.
#