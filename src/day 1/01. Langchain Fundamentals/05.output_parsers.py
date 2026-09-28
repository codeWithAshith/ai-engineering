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

print(f"Result type: {type(ai_msg).__name__}")
print(f"Content: {ai_msg.content}")
print()
print("Problem: You have to manually extract .content from AIMessage")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Result type: AIMessage")
print("Content: The capital of France is Paris.")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: StrOutputParser (AIMessage → str)
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("PART 2: StrOutputParser (most common)")
print("═" * 100)
print()

# KEY CODE SNIPPET: Add StrOutputParser to chain
str_chain = prompt | model | StrOutputParser()
text = str_chain.invoke({"topic": "European capitals", "country": "France"})

print(f"Chain: prompt | model | StrOutputParser()")
print(f"Result type: {type(text).__name__}")
print(f"Content: {text}")
print()
print("Benefit: Directly get string, no .content needed")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Chain: prompt | model | StrOutputParser()")
print("Result type: str")
print("Content: The capital of France is Paris.")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 3: CommaSeparatedListOutputParser (AIMessage → list)
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("PART 3: CommaSeparatedListOutputParser")
print("═" * 100)
print()

# KEY CODE SNIPPET: Parse comma-separated values into Python list
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

print(f"Chain: prompt | model | CommaSeparatedListOutputParser()")
print(f"Result type: {type(result_list).__name__}")
print(f"Content: {result_list}")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Chain: prompt | model | CommaSeparatedListOutputParser()")
print("Result type: list")
print("Content: ['Paris', 'Berlin', 'Rome']")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 4: JsonOutputParser (AIMessage → dict with Pydantic schema)
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("PART 4: JsonOutputParser with Pydantic schema")
print("═" * 100)
print()


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

print(f"Chain: prompt | model | JsonOutputParser()")
print(f"Result type: {type(data).__name__}")
print(f"Content: {data}")
print()
print("Format instructions sent to model:")
print(json_parser.get_format_instructions()[:150] + "...")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Chain: prompt | model | JsonOutputParser()")
print("Result type: dict")
print("Content: {'country': 'France', 'capital': 'Paris'}")
print()
print("Format instructions sent to model:")
print('The output should be formatted as a JSON instance that conforms to the JSON schema below...')
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# KEY CONCEPTS
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("KEY CONCEPTS")
print("═" * 100)
print()
print("OUTPUT PARSERS:")
print("  • StrOutputParser: AIMessage → str (most common)")
print("  • CommaSeparatedListOutputParser: 'a, b, c' → ['a', 'b', 'c']")
print("  • JsonOutputParser: JSON string → dict (with schema validation)")
print("  • PydanticOutputParser: JSON → Pydantic model instances")
print()
print("WHY USE PARSERS:")
print("  ✓ Type safety: Get Python types, not strings")
print("  ✓ Validation: Catch bad model outputs early")
print("  ✓ Format instructions: Parser tells model what format to use")
print("  ✓ Clean code: No manual .content.strip().split(',') logic")
print()
print("WHEN TO USE EACH:")
print("  • StrOutputParser: Default for most chains")
print("  • CommaSeparatedListOutputParser: Simple lists")
print("  • JsonOutputParser: Structured data (next lesson: structured_outputs)")
print()
print("NEXT LESSON:")
print("  06. structured_outputs.py → Pydantic models + with_structured_output()")
print("-" * 100)
