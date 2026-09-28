# 05 — Output parsers (converting model responses to Python types)
#
# Concept: Parsers turn the model's AIMessage into clean Python values
# (string, list, dict, Pydantic models) so your code doesn't scrape .content manually.
#
# Evolution of Output Parsing:
#   2020-2021: Manual string parsing → regex, split, strip → fragile, error-prone
#   2022 Q1: Structured prompts ("return JSON") → model sometimes ignores
#   2022 Q3: Output parsers introduced → parse + format instructions
#   2023-Present: Pydantic schema parsers → type-safe structured outputs
#   Takeaway: Parsers handle the messy work of extracting structured data.
#
# Example: Geography tutor with different output formats (string, list, JSON)

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

# ════════════════════════════════════════════════════════════════════════════
# PART 1: Baseline (no parser - get AIMessage)
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 1: Baseline (no parser)")
print("═" * 100)
print()

messages = prompt.invoke({"topic": "European capitals", "country": "France"})
ai_msg = model.invoke(messages)
str_chain = prompt | model | StrOutputParser()
text = str_chain.invoke({"topic": "European capitals", "country": "France"})
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

result_list = (list_prompt | model | list_parser).invoke({})
class CapitalInfo(BaseModel):
    country: str = Field(description="Country name")
    capital: str = Field(description="Capital city")

# KEY CODE SNIPPET: Parse JSON with schema validation
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
