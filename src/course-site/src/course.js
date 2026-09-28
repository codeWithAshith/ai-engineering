export const course = {
  "title": "AI Engineering",
  "sections": [
    {
      "id": "day:1",
      "kind": "day",
      "n": 1,
      "title": "Day 1",
      "groups": [
        {
          "id": "module:day 1/01. Langchain Fundamentals",
          "title": "01. Langchain Fundamentals",
          "items": [
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/00.what_langchain_is",
              "kind": "lesson",
              "title": "What LangChain is",
              "n": "00",
              "learn": "Three pictures before the first line of code.",
              "day": 1,
              "module": "01. Langchain Fundamentals",
              "notes": [
                "**Lego.** LangChain is a box of bricks: a model, a prompt, a parser, a tool, a retriever. You snap the ones you need into an application you can run again.",
                "**One remote.** A model API, a vector database, and a parser each come with their own controls. LangChain is the single remote that drives them from one place.",
                "**Swap the brick, keep the build.** OpenAI, Anthropic, Gemini, or a local model such as Llama can sit behind the same call. You change the provider string. You do not rewrite the application."
              ]
            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/01.chat_models.py",
              "kind": "lesson",
              "title": "Chat models",
              "n": "01",
              "animation": "llm-call",
                            "learn": "A chat model is the object you call. You are not training anything.",
                "notes": [
                  "Every later lesson talks to this same object.",
                  "`init_chat_model(\"groq:openai/gpt-oss-20b\")` builds the client from a provider string.",
                  "`model.invoke(messages)` sends the list and returns an `AIMessage`.",
                  "The model does not remember the last call. Memory is whatever you put in the next list."
                ],
                "snippet": "model = init_chat_model(model=\"groq:openai/gpt-oss-20b\")\nresult = model.invoke([\n    SystemMessage(...),\n    HumanMessage(content=\"What is the capital of France?\"),\n])\nprint(result.content)",
                "sample": "Result type: AIMessage\nContent: The capital of France is Paris.",
                "evolution": {
                               "title": "How chat models got called",
                               "subtitle": "From ChatOpenAI to init_chat_model",
                               "eras": [
                                 {
                                   "era": "Era 1",
                                   "years": "2022 – early 2023",
                                   "name": "ChatOpenAI, one class per vendor",
                                   "what": "LangChain shipped a class per provider: ChatOpenAI, ChatAnthropic, and others, imported from langchain.chat_models. Argument names differed (model_name, openai_api_key).",
                                   "flaw": "A snippet written for ChatOpenAI does not run on Groq or Anthropic. Swapping the model meant a new class.",
                                   "shift": "Keep the messages. Change how the client is built."
                                 },
                                 {
                                   "era": "Era 2",
                                   "years": "2023 – 2024",
                                   "name": "Partner packages, still a class",
                                   "what": "ChatOpenAI moved to langchain_openai. You still constructed that class by hand. Most tutorials on the internet are still this file.",
                                   "flaw": "The call site names the vendor, so a shared example cannot say “use whatever key you have.”",
                                   "shift": "One function, and a string that names the provider."
                                 },
                                 {
                                   "era": "Era 3",
                                   "years": "LangChain 1.0 · 2025",
                                   "name": "init_chat_model",
                                   "what": "init_chat_model(\"groq:openai/gpt-oss-20b\") builds the client. invoke is the same method the old ChatOpenAI object had.",
                                   "standard": "When an old file says ChatOpenAI(...), it is the previous way to build this same object."
                                 }
                               ],
                               "takeaway": "Old code says ChatOpenAI. This course says init_chat_model. Both end at invoke."
                             }

            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/02.messages.py",
              "kind": "lesson",
              "title": "Messages",
              "n": "02",
              "animation": "messages",
                            "learn": "A conversation is a list of typed messages, not one string.",
                "notes": [
                  "The model only sees the list you pass.",
                  "`SystemMessage` is the standing rule. `HumanMessage` is the user. `AIMessage` is a prior reply you send back as history.",
                  "\"What about France?\" only works if the Germany turn is still in that list."
                ],
                "snippet": "messages = [\n    SystemMessage(...),\n    HumanMessage(content=\"What is the capital of Germany?\"),\n    AIMessage(content=\"The capital of Germany is Berlin.\"),\n    HumanMessage(content=\"What about France?\"),\n]\nmodel.invoke(messages)",
                "sample": "Model reply: The capital of France is Paris.",
                "evolution": {
                               "title": "How a prompt became a list",
                               "subtitle": "From one string to SystemMessage, HumanMessage, AIMessage",
                               "eras": [
                                 {
                                   "era": "Era 1",
                                   "years": "2022",
                                   "name": "PromptTemplate was one string",
                                   "what": "Completion models took a single formatted string. There were no roles.",
                                   "flaw": "A system rule and a user question were the same blob of text.",
                                   "shift": "Chat endpoints needed roles."
                                 },
                                 {
                                   "era": "Era 2",
                                   "years": "2023",
                                   "name": "Chat roles",
                                   "what": "The chat API takes system, user, and assistant. LangChain named those SystemMessage, HumanMessage, and AIMessage.",
                                   "flaw": "The model still does not remember the previous invoke. You resend the list.",
                                   "shift": "The list is the prompt."
                                 },
                                 {
                                   "era": "Era 3",
                                   "years": "2024 – now",
                                   "name": "Same list, more item types",
                                   "what": "Tool calls and images are more items on that list. They did not replace the three roles.",
                                   "standard": "Build the list. Then invoke it."
                                 }
                               ],
                               "takeaway": "There is no hidden memory between invokes. If it is not in the list, the model did not see it."
                             }

            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/03.prompt_templates.py",
              "kind": "lesson",
              "title": "Prompt templates and few-shot",
              "n": "03",
                            "learn": "A template fills variables. A few examples in the system text steer the shape of the answer.",
                "demo": "prompt-mad-libs",
                "notes": [
                  "The sentence stays. Only `{topic}` changes. That is the template.",
                  "f-strings fall apart once you have a rule, a question, and examples.",
                  "`ChatPromptTemplate` fills `{country}` into a reusable message list.",
                  "Few-shot here is two Q→A pairs in the system text. That is not a database and not chat history."
                ],
                "snippet": "messages = template.invoke({\"topic\": \"European capitals\", \"country\": \"France\"})",
                "sample": "country='France'\nResponse: The capital of France is Paris.",
                "evolution": {
                               "title": "How prompts became reusable",
                               "subtitle": "From PromptTemplate to ChatPromptTemplate",
                               "eras": [
                                 {
                                   "era": "Era 1",
                                   "years": "2022",
                                   "name": "PromptTemplate",
                                   "what": "A string with {variables}, formatted in Python, sent as one completion prompt.",
                                   "flaw": "Chat models do not want one string. They want a list of messages.",
                                   "shift": "A template per message."
                                 },
                                 {
                                   "era": "Era 2",
                                   "years": "2023",
                                   "name": "ChatPromptTemplate.from_messages",
                                   "what": "System and human are separate templates. .invoke(variables) returns the message list.",
                                   "flaw": "Few-shot examples are not a second feature. They are extra lines in the system template, or a FewShotChatMessagePromptTemplate.",
                                   "shift": "Holes for what changes. Examples for the shape of the answer."
                                 },
                                 {
                                   "era": "Era 3",
                                   "years": "Still",
                                   "name": "What this file is doing",
                                   "what": "Two capital Q→A pairs sit in the system text so the model copies the tone. That is not retrieved documents and not checkpointed history.",
                                   "standard": "Template for reuse. Few-shot for shape. A real thread is messages you actually had."
                                 }
                               ],
                               "takeaway": "Few-shot is not RAG. You are showing a good answer, not searching a corpus."
                             }

            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/04.chains.py",
              "kind": "lesson",
              "title": "Chains",
              "n": "04",
                            "learn": "The pipe is a pipeline you wrote: fill the template, then call the model.",
                "notes": [
                  "`prompt | model` is one runnable. `chain.invoke(inputs)` runs both steps.",
                  "You still chose every step. The model does not pick the next one.",
                  "Old names like `LLMChain` are the same idea with more boilerplate."
                ],
                "snippet": "chain = prompt | model\nchain.invoke({\"topic\": \"European capitals\", \"country\": \"France\"})",
                "sample": "Result type: AIMessage\nContent: The capital of France is Paris.",
                "evolution": {
                               "title": "How steps got composed",
                               "subtitle": "From LLMChain to the pipe",
                               "eras": [
                                 {
                                   "era": "Era 1",
                                   "years": "2022 – mid 2023",
                                   "name": "LLMChain",
                                   "what": "The documented object was LLMChain(llm=..., prompt=...). SequentialChain stacked those.",
                                   "flaw": "A new class whenever the pipeline changed. You still see LLMChain in old repos.",
                                   "shift": "Compose runnables instead of subclassing them."
                                 },
                                 {
                                   "era": "Era 2",
                                   "years": "August 2023",
                                   "name": "LCEL, the pipe",
                                   "what": "prompt | model is a runnable. chain.invoke(inputs) fills the template and calls the model. LangChain Expression Language is this.",
                                   "flaw": "The model still does not choose the next step. You wrote the path.",
                                   "shift": "If you need a branch, this is the wrong tool."
                                 },
                                 {
                                   "era": "Era 3",
                                   "years": "0.2 and after",
                                   "name": "Don’t start from LLMChain",
                                   "what": "Current docs build chains with the pipe. LLMChain is the old class for the same idea.",
                                   "standard": "A chain is a path you fixed. An agent is a path the model chooses."
                                 }
                               ],
                               "takeaway": "If the next step depends on the answer, you have left chains."
                             }

            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/05.output_parsers.py",
              "kind": "lesson",
              "title": "Output parsers",
              "n": "05",
                            "learn": "A parser turns the model's text into a Python value.",
                "notes": [
                  "App code wants a string, a list, or a dict.",
                  "`prompt | model | StrOutputParser()` gives you the text.",
                  "A JSON parser still trusts text the model chose to write. It cleans up. It does not force the shape."
                ],
                "snippet": "text = (prompt | model | StrOutputParser()).invoke({...})",
                "sample": "str: The capital of France is Paris.\nlist: ['Paris', 'Berlin', 'Rome']",
                "evolution": {
                               "title": "How replies became values",
                               "subtitle": "From .content to a parser on the pipe",
                               "eras": [
                                 {
                                   "era": "Era 1",
                                   "years": "Early chat calls",
                                   "name": "Read .content",
                                   "what": "invoke returned an AIMessage. Application code sliced the string.",
                                   "flaw": "A list or a dict meant split, strip, and json.loads, and one extra sentence broke it.",
                                   "shift": "Put a parser at the end of the pipe."
                                 },
                                 {
                                   "era": "Era 2",
                                   "years": "With LCEL, 2023",
                                   "name": "StrOutputParser and JsonOutputParser",
                                   "what": "prompt | model | StrOutputParser() gives a string. JsonOutputParser asks for JSON and parses it.",
                                   "flaw": "The model can still ignore the format. The parser only cleans what came back.",
                                   "shift": "A schema, when the app needs fields."
                                 },
                                 {
                                   "era": "Era 3",
                                   "years": "Next file",
                                   "name": "Parser versus contract",
                                   "what": "Use a parser for text and simple lists. Use with_structured_output when you need result.capital.",
                                   "standard": "A parser does not force the model. A bound schema does."
                                 }
                               ],
                               "takeaway": "If you need named fields, stop parsing prose."
                             }

            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/06.structured_outputs.py",
              "kind": "lesson",
              "title": "Structured outputs",
              "n": "06",
                            "learn": "Bind a schema so the model returns an object, not text you hope is JSON.",
                "notes": [
                  "`with_structured_output(CapitalInfo)` attaches the Pydantic model to the call.",
                  "You read `result.capital`, not a paragraph.",
                  "This is not a tool. The model is filling a form, not looking up an order."
                ],
                "snippet": "result = model.with_structured_output(CapitalInfo).invoke(messages)\nprint(result.capital)",
                "sample": "result.country = France\nresult.capital = Paris",
                "evolution": {
                               "title": "How JSON stopped being a wish",
                               "subtitle": "From “reply in JSON” to with_structured_output",
                               "eras": [
                                 {
                                   "era": "Era 1",
                                   "years": "2023",
                                   "name": "JSON in the prompt",
                                   "what": "People wrote “return only JSON” and called json.loads on .content.",
                                   "flaw": "A preamble or a trailing sentence crashed the parser.",
                                   "shift": "Make the provider emit the schema."
                                 },
                                 {
                                   "era": "Era 2",
                                   "years": "Late 2023",
                                   "name": "with_structured_output",
                                   "what": "Chat models gained with_structured_output(Schema). LangChain maps that onto the provider’s JSON mode or tool-calling.",
                                   "flaw": "Quality depended on the provider. Some only approximated the schema.",
                                   "shift": "Stricter JSON schema modes."
                                 },
                                 {
                                   "era": "Era 3",
                                   "years": "2024 – now",
                                   "name": "The object is the return value",
                                   "what": "OpenAI structured outputs and the same idea on other providers constrain generation to the schema. You read Pydantic fields.",
                                   "standard": "This is not a tool call. The model is filling CapitalInfo, not looking up an order."
                                 }
                               ],
                               "takeaway": "Do not prompt for JSON when with_structured_output can bind the schema."
                             }

            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/07.streaming.py",
              "kind": "lesson",
              "title": "Streaming",
              "n": "07",
                            "learn": "stream yields tokens as they arrive. invoke waits for the whole reply.",
                "notes": [
                  "The answer is the same. A person watching should not stare at a blank screen.",
                  "`model.stream(messages)` yields chunks. Print `chunk.content` as it arrives.",
                  "Use invoke when a program needs the finished object."
                ],
                "snippet": "for chunk in model.stream(messages):\n    print(chunk.content, end=\"\", flush=True)",
                "sample": "The capital of France is Paris…\n(words appear as they are generated)",
                "evolution": {
                               "title": "How answers stopped arriving all at once",
                               "subtitle": "invoke waits. stream yields tokens.",
                               "eras": [
                                 {
                                   "era": "Era 1",
                                   "years": "Chat API, 2023",
                                   "name": "stream=True",
                                   "what": "The OpenAI chat API could stream tokens from the first release. The HTTP body arrived in chunks.",
                                   "flaw": "Each SDK spelled that differently.",
                                   "shift": "One method on the chat model."
                                 },
                                 {
                                   "era": "Era 2",
                                   "years": "LCEL",
                                   "name": "model.stream",
                                   "what": "model.stream(messages) yields chunks. chunk.content is the new text. model.invoke still waits for the full AIMessage.",
                                   "flaw": "A half-written reply is not JSON you can parse.",
                                   "shift": "Stream when a person is watching. Invoke when code needs the finished object."
                                 }
                               ],
                               "takeaway": "Streaming is earlier text on screen, not a different model."
                             }

            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/08.batch_processing.py",
              "kind": "lesson",
              "title": "Batch processing",
              "n": "08",
                            "learn": "batch runs many independent prompts together, instead of a for-loop of invoke.",
                "notes": [
                  "Each item is its own conversation. France does not know about Germany.",
                  "`model.batch(...)` returns results in the same order.",
                  "If the second question needs the first answer, use messages, not batch."
                ],
                "snippet": "results = model.batch([france, germany, italy])",
                "sample": "France: Paris.\nGermany: Berlin.\nItaly: Rome.",
                "evolution": {
                               "title": "How many questions stopped being a loop",
                               "subtitle": "A for-loop of invoke, or one batch",
                               "eras": [
                                 {
                                   "era": "Era 1",
                                   "years": "The obvious code",
                                   "name": "for question in questions",
                                   "what": "Each invoke waits for the previous one. Ten capitals means ten round trips.",
                                   "flaw": "Fine for two questions. Slow for a pile of independent ones.",
                                   "shift": "Hand the list to the runnable."
                                 },
                                 {
                                   "era": "Era 2",
                                   "years": "LCEL",
                                   "name": "model.batch",
                                   "what": "model.batch([...]) runs independent inputs and returns results in the same order. This is not the OpenAI Batch API, which is an offline job.",
                                   "flaw": "Items do not share history. A shared rate limit still applies.",
                                   "standard": "If question two needs the answer to question one, use messages, not batch."
                                 }
                               ],
                               "takeaway": "Batch is for unrelated prompts. It is not an agent on one ticket."
                             }

            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/09.model_parameters.py",
              "kind": "lesson",
              "title": "Model parameters",
              "n": "09",
              "animation": "sampling-combo",
                            "learn": "Set temperature. Leave Top-K and Top-P alone unless you have a reason.",
                "notes": [
                  "The model samples the next token. Temperature makes that list sharper or flatter.",
                  "`temperature=0` takes the top token. Use it for tools and structured output.",
                  "`max_tokens` is a length cap. It does not make the model smarter."
                ],
                "snippet": "init_chat_model(model=\"groq:openai/gpt-oss-20b\", temperature=0)",
                "sample": "temperature=0 → Paris, and the same Paris if you run it again.\ntemperature=1 → a different flourish.",
                "evolution": {
                               "title": "How sampling knobs got quieter",
                               "subtitle": "The knobs are old. Stacking them is a habit.",
                               "eras": [
                                 {
                                   "era": "Era 1",
                                   "years": "Since the first APIs",
                                   "name": "temperature, top_p, top_k",
                                   "what": "Temperature reshapes the next-token probabilities. top_p and top_k cut the candidate list. All three have been on the APIs for years.",
                                   "flaw": "Notebooks set all three “to be safe,” and then nobody can say which dial did what.",
                                   "shift": "Turn one dial."
                                 },
                                 {
                                   "era": "Era 2",
                                   "years": "This course",
                                   "name": "Temperature only",
                                   "what": "Tools and structured output use temperature=0. Ordinary chat can sit around 0.7. Leave top_p and top_k at the provider default.",
                                   "standard": "max_tokens is a length cap, not a sampling knob."
                                 }
                               ],
                               "takeaway": "If you cannot explain the knob, do not turn it."
                             }

            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/10.model_reliability.py",
              "kind": "lesson",
              "title": "Model reliability",
              "n": "10",
                            "learn": "Retry a blip. Fall back when the provider is down. The lesson still calls invoke.",
                "notes": [
                  "`with_retry(stop_after_attempt=3)` repeats rate limits and timeouts.",
                  "`with_fallbacks([backup])` tries another model after those retries.",
                  "A wrong capital is not this lesson. That is a prompt, a tool, or a document."
                ],
                "snippet": "model = primary.with_retry(stop_after_attempt=3).with_fallbacks([backup])",
                "sample": "429, then retry, then 200.\n503 three times, then the backup answers.",
                "evolution": {
                               "title": "How calls survived a bad minute",
                               "subtitle": "try/except, then with_retry and with_fallbacks",
                               "eras": [
                                 {
                                   "era": "Era 1",
                                   "years": "By hand",
                                   "name": "try/except around invoke",
                                   "what": "Every script retried 429s and timeouts in its own loop.",
                                   "flaw": "The lesson code knew about HTTP.",
                                   "shift": "Put the retry on the runnable."
                                 },
                                 {
                                   "era": "Era 2",
                                   "years": "LCEL",
                                   "name": "with_retry, then with_fallbacks",
                                   "what": "primary.with_retry(stop_after_attempt=3).with_fallbacks([backup]) is still one invoke. Retry runs first. The fallback model runs if those attempts fail.",
                                   "flaw": "A wrong answer is not a transport error. Retry will not fix a bad prompt.",
                                   "standard": "Retry rate limits and timeouts. Do not expect a retry to fix a bad API key."
                                 }
                               ],
                               "takeaway": "The geography code should not mention status codes."
                             }

            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/11.multimodal_messages.py",
              "kind": "lesson",
              "title": "Multimodal messages",
              "n": "11",
                            "learn": "A human message can be text plus an image. invoke stays the same.",
                "notes": [
                  "Content can be a list of blocks: text, then an image.",
                  "You are attaching bytes to a message. You are not searching a corpus.",
                  "The provider has to accept images. This file shows the shape."
                ],
                "snippet": "HumanMessage(content=[{\"type\": \"text\", \"text\": \"...\"}, {\"type\": \"image_url\", \"image_url\": {\"url\": data_url}}])",
                "sample": "blocks: text, image_url\ninvoke still returns one AIMessage.",
                "evolution": {
                               "title": "How a message grew past text",
                               "subtitle": "From a text-only HumanMessage to content blocks",
                               "eras": [
                                 {
                                   "era": "Era 1",
                                   "years": "Before vision models",
                                   "name": "OCR, then a text model",
                                   "what": "Apps turned a picture into a string with a separate OCR service, then called a text model.",
                                   "flaw": "Layout was gone, and you ran two systems.",
                                   "shift": "Send the image on the same request."
                                 },
                                 {
                                   "era": "Era 2",
                                   "years": "September 2023",
                                   "name": "GPT-4V",
                                   "what": "A chat model could take an image. Other vendors followed (Claude 3, Gemini) in 2024. Each SDK had its own image field.",
                                   "flaw": "Easy to treat vision as a different product.",
                                   "shift": "Same message type, a list of blocks."
                                 },
                                 {
                                   "era": "Era 3",
                                   "years": "LangChain",
                                   "name": "HumanMessage content blocks",
                                   "what": "content can be [{\"type\": \"text\", ...}, {\"type\": \"image_url\", ...}]. invoke does not change. The provider still has to accept images.",
                                   "standard": "A screenshot is still a message. Looking up the order is still a tool."
                                 }
                               ],
                               "takeaway": "Multimodal is a richer message, not a new architecture."
                             }

            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/12.create_agent.py",
              "kind": "lesson",
              "title": "create_agent (without tools)",
              "n": "12",
              "animation": "chain-vs-agent",
              "learn": "create_agent is the standard loop around a model (and later, tools).",
              "file": "12.create_agent.py",
              "day": 1,
              "module": "01. Langchain Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Hand-wiring model ↔ tools ↔ state is how every tutorial diverges. LangChain's `create_agent` is one entry point. This file uses it **without tools** so you see the loop before the action."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "The agent calls the model, and if tools are present, runs them, until it can stop. Config you will keep meeting:"
                },
                {
                  "type": "table",
                  "headers": [
                    "Piece",
                    "Job"
                  ],
                  "rows": [
                    [
                      "`model`",
                      "The brain"
                    ],
                    [
                      "`tools`",
                      "Optional actions"
                    ],
                    [
                      "`system_prompt`",
                      "Standing instructions"
                    ],
                    [
                      "`middleware`",
                      "Limits, errors, human-in-the-loop"
                    ],
                    [
                      "`response_format`",
                      "Typed final answer"
                    ],
                    [
                      "`state_schema`",
                      "Extra fields on agent state"
                    ],
                    [
                      "`context_schema`",
                      "Per-run caller data (role, user)"
                    ]
                  ]
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "A small agent with no tools — a dressed-up chat model. Tools start in the next module."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "`create_agent` is still an **agent**: the model may loop. With zero tools it should stop after a reply. If you need a fixed A→B→C path, write a chain or a LangGraph workflow instead."
                }
              ]
            }
          ]
        },
        {
          "id": "module:day 1/02.Tool Calling",
          "title": "02.Tool Calling",
          "items": [
            {
              "id": "lesson:day 1/02.Tool Calling/01.tool_calling.py",
              "kind": "lesson",
              "title": "Tool calling",
              "n": "01",
              "animation": "tool-loop",
              "learn": "A tool is a Python function the model can choose to call. The docstring is the API.",
              "file": "01.tool_calling.py",
              "day": 1,
              "module": "02.Tool Calling",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "The model cannot see ORD-1. A function can. Tool calling is how order support gets facts instead of guesses."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`@tool` publishes name, args, and docstring. Two ways to run it:"
                },
                {
                  "type": "ol",
                  "items": [
                    "Bind tools on the model, then **you** execute the call and return a Tool message.",
                    "`create_agent` — the loop runs tools for you."
                  ]
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Order support: `lookup_order` for ORD-1."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "If the docstring is \"looks up stuff\", the model will call it for refunds too. Write when to use it and when not to."
                }
              ]
            },
            {
              "id": "lesson:day 1/02.Tool Calling/02.errors_and_validation.py",
              "kind": "lesson",
              "title": "Tool errors and validation",
              "n": "02",
              "learn": "Tools should fail as ERROR strings the agent can read, not as crashes.",
              "file": "02.errors_and_validation.py",
              "day": 1,
              "module": "02.Tool Calling",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "ORD-999 and a negative refund will happen. If the function throws, the desk dies. If it returns a clear error, the model can apologize or ask again."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`args_schema` (Pydantic on `@tool`) describes arguments to the model. Bad **input** — validate, return `ERROR …`. Bad **data** — missing order, return `ERROR …`. Returning the error keeps the loop alive."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "`issue_refund` on ORD-1 and ORD-999, including an invalid amount."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Silent `None` is worse than an exception. The model will invent a success. Prefer an explicit error string."
                }
              ]
            },
            {
              "id": "lesson:day 1/02.Tool Calling/03.read_vs_write_tools.py",
              "kind": "lesson",
              "title": "Read vs write tools",
              "n": "03",
              "learn": "Label tools by side effect. READ is safe to retry. WRITE changes the store.",
              "file": "03.read_vs_write_tools.py",
              "day": 1,
              "module": "02.Tool Calling",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Retrying `lookup_order` is harmless. Retrying `issue_refund` is a bug. The model cannot see that difference unless you name it and later gate it."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "READ — `lookup_order`. WRITE — `update_order_status`. Same `@tool` machinery; different risk. Human-in-the-loop and RBAC land on WRITE."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Check ORD-2, then set ORD-2 to shipped."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "\"The model is careful\" is not a control. Labels plus middleware are."
                }
              ]
            },
            {
              "id": "lesson:day 1/02.Tool Calling/04.api_tools.py",
              "kind": "lesson",
              "title": "API tools",
              "n": "04",
              "learn": "Wrap HTTP in @tool so the model sees a name and args, never URLs or headers.",
              "file": "04.api_tools.py",
              "day": 1,
              "module": "02.Tool Calling",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "If the model sees a URL, it will hallucinate paths. Your code owns transport. The model owns *when* to ask."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "The tool function performs the request. Docstring describes the business action (`fetch_tracking_note`), not `GET /v1/...`."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "`lookup_order` locally, tracking note via HTTP."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "This is still a tool, not RAG. You are fetching one resource, not searching a corpus."
                }
              ]
            },
            {
              "id": "lesson:day 1/02.Tool Calling/05.db_tools.py",
              "kind": "lesson",
              "title": "Database tools",
              "n": "05",
              "learn": "SQL lives in tools. Use placeholders. Never format the customer's text into the query.",
              "file": "05.db_tools.py",
              "day": 1,
              "module": "02.Tool Calling",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "The NL-to-SQL week will tempt you to paste the question into SQL. This lesson is the hard rule, early, on a small catalog."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Tools run SQL with `?` placeholders. Mark READ vs WRITE the same way as order tools. The model chooses `search_products` or `update_stock`; it does not compose a query string."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "SQLite catalog: search products, update stock."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "A tool that takes `sql: str` is how you get dropped tables. Parameters only."
                }
              ]
            },
            {
              "id": "lesson:day 1/02.Tool Calling/06.response_format.py",
              "kind": "lesson",
              "title": "create_agent response_format",
              "n": "06",
              "learn": "response_format asks the agent for a typed final answer — like structured output, on the agent.",
              "file": "06.response_format.py",
              "day": 1,
              "module": "02.Tool Calling",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Chat text is for people. Apps want `order_id` and `status` fields. `response_format` fills that schema after the agent stops."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Result includes `structured_response`. Same idea as `with_structured_output`, on `create_agent`."
                },
                {
                  "type": "p",
                  "text": "This Groq setup **cannot** combine JSON `response_format` with tools in one agent. Pattern: tool lessons get facts from functions; this lesson gets a typed reply **without** tools on that agent."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Order-support status as `OrderStatus` for ORD-1."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "If you need both a lookup and a typed object, do the lookup in a workflow, then structure — or wait for a provider that allows both. Do not assume the combo works because the docs showed it on OpenAI."
                }
              ]
            },
            {
              "id": "lesson:day 1/02.Tool Calling/07.default_middleware.py",
              "kind": "lesson",
              "title": "Default middleware",
              "n": "07",
              "learn": "Middleware wraps model and tool calls: errors, call limits, human pause.",
              "file": "07.default_middleware.py",
              "day": 1,
              "module": "02.Tool Calling",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "The happy path hides four production failures: a tool that throws, a model that loops tools forever, a model that loops itself, a WRITE that should not auto-run."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "We demo each built-in on the same ORDERS domain:"
                },
                {
                  "type": "ul",
                  "items": [
                    "**ToolErrorMiddleware** — tool raises → error ToolMessage → model recovers.",
                    "**ToolCallLimitMiddleware** — too many tool calls → error.",
                    "**ModelCallLimitMiddleware** — too many model calls → error.",
                    "**HumanInTheLoopMiddleware** — pause before a WRITE; resume with approve."
                  ]
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "ORD-1 / ORD-999 through each behaviour separately so you can see which middleware did what."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Middleware is not a second agent. It is a wrapper around the one you already have."
                }
              ]
            },
            {
              "id": "lesson:day 1/02.Tool Calling/08.custom_middleware.py",
              "kind": "lesson",
              "title": "Custom middleware",
              "n": "08",
              "learn": "wrap_tool_call lets you log or change what happens around the real tool.",
              "file": "08.custom_middleware.py",
              "day": 1,
              "module": "02.Tool Calling",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Built-ins cover errors and limits. Audit logs, extra validation, redaction — you write those."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`@wrap_tool_call`: `(request, handler) → result = handler(request) → return result`. You run code before and after the real tool without editing every function."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "One custom middleware: audit log for `lookup_order` / ORD-1."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Do not put business logic only in middleware if it belongs in the tool (validation). Middleware is for *every* call: log, allow, deny, transform."
                }
              ]
            },
            {
              "id": "lesson:day 1/02.Tool Calling/09.agent_context.py",
              "kind": "lesson",
              "title": "Agent context",
              "n": "09",
              "learn": "Context is per-invoke data about the caller. It is not chat, and not a checkpointer.",
              "file": "09.agent_context.py",
              "day": 1,
              "module": "02.Tool Calling",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "The agent needs to know *who* is asking (role, user id) without stuffing that into the system prompt every time, and without mixing it into the ticket thread."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`context_schema` types the data. `invoke(..., context=...)` passes it for this run. Tools read `runtime.context` via `ToolRuntime`."
                },
                {
                  "type": "p",
                  "text": "Messages = what was said. Checkpointer = this thread's state. Context = this request's caller."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "`who_am_i` reports the caller from context."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Putting `role=agent` in a system message is a suggestion. Context plus a wrap that blocks the tool is enforcement. Next lesson is that enforcement."
                }
              ]
            },
            {
              "id": "lesson:day 1/02.Tool Calling/10.tool_governance.py",
              "kind": "lesson",
              "title": "Tool governance (RBAC)",
              "n": "10",
              "learn": "RBAC is enforced when the tool runs, not by cloning create_agent per role.",
              "file": "10.tool_governance.py",
              "day": 1,
              "module": "02.Tool Calling",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "\"Viewer agent\" vs \"agent agent\" doubles your graphs and still fails when someone invokes the powerful one. One agent; the tool path checks `context.role`."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`context.role` comes from `invoke`. `@wrap_tool_call` allows or blocks. A viewer asking `issue_refund` gets a denial the model can report. An agent role is allowed."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Viewer blocked from refund; agent allowed."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Hiding the tool from the model's tool list is incomplete (prompts leak). Enforce at execution."
                }
              ]
            }
          ]
        },
        {
          "id": "module:day 1/03. LangGraph Fundamentals",
          "title": "03. LangGraph Fundamentals",
          "items": [
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/01.why_langgraph.py",
              "kind": "lesson",
              "title": "Why LangGraph",
              "n": "01",
              "learn": "A chain is a straight line. LangGraph is for cycles, branches, and shared ticket state.",
              "file": "01.why_langgraph.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "`prompt | model | parser` cannot \"look up → miss → look up again.\" Order support needs that. LangGraph is the library for those graphs."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "ul",
                  "items": [
                    "**Cycles** — go back (retry lookup, model ↔ tools).",
                    "**Branching** — VIP desk vs standard, from ticket state.",
                    "**Shared state** — many nodes read and write the same ticket fields."
                  ]
                },
                {
                  "type": "p",
                  "text": "A chain can only do normalize → lookup → reply → stop."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "The ORD-1 / ORD-2 ticket is the example for this whole folder. We are not drawing architecture posters. We are saying when a line is not enough."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "LangGraph is not \"agents only.\" You can build a fixed workflow as a graph. Agents are the loops. Use the simpler chain until you need a cycle or a branch."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/02.nodes_and_edges.py",
              "kind": "lesson",
              "title": "Nodes and edges",
              "n": "02",
              "learn": "A node is a function of state. A fixed edge always goes A to B.",
              "file": "02.nodes_and_edges.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Without a graph you have a script. Here the ticket is real shared state that nodes update step by step — the first building block."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "A **node** is `function(state) →` a partial update dict. A **fixed edge** (`add_edge`) always runs next. `START` and `END` are entry and exit."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Linear path: normalize → enrich for ORD-1."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Every ticket takes the same path. No VIP vs standard. That is the next lesson."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Returning a full new state object is how you wipe fields. Return **partial** updates. Reducers (later) decide how they merge."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/03.conditional_edges.py",
              "kind": "lesson",
              "title": "Conditional edges",
              "n": "03",
              "learn": "A route function reads state and returns the next node name.",
              "file": "03.conditional_edges.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Fixed edges always run normalize → enrich. High-priority tickets need the VIP desk."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`add_conditional_edges(source, route_fn)` — `route_fn(state)` returns the next node name. The if/else lives on the **edge**, not inside a giant node."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Priority high → VIP, else standard (ORD-1 / ORD-2)."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "The choice is not stored in state (hard to log or reuse). Free-text questions have no ready-made priority field. Routing **nodes** fix that."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Do not hide a 40-line classifier inside the edge \"because it is just routing.\" If the decision matters later, write it into state."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/04.routing_nodes.py",
              "kind": "lesson",
              "title": "Routing nodes",
              "n": "04",
              "learn": "A routing node writes the decision into state. The edge only reads that field.",
              "file": "04.routing_nodes.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Priority had to already exist on the ticket, and the desk choice never landed in state. Free-text support questions need **intent** computed, stored, then a thin edge."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "table",
                  "headers": [
                    "",
                    "Conditional edge",
                    "Routing node"
                  ],
                  "rows": [
                    [
                      "--",
                      "------------------",
                      "--------------"
                    ],
                    [
                      "Decision computed in",
                      "`route()` on the edge",
                      "`classify()` node"
                    ],
                    [
                      "Decision in state?",
                      "No",
                      "Yes (e.g. `intent`)"
                    ],
                    [
                      "Use when",
                      "Simple branch on a known field",
                      "Save, log, or reuse the choice"
                    ]
                  ]
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Order-support question → order / product / other desk (ORD-1)."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Two nodes that both \"kind of classify\" will disagree. One writer of `intent`, one thin edge."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/05.state_and_reducers.py",
              "kind": "lesson",
              "title": "State and reducers",
              "n": "05",
              "learn": "Nodes return partial updates. Reducers decide how fields merge — last write, sum, or append.",
              "file": "05.state_and_reducers.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "If enrich returns `events=[\"enriched\"]` and that field **overwrites**, you lose `[\"normalized\"]`. Tickets need a merge rule per field."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "ul",
                  "items": [
                    "Plain field → last write wins.",
                    "`Annotated[..., add]` → sum ints or concatenate lists.",
                    "`Annotated[..., add_messages]` → append chat messages."
                  ]
                },
                {
                  "type": "p",
                  "text": "`Annotated[T, reducer]` attaches the merge function. LangGraph calls `new = reducer(old, update)`. Without it, `new = update`."
                },
                {
                  "type": "p",
                  "text": "Examples: `Annotated[int, add]` → 0+1 then 1+1 → 2. List `add` → concat. `add_messages` → chat append."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Watch events accumulate instead of overwrite."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Using `add` on a field that should be a single status (\"shipped\") will give you `[\"pending\", \"shipped\"]`. Pick the reducer that matches the meaning."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/06.agent_loops.py",
              "kind": "lesson",
              "title": "Agent loops",
              "n": "06",
              "learn": "Chatbot and ToolNode cycle until the model stops calling tools.",
              "file": "06.agent_loops.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "A scripted normalize → enrich path cannot let the model decide when to look up ORD-1. The ticket needs a **cycle**."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`tools_condition` routes to the tools node or to END. `recursion_limit` caps steps so a confused model cannot spin forever."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Order-support graph looking up ORD-1."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "`invoke` only shows the final answer. Streaming (next) is how a UI shows the loop."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "This is the same idea as `create_agent`, drawn as nodes you can see. If the loop is all you need, `create_agent` is shorter. We draw it so HITL and streaming make sense."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/07.streaming.py",
              "kind": "lesson",
              "title": "Streaming",
              "n": "07",
              "learn": "Graph stream modes: which node wrote, the full ticket, or tokens as they type.",
              "file": "07.streaming.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "`invoke` hides the loop. A desk UI needs progress. LangGraph `stream` has modes for different UIs — not the same as `model.stream()`."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "table",
                  "headers": [
                    "Mode",
                    "Each event",
                    "Use when"
                  ],
                  "rows": [
                    [
                      "`updates`",
                      "`{node_name: partial update}`",
                      "Debug / which node just wrote"
                    ],
                    [
                      "`values`",
                      "Full state after that step",
                      "Re-render the whole ticket"
                    ],
                    [
                      "`messages`",
                      "Token chunk from the LLM",
                      "Chat typing"
                    ],
                    [
                      "`invoke()`",
                      "One final state",
                      "You only need the finished reply"
                    ]
                  ]
                },
                {
                  "type": "p",
                  "text": "Same inputs, three loops: updates prints the small dict; values shows the message list growing; messages prints tokens with `end=\"\"`."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "`values` looks \"bigger\" because it **repeats** full state. That is not extra work in the graph; it is the stream shape."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/08.thinking_stream.py",
              "kind": "lesson",
              "title": "Thinking then answer (dual stream)",
              "n": "08",
              "learn": "One stream can show tool progress and the typed answer: combine updates and messages.",
              "file": "08.thinking_stream.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "One mode alone cannot show both \"I'm looking up ORD-1\" and the live sentence. Real chatbots need both."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`stream_mode=[\"updates\", \"messages\"]`. Updates drive a thinking line (which node: chatbot / tools). Messages drive tokens."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Same ORD-1 + `lookup_order` loop; print `[thinking]` then the answer."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Each run starts fresh — no memory of the ticket thread. Persistence is next."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "\"Thinking\" here is **which node ran**, not a hidden chain-of-thought API. Do not confuse it with model reasoning tokens."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/09.persistence.py",
              "kind": "lesson",
              "title": "Checkpointing basics (MemorySaver + thread_id)",
              "n": "09",
              "learn": "A checkpointer snapshots state. Same thread_id continues the ticket; a new one starts blank.",
              "file": "09.persistence.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Without a checkpointer, each turn is isolated. The customer repeats ORD-1 every message. That is not a desk; that is a goldfish."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "A **checkpoint** is a snapshot after a step. **Persistence** means later `invoke` can load it. `MemorySaver` keeps snapshots in RAM, keyed by `thread_id`."
                },
                {
                  "type": "p",
                  "text": "Required config: `{\"configurable\": {\"thread_id\": \"support-1\"}}`. Same id → shared memory. New id → fresh ticket."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Chat remembers ORD-1 on the same thread, not on a new one."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Sometimes you need one **exact** snapshot inside a thread (`checkpoint_id`, next lesson). And RAM dies when the process exits (durable savers, later)."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "A checkpointer does **not** shrink the context window. It stores the thread. Day 2 trims what the model sees."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/10.checkpoint_id.py",
              "kind": "lesson",
              "title": "Optional checkpoint_id",
              "n": "10",
              "learn": "thread_id selects the conversation. checkpoint_id (optional) selects one snapshot inside it.",
              "file": "10.checkpoint_id.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "\"Latest on this thread\" is normal chat. Debugging, time travel, and human fix-ups need an older snapshot."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Omit `checkpoint_id` → latest. Set it (from `get_state` / history) → pin that snapshot."
                },
                {
                  "type": "table",
                  "headers": [
                    "Use",
                    "Why"
                  ],
                  "rows": [
                    [
                      "Inspect history",
                      "Ticket at step N"
                    ],
                    [
                      "Time travel",
                      "Re-run from an older snapshot"
                    ],
                    [
                      "Human fix + resume",
                      "Jump to a bad step, `update_state`, continue"
                    ],
                    [
                      "Debug",
                      "Reproduce state when a tool failed"
                    ]
                  ]
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Shapes: thread only vs thread + checkpoint id."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "A new `thread_id` is a different conversation, not \"undo.\" Undo is checkpoint_id on the **same** thread."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/11.runnable_config.py",
              "kind": "lesson",
              "title": "RunnableConfig extras (recursion_limit, metadata)",
              "n": "11",
              "learn": "invoke/stream take a config dict: thread_id, recursion_limit, and metadata for this run.",
              "file": "11.runnable_config.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Persistence alone does not cap loops or tag a request. Tickets need a step budget and often a desk hint."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Besides `configurable.thread_id`:"
                },
                {
                  "type": "ul",
                  "items": [
                    "`recursion_limit` — max graph steps before `GraphRecursionError` (default ~25).",
                    "`metadata` — free-form dict for logging, tracing, or a node that reads `desk` / `order_hint`."
                  ]
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "A node reads metadata; an agent loop uses a low `recursion_limit`."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "`MemorySaver` still dies when the process exits."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Metadata is not `context_schema`. Context is typed caller data for tools. Metadata is run tags. You can use both."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/12.durable_checkpointers.py",
              "kind": "lesson",
              "title": "Durable checkpointers",
              "n": "12",
              "learn": "SqliteSaver keeps the thread on disk so a restart does not wipe ORD-2.",
              "file": "12.durable_checkpointers.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "`MemorySaver` is a teaching RAM. Restart the support process and the ticket is gone. Production needs a file or a database."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`SqliteSaver` uses the same `compile(checkpointer=...)` API. Same `thread_id` config. The snapshots live on disk."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "A thread that still recalls the active order id ORD-2 after the saver has written."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "You can persist and still be stuck with a **wrong** ticket. Next: inspect and edit state."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "SQLite is not the Store (long-term customer facts). This is the **chat thread**. Day 2 Postgres Store is the other bucket."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/13.get_state_update_state.py",
              "kind": "lesson",
              "title": "get_state and update_state",
              "n": "13",
              "learn": "Inspect a thread, correct a field, resume. Persistence alone cannot fix a wrong order id.",
              "file": "13.get_state_update_state.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "The ticket ran with ORD-1. The customer meant ORD-2. Re-chatting from scratch loses the rest of the work. A human should edit state."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "ul",
                  "items": [
                    "`get_state(config)` — latest checkpoint.",
                    "`update_state(config, values)` — write a correction.",
                    "`invoke(None, config)` — resume from that point.",
                    "`get_state_history(config)` — older checkpoints."
                  ]
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Wrong order id ORD-1 → human fixes to ORD-2 → resume."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Lookup logic is still stuck in one flat graph. Subgraphs (next) are how you reuse a lookup flow."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "`update_state` is a desk tool, not something the customer calls. Combine it with HITL pauses later."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/14.subgraphs.py",
              "kind": "lesson",
              "title": "Subgraphs",
              "n": "14",
              "learn": "Compile a small graph once and use it as a node inside a parent graph.",
              "file": "14.subgraphs.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Stuffing normalize + lookup + note into one flat graph makes lookup hard to reuse across ticket flows."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "A compiled graph is a node. Parent: normalize → lookup (subgraph) → format_note. Subgraph: `fetch_status` from ORDERS."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Same ORD-1 / ORD-2 ticket, lookup extracted."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "One ticket at a time. Multi-order questions run sequentially until Send (next)."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "A subgraph is not a new process and not an agent by itself. It is a reusable chunk of graph."
                }
              ]
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/15.map_reduce_send.py",
              "kind": "lesson",
              "title": "Map-reduce with Send",
              "n": "15",
              "learn": "Fan out one worker per item with Send, then a reduce node joins the results.",
              "file": "15.map_reduce_send.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "\"What's the status of ORD-1, ORD-2, and ORD-3?\" should not look up three times in a chain if they are independent."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`Send` starts a worker per item. `Annotated[..., add]` merges worker updates. A reduce node writes one support summary."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Look up three orders in parallel, then one summary."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Map-reduce is for **independent** work. If order 2 depends on order 1's result, you want a loop or a sequence, not Send."
                }
              ]
            }
          ]
        },
        {
          "id": "module:day 1/04. Building Agents with LangGraph",
          "title": "04. Building Agents with LangGraph",
          "items": [
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/01.when_to_build_agents.py",
              "kind": "lesson",
              "title": "When to build an agent",
              "n": "01",
              "learn": "If you can write the steps on a whiteboard, do not start an agent.",
              "file": "01.when_to_build_agents.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "\"Agent\" is a fashion word. This lesson is the fork from Before class, with Acme tickets so you can argue about a real desk."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "ul",
                  "items": [
                    "**LLM app** — one prompt, one answer.",
                    "**Workflow** — you choose the path.",
                    "**Agent** — the model chooses the next action."
                  ]
                },
                {
                  "type": "p",
                  "text": "Prefer an agent when steps or tool choice are unclear. Prefer a workflow when they are known."
                },
                {
                  "type": "p",
                  "text": "Acme:"
                },
                {
                  "type": "ul",
                  "items": [
                    "Always: normalize ORD-* → lookup → email → **workflow**.",
                    "Order support: status, list, refund, tracking → **agent**.",
                    "Invoice: extract → validate → save → **workflow**."
                  ]
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "We decide in the room, then the rest of the folder builds the agent you just justified."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "An agent that only ever calls one tool in one order is a workflow with extra failure modes. Rewrite it as a chain."
                }
              ]
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/02.basic_agent_no_tools.py",
              "kind": "lesson",
              "title": "Order-support agent without tools",
              "n": "02",
              "learn": "A chat graph with no tools cannot see live order data. It must guess or refuse.",
              "file": "02.basic_agent_no_tools.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "You decided to build an order-support agent. This file is the honest failure: ORDERS exists in memory and is **not wired**. Watch the model flail so the next lesson's tools feel necessary, not decorative."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "START → chatbot → END. No ToolNode. The model only has the system prompt and the question."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Ask status of ORD-1. The agent has no lookup."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "A confident wrong status is a hallucination, not \"the LLM being helpful.\" Next file binds tools."
                }
              ]
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/03.order_support_agent.py",
              "kind": "lesson",
              "title": "Order-support agent with tools",
              "n": "03",
              "learn": "Bind lookup tools to a chatbot ↔ tools loop so answers come from data.",
              "file": "03.order_support_agent.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Without tools the agent cannot see ORD-1. Same ticket graph as before — now ORDERS is available through functions."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Chatbot ↔ ToolNode until the model stops calling tools. READ tools: status, list."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "ORD-1 status and list all orders."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Risky actions (refund) run with no human approval. That is the next lesson."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "If the tool returns an error string, the model should say so. If you swallow errors, you are back to guessing."
                }
              ]
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/04.human_in_the_loop.py",
              "kind": "lesson",
              "title": "Order-support agent + human-in-the-loop",
              "n": "04",
              "learn": "Refunds must not auto-run. interrupt() inside the WRITE tool pauses for a human.",
              "file": "04.human_in_the_loop.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Lookup tools answering ORD-1 is fine. `request_refund` is money. The graph must stop."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Same chatbot ↔ tools agent, plus `MemorySaver` so a pause can resume on `thread_id`. The refund tool calls `interrupt()`. Resume with `Command(resume=True/False)`."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Status of ORD-1 (no pause) → refund ORD-1 (pause → approve)."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Interrupt-inside-one-tool only covers that tool. A desk may need to approve **any** tool call at the boundary, or fix a wrong order id while paused."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Without a checkpointer, a pause cannot resume. HITL and persistence are a pair."
                }
              ]
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/05.approve_before_tools.py",
              "kind": "lesson",
              "title": "Approve tools before they run (interrupt_before)",
              "n": "05",
              "learn": "interrupt_before the tools node pauses for any tool call, not only refund.",
              "file": "05.approve_before_tools.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Customer: \"Cancel ORD-1.\" The agent plans `cancel_order`. The desk must see that call before it runs. An interrupt inside `request_refund` would miss cancel."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`interrupt_before=[\"tools\"]` pauses at the tools **node boundary**. No special code inside each tool. Resume with `invoke(None, config)`."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Pending tool call → human OK → tool runs → reply."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "If the order id is wrong, approve/reject is not enough. Next: edit state while paused."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Boundary pause reviews the call the **model chose**. It does not rewrite arguments until you `update_state`."
                }
              ]
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/06.hitl_fix_resume.py",
              "kind": "lesson",
              "title": "Fix wrong order id while paused, then resume",
              "n": "06",
              "learn": "While paused, fix a wrong order id with update_state, then resume.",
              "file": "06.hitl_fix_resume.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Customer said \"refund ORD-1\" and meant ORD-2. Approve would refund the wrong order. Reject would drop the ticket. The desk needs to edit."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Same agent as the previous lesson (`interrupt_before` tools). `update_state(config, values)` while paused, then `invoke(None)` to continue."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Pending call on ORD-1 → edit to ORD-2 → tools run."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "This is a human operation on checkpointed state, not the model \"noticing.\" You need the pause, the checkpointer, and `get_state` so you can see what you are editing."
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "day:2",
      "kind": "day",
      "n": 2,
      "title": "Day 2",
      "groups": [
        {
          "id": "module:day 2/05. Agent Memory & Context Engineering",
          "title": "05. Agent Memory & Context Engineering",
          "items": [
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/01.why_context_engineering.py",
              "kind": "lesson",
              "title": "Why context engineering (order-support)",
              "n": "01",
              "learn": "Context engineering is choosing what the model sees each turn — not 'add more prompt'.",
              "file": "01.why_context_engineering.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Day 1 agents append forever. Prefs die when the thread ends. Policy answers are not in the ORDERS dict. This folder is the repair."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Layers the model might see: system · session history · user memory · retrieved docs/tools · current question. You choose the mix **this turn**."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Name the failure of the Day 1 desk, then each lesson fixes one layer."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "A bigger context window is not a strategy. Cost, noise, and truncation still win. The ladder in this module is the strategy."
                }
              ]
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/02.context_windows.py",
              "kind": "lesson",
              "title": "Context windows",
              "n": "02",
              "animation": "memory",
              "learn": "Models only see a fixed token budget. Extra tokens are cost, noise, and truncation.",
              "file": "02.context_windows.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Day 1 agents keep appending messages. You need to feel the budget before you trim it."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "System + history + tool dumps + the question all count. Overflow and the API drops the oldest part — often the instruction you cared about."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "A rough token estimate for a long ORD-1 support thread."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Knowing the budget does not shrink the thread. Next lesson trims."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "This is not a re-teach of checkpointers. Persistence stores the thread. The window is what one call can see."
                }
              ]
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/03.trim_messages.py",
              "kind": "lesson",
              "title": "trim_messages",
              "n": "03",
              "learn": "trim_messages keeps only a token budget of recent history for the model.",
              "file": "03.trim_messages.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "A long ORD-* thread overflows (previous lesson). The cheapest fix is to drop old turns from the **prompt**."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "You still checkpoint the full thread if you want. Trim only changes what this invoke sends. Recent messages stay; older ones go."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Trim a long support history to a budget."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Trimming **drops facts**. \"Email me, don't call\" vanishes. Long-term prefs need a Store (next)."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Trim is not summarization. There is no gist. The bits are gone from the prompt."
                }
              ]
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/04.long_term_store.py",
              "kind": "lesson",
              "title": "Long-term memory (Store)",
              "n": "04",
              "learn": "A Store holds facts across threads. A checkpointer holds one conversation.",
              "file": "04.long_term_store.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Trim and checkpoints cannot remember a preference after a **new** support thread starts."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "LangGraph Store: structured facts, namespaced (e.g. customer id). Checkpointer = chat state for one `thread_id`. Store = user/company facts reused on new threads."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Save contact preference for the customer of ORD-1; load it on a new thread."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Agents need `ToolRuntime` to read/write the store from tools. Next lesson wires that."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Do not dump the whole chat into the Store. Store stable facts. Chat stays in the thread."
                }
              ]
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/05.agent_store_toolruntime.py",
              "kind": "lesson",
              "title": "Store + ToolRuntime on the order-support agent",
              "n": "05",
              "learn": "create_agent(..., store=...) plus ToolRuntime lets tools put and search memory.",
              "file": "05.agent_store_toolruntime.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "A Store sitting in a script is not the ORD-* agent. Tools must read and write it during the loop."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Pass `store` into `create_agent`. Tools receive `ToolRuntime` and call put/search. Namespace by customer, not by thread, if the fact should survive a new ticket."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Save a preference; a new thread recalls it."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Long chats still need summarization and compaction. Store is not a window tactic."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "`runtime.context` is the caller of this invoke. `store` is durable facts. Both can exist on the same tool."
                }
              ]
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/06.context_summarization.py",
              "kind": "lesson",
              "title": "Context summarization",
              "n": "06",
              "learn": "Replace old turns with a short summary so the gist survives and the window shrinks.",
              "file": "06.context_summarization.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "`trim_messages` drops detail. A summary keeps \"we already confirmed ORD-1 ships Tuesday\" without the ten turns it took."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "An LLM (or a cheaper model) writes a short recap of old messages; you keep recent turns verbatim."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Summarize a long shipping discussion about ORD-1."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Summaries still sit in-chat. Noisy **tool dumps** need compaction (next), not another paragraph of summary."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Summarizing the customer's name into \"a user\" is how prefs die. Names and IDs belong in the Store, not only in a summary."
                }
              ]
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/07.context_compaction.py",
              "kind": "lesson",
              "title": "Context compaction",
              "n": "07",
              "learn": "Shrink noisy middle content (long tool dumps) while keeping recent turns.",
              "file": "07.context_compaction.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Summarization helps old chat. A 4k-token `lookup_order` payload still wastes the window every turn after."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Compaction edits the middle: clear or shorten old tool results, keep the latest human/AI turns intact."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Compact a verbose `lookup_order` payload for ORD-1."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Production still needs durable Store/checkpointer backends. Compaction is prompt hygiene, not persistence."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "If you compact away the only copy of a fact you still need, put that fact in the Store first."
                }
              ]
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/08.growth_strategies.py",
              "kind": "lesson",
              "title": "Managing context growth (strategy ladder)",
              "n": "08",
              "learn": "As the thread grows, apply trim, compact, summarize, store, then retrieve — in that spirit of order.",
              "file": "08.growth_strategies.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Each previous lesson is a tool. This one is the **order** so you do not summarize first and still overflow on tool dumps."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "ol",
                  "items": [
                    "**Trim** — last N / token budget.",
                    "**Compact** — shorten tool dumps.",
                    "**Summarize** — gist of old turns.",
                    "**Store** — stable facts out of the chat.",
                    "**Retrieve** — pull only relevant memory or docs (RAG modules)."
                  ]
                },
                {
                  "type": "p",
                  "text": "Day 1 already persists the thread. Persistence does not shrink what the model sees."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "The ladder is manual until middleware (next) wires it on one agent."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Doing all five on a three-line ticket is ceremony. Start at the top of the ladder when it actually hurts."
                }
              ]
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/09.growth_middleware.py",
              "kind": "lesson",
              "title": "Growth strategies via middleware",
              "n": "09",
              "learn": "The growth ladder, wired on one order-support create_agent so you cannot forget a step.",
              "file": "09.growth_middleware.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Hand-running trim/summarize/compact each call is easy to skip on the one ticket that blows up at 5pm."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "table",
                  "headers": [
                    "Strategy",
                    "How"
                  ],
                  "rows": [
                    [
                      "Trim",
                      "SummarizationMiddleware `keep=(\"messages\", N)`"
                    ],
                    [
                      "Compact",
                      "ContextEditingMiddleware + ClearToolUsesEdit"
                    ],
                    [
                      "Summarize",
                      "SummarizationMiddleware trigger → summary of older turns"
                    ],
                    [
                      "Store",
                      "`create_agent(..., store=...)` + ToolRuntime prefs tools"
                    ],
                    [
                      "Retrieve",
                      "`get_prefs` / `lookup_order` (pull only what you need)"
                    ]
                  ]
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "One ORD-* agent with the five wired together."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Middleware order matters. Compact tool dumps before you summarize, or the summary will be a novel about JSON."
                }
              ]
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/10.production_backends.py",
              "kind": "lesson",
              "title": "Production backends (Postgres store, Postgres checkpointer, summarization)",
              "n": "10",
              "learn": "Same Store and checkpointer APIs, swapped for Postgres so process restart is not amnesia.",
              "file": "10.production_backends.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "In-memory Store and MemorySaver were teaching wheels. A real desk has more than one process and a restart policy."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "**PostgresStore** — same put/search as InMemoryStore. Survives restart; needs Postgres + pgvector."
                },
                {
                  "type": "p",
                  "text": "**Postgres checkpointer** — same `compile(checkpointer=...)` as MemorySaver / SqliteSaver. Shared across processes for an ORD-* `thread_id`."
                },
                {
                  "type": "p",
                  "text": "Summarization middleware stays the same; only the backends under it change."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Shapes of `from_conn_string`, `setup()`, `put` for a customer contact preference. You need a real Postgres to run it fully."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Two databases in one sentence still two jobs: Store = facts. Checkpointer = this thread. Do not store chat transcripts in the customer namespace \"to be safe.\""
                }
              ]
            }
          ]
        },
        {
          "id": "module:day 2/06. RAG Fundamentals",
          "title": "06. RAG Fundamentals",
          "items": [
            {
              "id": "lesson:day 2/06. RAG Fundamentals/01.why_rag.py",
              "kind": "lesson",
              "title": "Why RAG (order-support)",
              "n": "01",
              "animation": "rag",
              "learn": "Private policy text is not in the ORDERS dict. RAG retrieves your docs at question time.",
              "file": "01.why_rag.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Day 1 can answer \"status of ORD-1\". It cannot answer \"What is the refund window?\" or \"How long is standard shipping?\" Those sentences live in files."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Question → retrieve policy chunks → prompt + context → model → grounded answer. Use RAG when facts change without retraining and you need citations."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Name the questions ORDERS cannot answer. The rest of the folder builds the pipeline."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Do not RAG an order id. That is a tool. Do not fine-tune to learn next week's refund window."
                }
              ]
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/02.rag_architecture.py",
              "kind": "lesson",
              "title": "RAG architecture",
              "n": "02",
              "learn": "Index time builds the library. Query time finds a page and writes the answer.",
              "file": "02.rag_architecture.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Students mash \"embed the question into the documents\" into one step. The clocks are different. Mixing them is how you re-embed the handbook on every chat message."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "**Index time:** documents → chunk → embed → vector store."
                },
                {
                  "type": "p",
                  "text": "**Query time:** question → embed → similarity search → prompt → answer."
                },
                {
                  "type": "p",
                  "text": "Same corpus through this folder: refund_policy, shipping_policy, contacts."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "The embedding model (Ollama, here) is not the Groq chat model. One turns text into vectors. The other writes sentences."
                }
              ]
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/03.documents.py",
              "kind": "lesson",
              "title": "Documents",
              "n": "03",
              "learn": "A Document is page_content plus metadata. Source metadata is how citations start.",
              "file": "03.documents.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "A pile of strings cannot tell a desk which file a sentence came from. `Document` is the unit the rest of LangChain RAG expects."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`page_content` is the text. `metadata` holds `source` (and later section). Load files into that shape."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Load Acme order-support policy files."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Whole files are too big to embed as one unit. Chunking is next."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Metadata you drop at load time is gone at citation time. Put `source` on now."
                }
              ]
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/04.chunking.py",
              "kind": "lesson",
              "title": "Chunking",
              "n": "04",
              "learn": "Split documents so each chunk fits embedding and retrieval — small enough to be precise.",
              "file": "04.chunking.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Embed a whole policy PDF as one vector and \"refund window\" will retrieve the entire handbook, or none of it."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Splitters cut on size (and overlap so a sentence on a boundary is not lost). Each chunk is still a Document."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Chunk Acme refund / shipping / contacts."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Chunks are text only. You need vectors to search by meaning."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Tiny chunks lose sentences. Huge chunks lose precision. We pick a size in the file; later apps keep section titles in metadata."
                }
              ]
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/05.embeddings.py",
              "kind": "lesson",
              "title": "Embeddings",
              "n": "05",
              "learn": "embed_documents at index time. embed_query for the question. Same vector space.",
              "file": "05.embeddings.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "String chunks cannot be ranked by meaning. Embeddings put both the library and the question on a number line (a high-dimensional one)."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`embed_documents` for the corpus. `embed_query` for the question. We use local Ollama `nomic-embed-text` so you are not paying Groq to index files."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Embed a few chunks and a question; look at the fact that they are lists of floats."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Loose vectors in a Python list do not search at scale. A vector store is next."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Do not embed with model A and query with model B. The spaces will not match. Chat Groq is not an embedding model."
                }
              ]
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/06.vector_store.py",
              "kind": "lesson",
              "title": "Vector store",
              "n": "06",
              "learn": "A vector store holds chunk embeddings so you can rank by similarity later.",
              "file": "06.vector_store.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "A list of vectors has no query API, no `k`, no metadata filter. The store is the library index."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Index Acme policy chunks into `InMemoryVectorStore` (teaching). Production uses Chroma, FAISS, pgvector — same idea."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Add chunks, then notice you still have no customer-facing answer. Search is next; generation is after that."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "The store does not \"know policy.\" It knows nearest neighbours. Garbage chunks in, confident neighbours out."
                }
              ]
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/07.similarity_search.py",
              "kind": "lesson",
              "title": "Similarity search",
              "n": "07",
              "learn": "Embed the question, rank chunks by vector similarity.",
              "file": "07.similarity_search.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "A store with no query path cannot tell refund from shipping. This is the first time \"refund window\" should surface `refund_policy`."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`similarity_search(query, k=…)`. Under the hood: embed query, nearest neighbours, return Documents."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "A refund question should not return the contacts page first."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Raw hits are not a stable retriever API and not a grounded answer."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Similarity is not keyword search. \"ORD-1\" in a policy file is the wrong reason to RAG. Next modules still will not replace `lookup_order`."
                }
              ]
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/08.retrieval.py",
              "kind": "lesson",
              "title": "Retriever",
              "n": "08",
              "learn": "A retriever is question in, list of Documents out — so the rest of the app does not care which store you used.",
              "file": "08.retrieval.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "You already called `store.similarity_search` last lesson. Copy-pasting that everywhere couples every chain to this store's API."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "`retriever.invoke(q)` — same job, stable interface. `k` and filters live in `search_kwargs`. LCEL and LangGraph can pipe a retriever. Swap InMemory for Chroma later without rewriting call sites."
                },
                {
                  "type": "p",
                  "text": "Under the hood it still embeds the query and searches. Retriever = thin wrapper so \"get relevant docs\" is one step."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "`as_retriever` on the Acme policy index."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "A retriever is not an agent. It always searches. \"When to search\" is RAG-as-a-tool at the end of the apps module."
                }
              ]
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/09.grounded_answers.py",
              "kind": "lesson",
              "title": "Grounded answers",
              "n": "09",
              "learn": "Retriever → context → prompt → model. Answer only from the policy chunks.",
              "file": "09.grounded_answers.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Retrieval alone is a pile of paragraphs. A customer needs a reply. The contract: if it is not in the chunks, do not invent it."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Join retrieved content into `{context}`, fill a prompt with `{question}`, call the chat model. System rule: only use the context."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Refund window question grounded in Acme docs."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Answers without listed sources are hard to trust. Citations next."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "A fluent answer with empty context is a hallucination with extra steps. The no-result lesson in apps makes that a hard stop."
                }
              ]
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/10.citations.py",
              "kind": "lesson",
              "title": "Citations",
              "n": "10",
              "learn": "Return the answer plus source metadata from the chunks you actually used.",
              "file": "10.citations.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Grounded text without a file name is hard to audit on an ORD-* ticket. The desk will ask \"where does it say that?\""
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Each Document's `metadata.source` (and later section) goes back with the answer. Show **file names**, not a vibe."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Answer + policy file names."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Fundamentals stop here. The apps module builds ingest, empty hits, chains, graphs, and RAG as a tool."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Citing the whole corpus \"just in case\" trains nobody. Cite what was retrieved for this question."
                }
              ]
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/11.rag_vs_fine_tuning.py",
              "kind": "lesson",
              "title": "RAG vs fine-tuning",
              "n": "11",
              "learn": "RAG for changing facts and citations. Fine-tune for style. Tools for ORD-1.",
              "file": "11.rag_vs_fine_tuning.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "\"Should we fine-tune on the policy PDF?\" is the most expensive mix-up in the module. This page is the decision table."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "table",
                  "headers": [
                    "Approach",
                    "When"
                  ],
                  "rows": [
                    [
                      "RAG",
                      "Facts change, need citations, private docs (this folder)"
                    ],
                    [
                      "Fine-tune",
                      "Style, format, behaviour — not a substitute for live policies"
                    ],
                    [
                      "ORDERS dict / SQL",
                      "Tiny structured lookups (Day 1 status tool)"
                    ]
                  ]
                },
                {
                  "type": "p",
                  "text": "Rule of thumb: status of ORD-1 → tool. Refund window → RAG. Tone of voice → prompt or fine-tune."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Fine-tuning next week's SLA into weights means you retrain when legal changes a sentence. RAG means you re-index a file."
                }
              ]
            }
          ]
        },
        {
          "id": "module:day 2/07. Building RAG Applications",
          "title": "07. Building RAG Applications",
          "items": [
            {
              "id": "lesson:day 2/07. Building RAG Applications/01.ingest_pipeline.py",
              "kind": "lesson",
              "title": "Ingestion pipeline",
              "n": "01",
              "learn": "A reusable ingest step: scan a folder into Documents with path metadata.",
              "file": "01.ingest_pipeline.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Fundamentals loaded files ad hoc. An app needs one function you can re-run when legal drops a new PDF."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Scan a folder → `Document(page_content, metadata)` for Acme policies. Path/type metadata now, so later you can dedup or ACL."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Raw files may need section parsing before chunking."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Ingest is index-time. Do not ingest inside every user question."
                }
              ]
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/02.parse_sections.py",
              "kind": "lesson",
              "title": "Parse sections",
              "n": "02",
              "learn": "Split policy text into titled sections before you chunk, so structure survives.",
              "file": "02.parse_sections.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Whole-file ingest loses \"Refund window\" as a title. Retrieval then returns an anonymous slab."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Split on blank-line sections (or headings). Keep the title in metadata alongside source."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Section-parse Acme policy docs."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Sections may still be long. Chunk with metadata next."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Parsing is not embedding. You are still at index time, making better Documents."
                }
              ]
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/03.chunk_with_metadata.py",
              "kind": "lesson",
              "title": "Chunk with metadata",
              "n": "03",
              "learn": "chunk_size and overlap, while every chunk keeps source (and section) for citations.",
              "file": "03.chunk_with_metadata.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Parsed sections can still exceed embed size. If you strip metadata while splitting, citations die."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Split with overlap so boundary sentences are not lost. Copy `source` / section onto every child chunk."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Chunk Acme policies; inspect a chunk and confirm metadata is still there."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Chunks need indexing behind a retriever API."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Overlap is not \"more is better.\" Too much overlap duplicates hits and wastes the `k` budget."
                }
              ]
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/04.index_retriever.py",
              "kind": "lesson",
              "title": "Index + retriever",
              "n": "04",
              "learn": "Index once. retriever.invoke(query) with k in search_kwargs.",
              "file": "04.index_retriever.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Repeating `similarity_search(..., k=...)` at every call site is how `k=4` and `k=8` silently diverge."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Build the store from chunks once. `as_retriever` with `search_kwargs`. No custom class required for class."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Retriever on Acme policy docs."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Hits are not yet glued into a chat prompt."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Re-indexing on every question is the architecture bug from fundamentals. Index on ingest; query on chat."
                }
              ]
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/05.prompt_composition.py",
              "kind": "lesson",
              "title": "Retrieval prompt composition",
              "n": "05",
              "learn": "How retrieved docs actually get into the prompt the model sees.",
              "file": "05.prompt_composition.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Calling the retriever and pasting text by hand is easy to mess up (wrong variable, dropped chunk, no instruction to stay grounded). This is the wiring step."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Question → retriever → join chunks into `{context}` → `ChatPromptTemplate` fills `{context}` + `{question}` → model."
                },
                {
                  "type": "p",
                  "text": "Same idea as fundamentals \"grounded answers\", as an app pipeline."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Empty retrieval still reaches the model unless you handle it (next)."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Joining with blank lines is fine. Joining without source lines makes the citations lesson harder. Keep metadata in the loop even if the model only sees text."
                }
              ]
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/06.no_result_handling.py",
              "kind": "lesson",
              "title": "No-result handling",
              "n": "06",
              "learn": "If retrieval is not useful, do not invent policy facts. Say you do not know.",
              "file": "06.no_result_handling.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Prompt composition still calls the model on empty context. Fluency will fill the hole with a fake refund window."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "If hits are missing or clearly off-topic, skip generation (or use a fixed fallback). Known Acme questions go through; \"what's the weather\" does not become a shipping SLA."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Policy questions vs off-topic → fallback."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Good hits should also expose sources in the UI (next)."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "A low similarity score is a signal. Ignoring it because \"the model will sort it out\" is the opposite of grounding."
                }
              ]
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/07.source_attribution.py",
              "kind": "lesson",
              "title": "Source attribution",
              "n": "07",
              "learn": "Pair the answer with source file names from the retrieved chunks.",
              "file": "07.source_attribution.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Support agents must show which policy backed the reply. Fundamentals introduced citations; this is the app stub a UI can render."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "After retrieve, keep the Document list. After generate, return `{answer, sources}` where sources are unique file names (and sections if you have them)."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Shipping question → answer stub + sources list."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "Chain / graph wiring is still ad hoc. Next lessons package LCEL and LangGraph."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "Sources of chunks you did not retrieve are theatre. Only attribute what went into `{context}`."
                }
              ]
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/08.rag_langchain.py",
              "kind": "lesson",
              "title": "RAG with LangChain (LCEL chain)",
              "n": "08",
              "learn": "One composed LCEL chain: retriever | prompt | model, reusable as a service step.",
              "file": "08.rag_langchain.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Piecemeal scripts are hard to drop into a support service. A chain is one `.invoke(question)`."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Compose retriever, prompt, model (and parser if you want). Still a **straight line**: always retrieve, then generate."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "No branching, no tools, no \"skip retrieve.\" Graphs and agent-tools next."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "LCEL RAG is a workflow. It is the right default when every question is a policy question. Mixed tickets (status + policy) need a tool-choosing agent."
                }
              ]
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/09.rag_langgraph.py",
              "kind": "lesson",
              "title": "RAG with LangGraph",
              "n": "09",
              "learn": "Retrieve and generate as explicit nodes — inspectable, ready for retries or HITL.",
              "file": "09.rag_langgraph.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "LCEL is a straight chain. Graphs make steps visible (and later retryable). You already know nodes and edges from Day 1; this is RAG drawn that way."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Node retrieve → node generate. Same Acme corpus. State holds question, docs, answer."
                },
                {
                  "type": "h2",
                  "text": "Still limited"
                },
                {
                  "type": "p",
                  "text": "The graph **always** retrieves. An agent should choose when to search (next)."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "This is not agentic RAG yet. It is a workflow with two named steps. That is already better ops than a opaque chain when something fails."
                }
              ]
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/10.rag_as_agent_tool.py",
              "kind": "lesson",
              "title": "RAG as an agent tool",
              "n": "10",
              "learn": "Policy search is a tool. The agent decides when to retrieve — and when to look up ORD-1 instead.",
              "file": "10.rag_as_agent_tool.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "blocks": [
                {
                  "type": "h2",
                  "text": "Why this exists"
                },
                {
                  "type": "p",
                  "text": "Always-on retrieve→generate wastes a search on \"status of ORD-1\" and cannot mix structured lookup with unstructured policy."
                },
                {
                  "type": "h2",
                  "text": "How it works"
                },
                {
                  "type": "p",
                  "text": "Expose policy search as `@tool`. Day-1-style agent chooses `lookup_order` or `search_policies` (or both). Structured data through tools; prose through RAG."
                },
                {
                  "type": "h2",
                  "text": "In class"
                },
                {
                  "type": "p",
                  "text": "Status of ORD-1 via lookup; refund window via search_policies."
                },
                {
                  "type": "h2",
                  "text": "Don't mix this up"
                },
                {
                  "type": "p",
                  "text": "This is the end of Day 2's argument: **tool vs RAG vs workflow** on one desk. If the agent retrieves on every message anyway, you built the LangGraph RAG workflow with extra steps — simplify."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
