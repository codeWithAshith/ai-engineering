# 09 — RAG evaluation (testing retrieval + answer quality)
#
# Concept: Production RAG needs systematic testing. Measure:
#   1. Retrieval quality: Did we find the right chunks?
#   2. Answer quality: Is the final response accurate and grounded?
#   3. Failure modes: Where does the system break?
#
# What this file actually does:
#   Retrieval check: did the right source file come back?
#   Answer check: an LLM-as-judge scores grounding. That pattern spread with model-judging papers in 2023 (for example MT-Bench). It is not a LangChain release.
#   A judge model can be wrong. Treat the score as a flag, not a proof.
#
# Why evaluation matters:
#   • Catch regressions when updating embeddings or chunking strategy
#   • Measure impact of tuning (chunk size, overlap, k)
#   • Find failure modes BEFORE customers do
#
# ```mermaid
# flowchart TD
#   A[Test questions] --> B[Retrieval]
#   B --> C{Correct chunks?}
#   C -->|Yes| D[Precision/Recall ✓]
#   C -->|No| E[Precision/Recall ✗]
#   B --> F[Generate answer]
#   F --> G{Grounded & accurate?}
#   G -->|Yes| H[Answer quality ✓]
#   G -->|No| I[Answer quality ✗]
# ```

# ════════════════════════════════════════════════════════════════════════════
# PART 1: Retrieval evaluation (precision & recall)
# ════════════════════════════════════════════════════════════════════════════

from pathlib import Path

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

# Build RAG index (same as production setup)
DATA = Path(__file__).parent.parent / "06. RAG Fundamentals" / "data"
embeddings = OllamaEmbeddings(model="nomic-embed-text")

docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]
chunks = RecursiveCharacterTextSplitter(
    chunk_size=140, chunk_overlap=30
).split_documents(docs)
retriever = InMemoryVectorStore.from_documents(
    chunks, embedding=embeddings
).as_retriever(search_kwargs={"k": 2})

print("═" * 100)
print("PART 1: Retrieval evaluation (precision & recall)")
print("═" * 100)
print()

# Test cases: (question, expected_source_file)
test_cases = [
    ("What is the refund window?", "refund_policy.txt"),
    ("How long is standard shipping?", "shipping_policy.txt"),
    ("What are your support hours?", "contact_info.txt"),
    ("Can I cancel my order?", "refund_policy.txt"),
    ("Do you ship internationally?", "shipping_policy.txt"),
]

correct = 0
total = len(test_cases)

print("Running retrieval tests...")
print()
for question, expected_source in test_cases:
    hits = retriever.invoke(question)
    sources = {h.metadata["source"] for h in hits}
    
    is_correct = expected_source in sources
    correct += int(is_correct)
    
    status = "✓" if is_correct else "✗"
    print(f"{status} Q: {question}")
    print(f"     Expected: {expected_source}")
    print(f"     Retrieved: {sources}")
    print()

precision = correct / total if total > 0 else 0
print("-" * 100)
print(f"RETRIEVAL PRECISION: {correct}/{total} = {precision:.1%}")
print()
print("What is precision?")
print("  • Measures: 'Did we retrieve the RIGHT chunks?'")
print("  • Formula: correct_retrievals / total_questions")
print("  • Target: >80% for production RAG")
print()
print("What is recall? (not measured here, but important)")
print("  • Measures: 'Did we find ALL relevant chunks?'")
print("  • Formula: retrieved_relevant / total_relevant_in_corpus")
print("  • Harder to measure (requires labeled ground truth)")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: Answer quality evaluation (LLM-as-judge)
# ════════════════════════════════════════════════════════════════════════════

from langchain.chat_models import init_chat_model
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

# Build simple RAG chain
model = init_chat_model("groq:openai/gpt-oss-20b")

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a support agent. Answer based on the context below. If the context doesn't help, say so."),
    ("user", "Context:\n{context}\n\nQuestion: {question}"),
])


def format_docs(docs):
    return "\n\n".join(f"[{d.metadata['source']}] {d.page_content}" for d in docs)


rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | model
    | StrOutputParser()
)

print("═" * 100)
print("PART 2: Answer quality evaluation")
print("═" * 100)
print()

# Sample question
question = "What is the refund window?"
answer = rag_chain.invoke(question)

print(f"Question: {question}")
print(f"Answer: {answer}")
print()
print("-" * 100)

# LLM-as-judge evaluation
judge_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert evaluator. Rate the answer on a scale of 1-5 for:\n"
               "1. Grounding: Is the answer based on the context?\n"
               "2. Accuracy: Is the answer factually correct?\n"
               "3. Completeness: Does it fully answer the question?\n"
               "Return JSON: {\"grounding\": N, \"accuracy\": N, \"completeness\": N, \"reasoning\": \"...\"}"),
    ("user", "Context:\n{context}\n\nQuestion: {question}\n\nAnswer: {answer}"),
])

judge_chain = judge_prompt | model | StrOutputParser()

context = format_docs(retriever.invoke(question))
evaluation = judge_chain.invoke({
    "context": context,
    "question": question,
    "answer": answer,
})

print("LLM-as-judge evaluation:")
print(evaluation)
print()
print("-" * 100)

print("ANSWER QUALITY METRICS:")
print("  • Grounding: Answer must cite/use context chunks")
print("  • Accuracy: Answer must be factually correct")
print("  • Completeness: Answer must fully address question")
print("  • Hallucination check: Flag if answer invents facts not in context")
print()
print("Production pattern:")
print("  1. Run LLM-as-judge on test set")
print("  2. Flag answers scoring <3/5 on any metric")
print("  3. Review flagged cases manually")
print("  4. Iterate on chunking/prompting/retrieval")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 3: Synthetic question generation
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 3: Synthetic question generation")
print("═" * 100)
print()

# Generate questions from a policy chunk
sample_chunk = chunks[0]

synthetic_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a test case generator. Generate 3 realistic customer questions that this policy text would answer."),
    ("user", "Policy text:\n{text}"),
])

synthetic_chain = synthetic_prompt | model | StrOutputParser()

synthetic_questions = synthetic_chain.invoke({"text": sample_chunk.page_content})

print("Sample policy chunk:")
print(f"  [{sample_chunk.metadata['source']}] {sample_chunk.page_content[:100]}...")
print()
print("Generated test questions:")
print(synthetic_questions)
print()
print("-" * 100)

print("WHY SYNTHETIC QUESTIONS?")
print("  • Real customer questions are rare during development")
print("  • Synthetic questions enable testing BEFORE production")
print("  • Coverage: generate N questions per policy section")
print()
print("Production workflow:")
print("  1. Generate 5-10 questions per policy chunk")
print("  2. Label expected source for each question")
print("  3. Run retrieval evaluation (Part 1)")
print("  4. Run answer quality evaluation (Part 2)")
print("  5. Iterate on chunking/embedding until >80% precision")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 4: Common failure modes
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 4: Common RAG failure modes")
print("═" * 100)
print()
print("FAILURE MODE 1: Wrong chunk retrieval")
print("  • Symptom: Question about refunds retrieves shipping chunks")
print("  • Fix: Tune chunk size, overlap, or embedding model")
print()
print("FAILURE MODE 2: No relevant chunks")
print("  • Symptom: Question has no answer in corpus, retrieves random chunks")
print("  • Fix: Add no-result handling (lesson 03.no_result_handling.py)")
print()
print("FAILURE MODE 3: Hallucination")
print("  • Symptom: Answer invents facts not in context")
print("  • Fix: Strengthen system prompt ('answer ONLY from context')")
print()
print("FAILURE MODE 4: Citation missing")
print("  • Symptom: Answer is correct but doesn't cite source")
print("  • Fix: Add citation requirement to prompt (lesson 04.source_attribution.py)")
print()
print("FAILURE MODE 5: Context too long")
print("  • Symptom: Retrieve 20 chunks, exceed model context window")
print("  • Fix: Reduce k, add reranking, or use summarization")
print()
print("FAILURE MODE 6: Stale index")
print("  • Symptom: Policy updated but RAG returns old answer")
print("  • Fix: Re-index docs on update, add cache invalidation")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PRODUCTION TESTING CHECKLIST
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PRODUCTION RAG TESTING CHECKLIST")
print("═" * 100)
print()
print("✓ BEFORE LAUNCH:")
print("  [ ] Generate synthetic questions (50-100 per corpus)")
print("  [ ] Label expected sources for each question")
print("  [ ] Run retrieval precision tests (target >80%)")
print("  [ ] Run LLM-as-judge on answer quality (target >4/5)")
print("  [ ] Test no-result handling (questions outside corpus)")
print("  [ ] Test citation accuracy (every answer links to source)")
print()
print("✓ ONGOING MONITORING:")
print("  [ ] Track retrieval precision on production questions")
print("  [ ] Log questions with no results")
print("  [ ] Flag low-confidence answers for human review")
print("  [ ] Re-run tests after chunking/embedding changes")
print()
print("✓ TUNING EXPERIMENTS:")
print("  [ ] Vary chunk_size (100, 200, 500 chars)")
print("  [ ] Vary chunk_overlap (0, 10%, 30%)")
print("  [ ] Vary k (top 2, 5, 10 chunks)")
print("  [ ] Try different embedding models (nomic, openai, cohere)")
print("  [ ] Measure impact on precision + latency")
print()
print("COURSE COMPLETE!")
print("You now have the tools to build, test, and deploy production RAG agents.")
print("-" * 100)
