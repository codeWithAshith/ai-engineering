# 05 — Retrieval prompt composition
#
# Concept: glue retriever output into the prompt the model sees.
#
#   question
#      → retriever (find policy chunks)
#      → join chunks into one {context} string
#      → ChatPromptTemplate fills {context} + {question}
#      → model answers
#
# Same idea as fundamentals "grounded answers", but as the app wiring step:
# "how do retrieved docs get into the prompt?"
#
# Limitation overcome: calling retriever and stuffing text by hand is easy to mess up.
# Still limited: empty retrieval still reaches the model unless handled.

from pathlib import Path

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

DATA = Path(__file__).parent.parent / "06. RAG Fundamentals" / "data"
embeddings = OllamaEmbeddings(model="nomic-embed-text")

docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]
retriever = InMemoryVectorStore.from_documents(
    RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs),
    embedding=embeddings,
).as_retriever(search_kwargs={"k": 3})

# Prompt has two holes: {context} from retrieval, {question} from the user
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Acme order support. Use ONLY this policy text:\n{context}\n"
            "If the answer is missing, say you don't know.",
        ),
        ("human", "{question}"),
    ]
)
model = init_chat_model(model="groq:openai/gpt-oss-20b")

question = "How long is standard shipping?"

# 1) retrieve docs
hits = retriever.invoke(question)
# 2) compose context string for the prompt
context = "\n\n".join(d.page_content for d in hits)
# 3) fill prompt + call model
messages = prompt.invoke({"context": context, "question": question})
answer = model.invoke(messages)

print("context sources:", [d.metadata["source"] for d in hits])
print("answer:", answer.content)
print("-" * 100)
