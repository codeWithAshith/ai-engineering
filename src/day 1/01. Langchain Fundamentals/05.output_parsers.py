# 05 — Output parsers
#
# Concept: parsers turn the model's AIMessage into a Python value
# (string, list, dict, …) so your code does not scrape .content by hand.
#
# Example: geography tutor chain ending in StrOutputParser / JSON parsing.

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.output_parsers import (
    CommaSeparatedListOutputParser,
    JsonOutputParser,
    StrOutputParser,
)
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from pydantic import BaseModel, Field

load_dotenv()

model = init_chat_model(model="groq:openai/gpt-oss-20b")

prompt = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a geography tutor. Answer in one short sentence about {topic}."
        ),
        HumanMessagePromptTemplate.from_template("What is the capital of {country}?"),
    ]
)

# --- baseline: model.invoke → AIMessage ---
messages = prompt.invoke({"topic": "European capitals", "country": "France"})
ai_msg = model.invoke(messages)
print("model.invoke →", type(ai_msg).__name__, ":", ai_msg.content)
print("-" * 100)

# --- StrOutputParser: AIMessage → str ---
str_chain = prompt | model | StrOutputParser()
text = str_chain.invoke({"topic": "European capitals", "country": "France"})
print("StrOutputParser →", type(text).__name__, ":", text)
print("-" * 100)

# --- same domain: list of capitals ---
list_parser = CommaSeparatedListOutputParser()
list_prompt = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a geography tutor. Reply with ONLY a comma-separated list."
        ),
        HumanMessagePromptTemplate.from_template(
            "List the capitals of France, Germany, and Italy."
        ),
    ]
)
print("list →", (list_prompt | model | list_parser).invoke({}))
print("-" * 100)

# --- same domain: JSON for one capital ---
class CapitalInfo(BaseModel):
    country: str = Field(description="Country name")
    capital: str = Field(description="Capital city")


json_parser = JsonOutputParser(pydantic_object=CapitalInfo)
json_prompt = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a geography tutor. Return JSON only.\n{format_instructions}"
        ),
        HumanMessagePromptTemplate.from_template("What is the capital of {country}?"),
    ]
)
data = (json_prompt | model | json_parser).invoke(
    {
        "country": "France",
        "format_instructions": json_parser.get_format_instructions(),
    }
)
print("JsonOutputParser →", data)
print("-" * 100)
