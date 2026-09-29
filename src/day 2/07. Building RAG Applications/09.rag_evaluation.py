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
print()
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

print()
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
