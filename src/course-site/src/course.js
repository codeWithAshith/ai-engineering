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
                "Every later lesson talks to this same object. This call does not train anything.",
                "`init_chat_model(\"groq:openai/gpt-oss-20b\")` builds the client. Old tutorials say `ChatOpenAI(...)`. Same kind of object, one string instead of a class per vendor.",
                "`model.invoke(messages)` sends the list and returns an `AIMessage`. The text is `result.content`.",
                "Nothing is remembered after the call returns. The next invoke only knows what you put in its list.",
                "This is one question and one answer. It is not an agent, and it is not embeddings."
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
              "demo": "messages",
              "learn": "A conversation is a list of typed messages, not one string.",
              "notes": [
                "The model only sees the list you pass on this call.",
                "`SystemMessage` is the standing rule. `HumanMessage` is the user. `AIMessage` in the list is a reply you are sending back as history, not the answer you are waiting for.",
                "\"What about France?\" only works if the Germany turn is still in that list.",
                "`ToolMessage` is a fourth type. It shows up when a tool returns. Not in this file."
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
                "`ChatPromptTemplate` fills `{topic}` and `{country}` into a system message and a human message. `template.invoke({...})` returns that list. It does not call the model.",
                "Few-shot in this file is two Q→A pairs written inside the system text, including the odd \"Helloo\" greeting. The model copies the shape. That is not chat history and not RAG.",
                "Use a template when the same prompt runs with different countries. Use few-shot when you care about the wording, not the facts."
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
              "demo": "chain",
              "learn": "The pipe is a pipeline you wrote: fill the template, then call the model.",
              "notes": [
                "Lesson 03 is two calls: `prompt.invoke`, then `model.invoke`. A chain is those two steps as one object.",
                "`prompt | model` then `chain.invoke({\"country\": \"France\"})`. The same chain runs again for Italy and Spain. You do not rebuild it.",
                "You still get an `AIMessage`. A parser on the end of the pipe is the next lesson.",
                "You chose both steps. The model does not pick the next one. If the path can branch, this is not a chain."
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
              "learn": "You ask for a format. The model still answers in text. The parser turns that text into the value you wanted.",
              "notes": [
                "With an output parser, you tell the model the format you want: a sentence, a comma-separated list, or JSON.",
                "The model still returns text. That text is what you pass to the parser. `StrOutputParser` gives a string, `CommaSeparatedListOutputParser` gives a list (`Paris, Berlin, Rome`), `JsonOutputParser` gives a dict.",
                "The pipe is `prompt | model | parser`. The parser sits after the model. It does not change what the model emits. It only converts the text that came back.",
                "Structured output is the other path. There you do not receive text and convert it. The call returns the object, so you read `result.capital` directly."
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
                "`model.with_structured_output(CapitalInfo)` binds the Pydantic schema to the call. You get `result.capital`, not a paragraph.",
                "An output parser still gets text. You asked for a format, the model wrote that format as text, and the parser converted it. Here you skip that step.",
                "Structured output binds the schema on the model. The return value is already the object, so there is no text to pass through a parser.",
                "This is not a tool. Nothing is looked up. The model is filling `country` and `capital`."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": [
                    "You need",
                    "Use"
                  ],
                  "rows": [
                    [
                      "Ask for a format, get text back, then convert that text",
                      "Output parser (lesson 05)"
                    ],
                    [
                      "Skip the text. The call returns the object, such as result.capital",
                      "Structured output (this lesson)"
                    ]
                  ]
                }
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
              "sample": "The capital of France is Paris…\n(words appear as they are generated)"
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
              "sample": "France: Paris.\nGermany: Berlin.\nItaly: Rome."
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
              "sample": "temperature=0 → Paris, and the same Paris if you run it again.\ntemperature=1 → a different flourish."
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
              "sample": "blocks: text, image_url\ninvoke still returns one AIMessage."
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
            },
            {
              "id": "lesson:day 1/01. Langchain Fundamentals/13.in_memory_saver.py",
              "kind": "lesson",
              "title": "Short-term memory",
              "n": "13",
              "learn": "Short-term memory is this chat. InMemorySaver keeps it in RAM under one thread_id.",
              "file": "13.in_memory_saver.py",
              "day": 1,
              "module": "01. Langchain Fundamentals",
              "notes": [
                "Short-term memory is the messages in the current chat. Without a checkpointer, each `invoke` starts over.",
                "`InMemorySaver` stores those messages in RAM for one `thread_id`. Pass that id on every turn of the same chat.",
                "A second `thread_id` is a different chat. Quit the process and this memory is gone. That is not long-term memory."
              ],
              "snippet": "create_agent(model, checkpointer=InMemorySaver())\nconfig={\"configurable\": {\"thread_id\": \"france\"}}",
              "sample": "same thread: Paris.\nother thread: Which country?"
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
              "learn": "Two ways to run the same tool. bind_tools returns a tool call and an executor has to run it. create_agent is that executor, and it loops.",
              "file": "01.tool_calling.py",
              "day": 1,
              "module": "02.Tool Calling",
              "notes": [
                "**bind_tools.** The model does not run the function. `invoke` returns a tool call: a name and arguments. Something else has to execute it, send the result back, and decide whether to call the model again. That something is an executor. In this file you are the executor, for one round. The old class that hid this loop was `AgentExecutor`.",
                "**create_agent.** This is the executor. It binds the tools, calls the model, runs every tool call, and repeats until the model stops asking. The system prompt stays on every turn. Read the last message as the answer."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": [
                    "Way",
                    "What the model does",
                    "Who runs the tool"
                  ],
                  "rows": [
                    [
                      "bind_tools",
                      "Returns a tool call. Does not run Python.",
                      "An executor. Here, you, for one round. A second call is a loop you write. The old name for that loop was AgentExecutor."
                    ],
                    [
                      "create_agent",
                      "Same tool call.",
                      "The agent. It runs every call and repeats until the model stops asking."
                    ]
                  ]
                }
              ],
              "snippet": "model_with_tools = model.bind_tools(tools)\nagent = create_agent(model, tools=tools)",
              "sample": "bind_tools: ORD-1 is shipped.\ncreate_agent: ORD-1 is shipped."
            },
            {
              "id": "lesson:day 1/02.Tool Calling/02.errors_and_validation.py",
              "kind": "lesson",
              "title": "Tool errors and validation",
              "n": "02",
              "learn": "A tool should return an error string. It should not crash the agent.",
              "file": "02.errors_and_validation.py",
              "day": 1,
              "module": "02.Tool Calling",
              "notes": [
                "`args_schema` is the Pydantic model on `@tool`. It types the arguments before the function runs.",
                "Bad input, such as an amount over 500, returns an `ERROR` string. It does not raise.",
                "Bad data, such as a missing order, returns an `ERROR` string. The agent can explain or ask again.",
                "An exception kills the conversation. An error string is just another tool result."
              ],
              "snippet": "return f\"ERROR: order {order_id} not found\"",
              "sample": "ERROR: order ORD-999 not found\nERROR: amount must be positive",
              "demo": "refund-cases",
              "evolution": {
                "title": "How a crash became a tool result",
                "subtitle": "From an exception to an ERROR string",
                "eras": [
                  {
                    "era": "Era 1",
                    "years": "Early tool calls",
                    "name": "The tool raised",
                    "what": "A bad amount or a missing order threw. The agent stopped and the thread was gone.",
                    "flaw": "The model never got a chance to explain.",
                    "shift": "Catch it inside the tool."
                  },
                  {
                    "era": "Era 2",
                    "years": "Hand-written guards",
                    "name": "try/except in every tool",
                    "what": "Each function grew its own validation copy.",
                    "flaw": "The boilerplate drifted. One tool still crashed.",
                    "shift": "Describe the args once, and return text."
                  },
                  {
                    "era": "Era 3",
                    "years": "This lesson",
                    "name": "An error is a result",
                    "what": "args_schema types the arguments. Bad input and a missing order both return an ERROR string. The agent reads it and continues.",
                    "standard": "Do not raise for a customer mistake. Return the string."
                  }
                ],
                "takeaway": "Errors are tool outputs. The agent handles them."
              }
            },
            {
              "id": "lesson:day 1/02.Tool Calling/03.response_format.py",
              "kind": "lesson",
              "title": "Response format",
              "n": "03",
              "learn": "response_format asks the agent for a typed final answer.",
              "file": "03.response_format.py",
              "day": 1,
              "module": "02.Tool Calling",
              "notes": [
                "`response_format` asks the agent for a typed final answer. The app reads `structured_response`, the same idea as `with_structured_output` on a whole agent turn.",
                "Use it when the app needs `order_id` and `status`, not only chat text.",
                "This Groq model cannot combine that JSON format with tools in one call. This lesson is the typed reply, with no tools on that agent."
              ],
              "snippet": "agent = create_agent(model, response_format=OrderStatus)\nresult[\"structured_response\"].status",
              "sample": "order_id = ORD-1\nstatus = shipped",
              "demo": "response-shape",
              "evolution": {
                "title": "How an agent answer became fields",
                "subtitle": "From a paragraph to structured_response",
                "eras": [
                  {
                    "era": "Era 1",
                    "years": "Early agents",
                    "name": "Parse the paragraph",
                    "what": "The agent wrote a sentence. The app used regex to find the order id.",
                    "flaw": "One extra clause broke the parse.",
                    "shift": "Ask for JSON in the prompt."
                  },
                  {
                    "era": "Era 2",
                    "years": "Prompted JSON",
                    "name": "Reply in JSON",
                    "what": "The system prompt said return only JSON. Sometimes the model did.",
                    "flaw": "A preamble still crashed json.loads.",
                    "shift": "Bind the schema on the agent."
                  },
                  {
                    "era": "Era 3",
                    "years": "This lesson",
                    "name": "response_format",
                    "what": "create_agent(..., response_format=OrderStatus) returns structured_response. The app reads .status.",
                    "standard": "Same idea as with_structured_output, on the whole agent turn. This Groq setup cannot combine that with tools in one call."
                  }
                ],
                "takeaway": "If the app needs fields, do not parse the chat text."
              }
            },
            {
              "id": "lesson:day 1/02.Tool Calling/04.tool_design_patterns.py",
              "kind": "lesson",
              "title": "How a tool should look",
              "n": "04",
              "learn": "One job per tool. The model reads the name, the description, and the args.",
              "demo": "tool-look",
              "notes": [
                "The left column is one function that hides lookup and refund behind an `action` string. The description does not say which string to pass.",
                "The right column is status only. The name is the job. The description says when to call it, and when not to.",
                "A Pydantic `Field` describes an argument on that same custom tool. It is not a separate kind of tool.",
                "After the tool runs, the executor sends a **ToolMessage**. That is the return value, tied to the call that asked for it. It is not the model's answer."
              ],
              "file": "04.tool_design_patterns.py",
              "day": 1,
              "module": "02.Tool Calling",
              "snippet": "@tool\ndef lookup_order(order_id: str) -> str:\n    \"\"\"Look up one order's status by id. Not for refunds.\"\"\"",
              "sample": "name: lookup_order_status\ndescription: Look up one order by id. Use for \"where is my order?\". Not for refunds.\nargs: {'order_id': {'title': 'Order Id', 'type': 'string'}}\n\nToolMessage:\n  type: tool\n  name: lookup_order_status\n  tool_call_id: call_abc123\n  content: shipped",
              "evolution": {
                "title": "How a tool description got specific",
                "subtitle": "From one giant tool to a name, a docstring, and args",
                "eras": [
                  {
                    "era": "Era 1",
                    "years": "Early tools",
                    "name": "One function does everything",
                    "what": "support_action took an action string, an order id, and an amount. The docstring said \"Handle support actions.\"",
                    "flaw": "The model could not tell lookup from refund.",
                    "shift": "One action per tool."
                  },
                  {
                    "era": "Era 2",
                    "years": "Focused tools",
                    "name": "The name is the job",
                    "what": "lookup_order_status is only status. issue_refund is only a refund.",
                    "flaw": "A name without a when-to-use line is still a guess.",
                    "shift": "Write the docstring for the model."
                  },
                  {
                    "era": "Era 3",
                    "years": "This lesson",
                    "name": "Name, description, args",
                    "what": "The docstring says when to call it and when not to. A Pydantic Field describes each argument.",
                    "standard": "The function body is not in the dump."
                  }
                ],
                "takeaway": "Write the description the way you would write an API doc for the model."
              }
            },
            {
              "id": "lesson:day 1/02.Tool Calling/05.model_picks_the_tool.py",
              "kind": "lesson",
              "title": "The model picks the tool",
              "n": "05",
              "learn": "This agent is reactive. It does not write a plan. It acts, observes the result, and comes back.",
              "demo": "reactive-loop",
              "file": "05.model_picks_the_tool.py",
              "day": 1,
              "module": "02.Tool Calling",
              "notes": [
                "A reactive agent has no step list. Each turn it only sees the messages so far, including the last tool result, and chooses the next action.",
                "`create_agent` is that loop. Question, tool, result, answer. A planning agent would write the steps before it called anything. This file does not.",
                "The menu is `lookup_order_status` and `issue_refund`. “Where is ORD-1?” matches lookup, so that is the one action it takes."
              ],
              "snippet": "create_agent(model, tools=[lookup_order_status, issue_refund])",
              "sample": "picked: lookup_order_status\nORD-1 is shipped."
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
              "learn": "A chain is a straight line. A graph is for a branch, a retry, and shared ticket state.",
              "file": "01.why_langgraph.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "`prompt | model` cannot look up, miss, and look up again. Order support needs that.",
                "A cycle goes back. A branch picks the next desk. Nodes read and write the same ticket.",
                "LangGraph is not only for agents. A fixed workflow can be a graph. Use a chain until you need a cycle or a branch."
              ],
              "snippet": "graph = StateGraph(TicketState)\ngraph.add_node(\"lookup\", lookup)",
              "sample": "ORD-3 is cancelled → escalate\nORD-1 is normal → lookup",
              "demo": "graph",
              "graph": "why"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/02.nodes_and_edges.py",
              "kind": "lesson",
              "title": "Nodes and edges",
              "n": "02",
              "learn": "A node is a function of state. A fixed edge always goes from A to B.",
              "file": "02.nodes_and_edges.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "The highlight walks START, normalize, enrich, END. That is the whole file: nodes in a fixed order.",
                "A node takes the ticket and returns a partial update. Return only the fields you change.",
                "`add_edge` always runs next. `START` and `END` are the entry and the exit.",
                "This path is the same for every ticket: normalize, then enrich. The next lesson is the branch."
              ],
              "snippet": "graph.add_edge(START, \"normalize\")\ngraph.add_edge(\"normalize\", \"enrich\")\ngraph.add_edge(\"enrich\", END)",
              "sample": "ORD-1 normalized\nORD-1 enriched",
              "demo": "graph",
              "graph": "nodes"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/03.conditional_edges.py",
              "kind": "lesson",
              "title": "Conditional edges",
              "n": "03",
              "learn": "A route function reads the ticket and returns the next node name.",
              "file": "03.conditional_edges.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "Press Priority high, then Everyone else. The same classify node sends the ticket down a different edge.",
                "`add_conditional_edges` takes a function. That function returns `\"vip\"` or `\"standard\"`.",
                "The if/else lives on the edge. High priority goes to the VIP desk. Everything else goes to the standard desk.",
                "If the decision matters later, write it into state. Do not hide a long classifier inside the edge."
              ],
              "snippet": "def route(state):\n    return \"vip\" if state[\"priority\"] == \"high\" else \"standard\"",
              "sample": "ORD-1 priority high → vip\nORD-2 → standard",
              "demo": "graph",
              "graph": "conditional"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/04.routing_nodes.py",
              "kind": "lesson",
              "title": "Routing nodes",
              "n": "04",
              "learn": "A routing node writes the decision into state. The edge only reads it.",
              "file": "04.routing_nodes.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "Press Order, Product, or Other. classify writes the desk. You see which node runs next.",
                "The node classifies the ticket and stores the desk name. The conditional edge reads that field.",
                "You can log the choice because it is on the ticket, not trapped inside the edge function.",
                "Free-text questions get a priority here, before anyone branches."
              ],
              "snippet": "def classify(state):\n    return {\"desk\": \"vip\" if urgent(state) else \"standard\"}",
              "sample": "desk = vip\nnext = vip node",
              "demo": "graph",
              "graph": "routing"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/05.state_and_reducers.py",
              "kind": "lesson",
              "title": "State and reducers",
              "n": "05",
              "learn": "A reducer decides how a node's update merges into the ticket.",
              "file": "05.state_and_reducers.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "Returning a partial dict replaces that field unless you attach a reducer.",
                "Messages append. A counter adds. A status field replaces. That is what the reducer is for.",
                "Wiping the ticket happens when a node returns a full new state instead of the fields it changed."
              ],
              "snippet": "messages: Annotated[list, add_messages]",
              "sample": "messages grew by 1\nstatus replaced with shipped",
              "demo": "graph",
              "graph": "reducers"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/06.agent_loops.py",
              "kind": "lesson",
              "title": "Agent loops",
              "n": "06",
              "learn": "An agent loop is a cycle: model, then tools, then model, until it can stop.",
              "file": "06.agent_loops.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "The model node either answers or asks for a tool. The tools node runs the call and comes back.",
                "The conditional edge is the stop. No tool call means END.",
                "This is the same loop `create_agent` builds. Here you can see the nodes."
              ],
              "snippet": "graph.add_conditional_edges(\"model\", tools_or_end)",
              "sample": "model → lookup_order → model → END",
              "demo": "graph",
              "graph": "loop"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/07.parallel_edges.py",
              "kind": "lesson",
              "title": "Parallel edges",
              "n": "07",
              "learn": "Two edges from the same node run those nodes side by side.",
              "notes": [
                "Linear is A then B. Parallel is A and B, then a merge.",
                "The edges are fixed. You know both checks before the run starts.",
                "Map-reduce with `Send` is the other pattern. That one creates a branch per item at runtime."
              ],
              "file": "07.parallel_edges.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "snippet": "graph.add_edge(START, \"check_a\")\ngraph.add_edge(START, \"check_b\")",
              "sample": "check_a and check_b both finish\nmerge writes the ticket",
              "demo": "graph",
              "graph": "parallel"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/08.streaming.py",
              "kind": "lesson",
              "title": "Streaming",
              "n": "08",
              "learn": "stream shows the ticket as it moves. invoke waits for the end.",
              "notes": [
                "`updates` is the partial write from the node that just ran. Use it to see progress.",
                "`values` is the whole ticket after that step. `messages` is the tokens as they arrive.",
                "`invoke` is one final state. Use it when the room only needs the finished reply."
              ],
              "file": "08.streaming.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "snippet": "for event in app.stream(inputs, stream_mode=\"updates\"):\n    print(event)",
              "sample": "updates: {\"chatbot\": {\"messages\": [...]}}\nmessages: The status of ORD-1 is shipped",
              "demo": "graph",
              "graph": "streaming"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/09.thinking_stream.py",
              "kind": "lesson",
              "title": "Thinking stream",
              "n": "09",
              "learn": "One stream can show which node ran and the answer tokens at the same time.",
              "notes": [
                "`stream_mode=[\"updates\", \"messages\"]` sends both.",
                "`updates` is the thinking line: chatbot or tools. `messages` is the typed answer.",
                "One mode alone cannot show tool progress and live text together."
              ],
              "file": "09.thinking_stream.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "snippet": "app.stream(inputs, stream_mode=[\"updates\", \"messages\"])",
              "sample": "[thinking] tools\nThe status of ORD-1 is shipped",
              "demo": "graph",
              "graph": "thinking"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/10.persistence.py",
              "kind": "lesson",
              "title": "Persistence",
              "n": "10",
              "learn": "A checkpointer saves the ticket after each step. thread_id picks the conversation.",
              "notes": [
                "A checkpoint is the state after a step. The next `invoke` on that `thread_id` continues from it.",
                "`MemorySaver` keeps those snapshots in RAM. A new process loses them.",
                "Without `thread_id`, the checkpointer does not know which conversation you mean."
              ],
              "file": "10.persistence.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "snippet": "app = graph.compile(checkpointer=MemorySaver())\napp.invoke(inputs, {\"configurable\": {\"thread_id\": \"ord-1\"}})",
              "sample": "turn 1: ORD-1 is shipped\nturn 2: same thread still knows ORD-1",
              "demo": "graph",
              "graph": "persistence"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/11.runnable_config.py",
              "kind": "lesson",
              "title": "RunnableConfig extras (recursion_limit, metadata)",
              "n": "11",
              "learn": "The config on invoke carries thread_id, a recursion limit, and metadata.",
              "file": "11.runnable_config.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "`configurable.thread_id` is the conversation. The checkpointer requires it.",
                "`recursion_limit` stops a loop that never ends. The default is easy to hit on a bad tool cycle.",
                "Metadata is for you. The model does not read it."
              ],
              "snippet": "config = {\"configurable\": {\"thread_id\": \"t1\"}, \"recursion_limit\": 8}",
              "sample": "thread t1\nstopped at recursion_limit",
              "demo": "graph",
              "graph": "config"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/12.durable_checkpointers.py",
              "kind": "lesson",
              "title": "Durable checkpointers",
              "n": "12",
              "learn": "SqliteSaver is the same checkpointer API as MemorySaver, on disk.",
              "file": "12.durable_checkpointers.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "The graph does not change. You pass a different checkpointer to `compile`.",
                "The thread survives a process restart. `MemorySaver` does not.",
                "Use this when the room needs to stop the script and resume the same ticket."
              ],
              "snippet": "app = graph.compile(checkpointer=SqliteSaver(conn))",
              "sample": "restart the process\nthread ord-1 still has the ticket",
              "demo": "graph",
              "graph": "durable"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/13.get_state_update_state.py",
              "kind": "lesson",
              "title": "get_state and update_state",
              "n": "13",
              "learn": "get_state reads the checkpoint. update_state writes a field while you are paused.",
              "file": "13.get_state_update_state.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "`get_state(config)` is the ticket as saved, including which node runs next.",
                "`update_state` patches a field, such as a wrong order id, without replaying the whole graph.",
                "You resume with `invoke(None, config)`. You do not send the question again."
              ],
              "snippet": "snap = app.get_state(config)\napp.update_state(config, {\"order_id\": \"ORD-1\"})",
              "sample": "next node: tools\norder_id changed to ORD-1",
              "demo": "graph",
              "graph": "state"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/14.subgraphs.py",
              "kind": "lesson",
              "title": "Subgraphs",
              "n": "14",
              "learn": "A subgraph is a graph used as one node in a parent graph.",
              "file": "14.subgraphs.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "The parent sees one step. Inside, the child has its own nodes.",
                "Use it when a desk has its own little workflow and the parent only needs the result.",
                "The child state and the parent state meet at the fields you map across."
              ],
              "snippet": "parent.add_node(\"refund_desk\", refund_graph)",
              "sample": "parent → refund_desk → parent",
              "demo": "graph",
              "graph": "subgraph"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/15.map_reduce_send.py",
              "kind": "lesson",
              "title": "Map-reduce with Send",
              "n": "15",
              "learn": "Send starts one branch per item. A reducer joins the results.",
              "file": "15.map_reduce_send.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "Parallel edges are fixed. `Send` is one branch per order, decided at runtime.",
                "Each branch does the same work on a different id. A reducer collects the list.",
                "If order 2 depends on order 1, this is the wrong pattern. Use a sequence."
              ],
              "snippet": "return [Send(\"lookup\", {\"order_id\": oid}) for oid in ids]",
              "sample": "ORD-1 shipped\nORD-2 pending\nsummary written once",
              "demo": "graph",
              "graph": "mapreduce"
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
              "learn": "If you can write the steps on a whiteboard, do not start with an agent.",
              "file": "01.when_to_build_agents.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "notes": [
                "An LLM app is one prompt and one answer. A workflow is a path you chose. An agent is a path the model chooses.",
                "Prefer an agent when the tool, or the number of steps, is not known up front.",
                "An agent that always calls one tool in one order is a workflow with extra ways to fail."
              ],
              "snippet": "LLM app | workflow | agent",
              "sample": "Refund ORD-1?\nworkflow: lookup, then refund\nagent: the model picks lookup, refund, or both"
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/02.create_agent.py",
              "kind": "lesson",
              "title": "Create agent",
              "n": "02",
              "learn": "create_agent is the graph. You pass the model. Tools are optional.",
              "notes": [
                "It calls the model in a loop until the model can stop. With no tools, that is one reply.",
                "This file uses the model and a system prompt. A checkpointer is what makes the second turn remember the first.",
                "`tools` omitted means there is no tool loop. That is still `create_agent`."
              ],
              "file": "02.create_agent.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "snippet": "agent = create_agent(model, system_prompt=\"You are a geography tutor.\")",
              "sample": "The capital of France is Paris."
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/03.basic_agent_no_tools.py",
              "kind": "lesson",
              "title": "Basic agent no tools",
              "n": "03",
              "learn": "Without tools, the agent cannot see ORDERS. It has to decline.",
              "notes": [
                "`create_agent` with no tools is a chat model inside a graph. The graph is model, then end.",
                "ORDERS is in the process. The agent has no function that reads it, so it must not invent a status.",
                "The next file adds the tools. The graph then grows a tools node."
              ],
              "file": "03.basic_agent_no_tools.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "snippet": "agent = create_agent(model, system_prompt=\"You are order support. You have no order tools.\")",
              "sample": "I can't look up ORD-1."
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/04.order_support_agent.py",
              "kind": "lesson",
              "title": "Order support agent",
              "n": "04",
              "learn": "The same agent, plus lookup tools. The graph adds a tools loop.",
              "notes": [
                "`create_agent(model, tools=[lookup_order, list_orders])` is the previous agent with a way to read ORDERS.",
                "The model asks for the tool. The tool runs. The model answers from the result.",
                "Status questions should hit the tool. They should not be guessed."
              ],
              "file": "04.order_support_agent.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "snippet": "agent = create_agent(model, tools=[lookup_order, list_orders])",
              "sample": "ORD-1 is shipped."
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/05.human_in_the_loop.py",
              "kind": "lesson",
              "title": "Human in the loop",
              "n": "05",
              "learn": "interrupt() inside a tool pauses the run until a person approves.",
              "notes": [
                "Lookup can run on its own. A refund must not. `request_refund` calls `interrupt()`.",
                "`MemorySaver` and `thread_id` are what make the pause resumable.",
                "Resume with `Command(resume=True)` or `Command(resume=False)`. The question is not sent again."
              ],
              "file": "05.human_in_the_loop.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "snippet": "interrupt({\"action\": \"refund\", \"order_id\": order_id})",
              "sample": "status of ORD-1: shipped (no pause)\nrefund ORD-1: paused, then approved"
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/06.approve_before_tools.py",
              "kind": "lesson",
              "title": "Approve before tools",
              "n": "06",
              "learn": "interrupt_before=[\"tools\"] pauses before any tool runs.",
              "notes": [
                "The pause is on the tools node, not inside one function. Every tool call stops for a look.",
                "The person sees the pending call, then you resume with `invoke(None, config)`.",
                "`interrupt()` inside one tool only covers that tool. This covers whatever the model chose."
              ],
              "file": "06.approve_before_tools.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "snippet": "agent = create_agent(..., interrupt_before=[\"tools\"])",
              "sample": "pending: cancel_order(ORD-1)\napproved → tool runs"
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/07.hitl_fix_resume.py",
              "kind": "lesson",
              "title": "Hitl fix resume",
              "n": "07",
              "learn": "While paused, update_state can fix the order id. Then you resume.",
              "notes": [
                "Approve or reject cannot correct a wrong id. `update_state` writes the field on the checkpoint.",
                "Then `invoke(None, config)` continues from the tools node with the new id.",
                "You are editing the pending call, not starting a new question."
              ],
              "file": "07.hitl_fix_resume.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "snippet": "app.update_state(config, {\"messages\": corrected})\napp.invoke(None, config)",
              "sample": "pending ORD-9\nedited to ORD-1\nresumed"
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/08.agent_handoff.py",
              "kind": "lesson",
              "title": "Agent handoff",
              "n": "08",
              "learn": "A coordinator routes the ticket to a specialist agent.",
              "notes": [
                "The main agent classifies. Refund, tracking, and general each have their own prompt and tools.",
                "Those specialists are subgraphs. A routing node is one function. A handoff is a whole agent.",
                "The coordinator does not answer the specialist's question itself."
              ],
              "file": "08.agent_handoff.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "snippet": "coordinator → refund agent | tracking agent | general agent",
              "sample": "refund question → refund agent\ntracking question → tracking agent"
            },
            {
              "id": "lesson:day 1/04. Building Agents with LangGraph/09.debugging_agents.py",
              "kind": "lesson",
              "title": "Debugging agents",
              "n": "09",
              "learn": "When an agent fails, name which of the four it is.",
              "notes": [
                "Wrong tool, or no tool. A loop that never stops. A reply that ignores the tool result. Arguments in the wrong shape.",
                "Print the message list. The tool call and the tool result are both in it.",
                "A recursion limit turns an infinite loop into a stop you can see."
              ],
              "file": "09.debugging_agents.py",
              "day": 1,
              "module": "04. Building Agents with LangGraph",
              "snippet": "for m in result[\"messages\"]:\n    print(type(m).__name__, getattr(m, \"tool_calls\", None) or m.content)",
              "sample": "AIMessage tool_calls lookup_order\nToolMessage shipped\nAIMessage ignored the tool and guessed"
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
          "id": "module:day 2/04. Advanced Tool Patterns",
          "title": "04. Advanced Tool Patterns",
          "items": [
            {
              "id": "lesson:day 2/04. Advanced Tool Patterns/01.default_middleware.py",
              "kind": "lesson",
              "title": "Default middleware",
              "n": "01",
              "learn": "Middleware is a wrapper in a list. The agent function stays the same.",
              "notes": [
                "A tool that raises becomes an error message the model can read. `ToolErrorMiddleware` does that.",
                "A run that calls tools too many times stops. A run that calls the model too many times stops. Those are the two limits.",
                "A person approving a write is the next lesson. It is not one of these guards."
              ],
              "file": "01.default_middleware.py",
              "day": 2,
              "module": "04. Advanced Tool Patterns",
              "snippet": "create_agent(model, tools=[lookup_order], middleware=[ToolErrorMiddleware()])",
              "sample": "ORD-999 raises\nmodel receives an error ToolMessage and replies"
            },
            {
              "id": "lesson:day 2/04. Advanced Tool Patterns/02.human_middleware.py",
              "kind": "lesson",
              "title": "A person approves the write",
              "n": "02",
              "learn": "One question: set ORD-1 to delivered. The write waits until a person approves.",
              "demo": "human-pause",
              "notes": [
                "Ask to change the status. `HumanInTheLoopMiddleware` pauses before `update_order_status` runs.",
                "The thread sits in `InMemorySaver` until the resume says approve.",
                "Then the tool runs. Until then, ORD-1 is still shipped."
              ],
              "file": "02.human_middleware.py",
              "day": 2,
              "module": "04. Advanced Tool Patterns",
              "snippet": "HumanInTheLoopMiddleware(interrupt_on={\"update_order_status\": True})",
              "sample": "paused: true\nafter approve: ORD-1 is delivered"
            },
            {
              "id": "lesson:day 2/04. Advanced Tool Patterns/03.custom_middleware.py",
              "kind": "lesson",
              "title": "Custom middleware",
              "n": "03",
              "learn": "wrap_tool_call sits around the real tool. You log it, then call the handler.",
              "notes": [
                "The signature is `(request, handler)`. `handler(request)` is the real tool.",
                "You can log the name and the arguments, then return the result unchanged.",
                "This file audits `lookup_order` for ORD-1. It does not change the answer."
              ],
              "file": "03.custom_middleware.py",
              "day": 2,
              "module": "04. Advanced Tool Patterns",
              "snippet": "@wrap_tool_call\ndef audit(request, handler):\n    print(request.tool_call)\n    return handler(request)",
              "sample": "lookup_order ORD-1\nshipped"
            },
            {
              "id": "lesson:day 2/04. Advanced Tool Patterns/04.agent_context.py",
              "kind": "lesson",
              "title": "Agent context",
              "n": "04",
              "learn": "Context is data about this caller, passed on invoke. It is not the chat and not the checkpointer.",
              "notes": [
                "`context_schema` describes the fields, such as role or user id.",
                "You pass them with `invoke(..., context=...)`. A tool reads `runtime.context`.",
                "Messages are the conversation. The checkpointer is the thread. Context is who is calling this time."
              ],
              "file": "04.agent_context.py",
              "day": 2,
              "module": "04. Advanced Tool Patterns",
              "snippet": "agent.invoke({\"messages\": [...]}, context={\"role\": \"agent\", \"user_id\": \"u1\"})",
              "sample": "who_am_i: agent u1"
            },
            {
              "id": "lesson:day 2/04. Advanced Tool Patterns/06.tool_governance.py",
              "kind": "lesson",
              "title": "Tool governance",
              "n": "06",
              "learn": "The role is checked when the tool runs. You do not build a separate agent per role.",
              "notes": [
                "`context.role` says who is calling. `@wrap_tool_call` allows or blocks the tool.",
                "A viewer is blocked from `issue_refund`. An agent is allowed.",
                "The same `create_agent` serves both. The middleware is the gate."
              ],
              "file": "06.tool_governance.py",
              "day": 2,
              "module": "04. Advanced Tool Patterns",
              "snippet": "if request.runtime.context.role != \"agent\":\n    return \"ERROR: not allowed\"",
              "sample": "viewer + issue_refund → blocked\nagent + issue_refund → allowed"
            },
            {
              "id": "lesson:day 2/04. Advanced Tool Patterns/07.dynamic_prompt.py",
              "kind": "lesson",
              "title": "Dynamic prompt",
              "n": "07",
              "learn": "The system prompt is middleware. This run's context writes it before the model node.",
              "notes": [
                "`@dynamic_prompt` wraps the model node. It is not a second agent.",
                "The function reads `request.runtime.context` and returns the prompt for this call.",
                "An agent and a customer can share one `create_agent`. The role changes the instructions."
              ],
              "file": "07.dynamic_prompt.py",
              "day": 2,
              "module": "04. Advanced Tool Patterns",
              "snippet": "@dynamic_prompt\ndef role_prompt(request):\n    return prompt_for(request.runtime.context.role)",
              "sample": "agent: I can check that order.\ncustomer: I can't look up orders."
            },
            {
              "id": "lesson:day 2/04. Advanced Tool Patterns/08.dynamic_tools.py",
              "kind": "lesson",
              "title": "Dynamic tools",
              "n": "08",
              "learn": "The tool list is middleware. This run's context chooses which tools the model node can see.",
              "notes": [
                "`@wrap_model_call` wraps the model node. `request.override(tools=...)` is the list for this call.",
                "An agent sees `lookup_order`. A customer sees no tools. The registered list on `create_agent` does not change.",
                "This is the same middleware style as the dynamic prompt. One agent, a different model call."
              ],
              "file": "08.dynamic_tools.py",
              "day": 2,
              "module": "04. Advanced Tool Patterns",
              "snippet": "@wrap_model_call\ndef tools_for_role(request, handler):\n    return handler(request.override(tools=tools_for(request.runtime.context.role)))",
              "sample": "agent: ORD-1 is shipped.\ncustomer: no lookup tool on this call"
            }
          ]
        },
        {
          "id": "module:day 2/05. Agent Memory & Context Engineering",
          "title": "05. Agent Memory & Context Engineering",
          "items": [
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/01.why_context_engineering.py",
              "kind": "lesson",
              "title": "Why context engineering (order-support)",
              "n": "01",
              "learn": "Context engineering is choosing what the model sees on this turn.",
              "file": "01.why_context_engineering.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "notes": [
                "The layers are the system prompt, the session history, user memory, retrieved docs or tools, and the current question.",
                "The Day 1 agent sends the whole thread and every tool dump. That fills the window.",
                "A preference dies when the thread ends. A policy answer is not in the ORDERS dict."
              ],
              "snippet": "system · history · memory · retrieved docs · question",
              "sample": "ORD-1 status is in ORDERS\nrefund window is not"
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/02.context_limits_and_trim.py",
              "kind": "lesson",
              "title": "Context limits and trim",
              "n": "02",
              "learn": "trim_messages keeps the tail of the thread. The checkpointer still has the whole thread.",
              "notes": [
                "A long thread costs more, adds noise, and gets cut off.",
                "`history[-10:]` can start on a tool result and break the chat API. `trim_messages` counts tokens and can force the slice to start on a human message.",
                "Trim only changes what this invoke sends. Facts you still need later belong in the Store."
              ],
              "file": "02.context_limits_and_trim.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "snippet": "trim_messages(messages, max_tokens=..., start_on=\"human\")",
              "sample": "checkpointer: full thread\nmodel sees: the recent tail"
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/03.agent_store.py",
              "kind": "lesson",
              "title": "Agent store",
              "n": "03",
              "learn": "The checkpointer is one thread. The Store is facts that survive a new thread.",
              "notes": [
                "A checkpointer does not share \"email me\" across a new `thread_id`.",
                "The Store is a namespaced key/value next to the checkpointer. A tool reads and writes it with `ToolRuntime.store`.",
                "Save the contact preference for the customer of ORD-1. A new support thread can recall it."
              ],
              "file": "03.agent_store.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "snippet": "store.put((\"customers\", \"cust-42\"), \"contact\", {\"value\": \"email\"})",
              "sample": "thread A: email me\nthread B: still email"
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/09.summarize_thread.py",
              "kind": "lesson",
              "title": "Summarize the thread",
              "n": "09",
              "learn": "The saver keeps the chat. SummarizationMiddleware folds the old turns into one note.",
              "demo": "summarize-thread",
              "notes": [
                "This is one small piece. The saver holds the thread. The summarizer only rewrites what the model is shown.",
                "Move the slider. The old turns become one summary. The last two messages stay.",
                "A fact that should survive a new chat belongs in the Store, the previous lesson. A summary is not that fact."
              ],
              "file": "09.summarize_thread.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "snippet": "checkpointer=InMemorySaver(),\nmiddleware=[SummarizationMiddleware(trigger=(\"messages\", 6), keep=(\"messages\", 2))]",
              "sample": "summary of the gift, the email, and the damage\nthen the latest question"
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/04.growth_middleware.py",
              "kind": "lesson",
              "title": "Growth middleware",
              "n": "04",
              "learn": "Saver, summary, and store are three small pieces. This is where they meet.",
              "demo": "memory-pieces",
              "notes": [
                "The saver keeps this chat. The summarizer folds old turns into one note. The store keeps a fact for a new chat.",
                "Each one is its own lesson. None of them replaces the others.",
                "On one agent you pass the saver, the summarizer middleware, and the store together."
              ],
              "file": "04.growth_middleware.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "snippet": "create_agent(model, tools, middleware=[SummarizationMiddleware(...)], store=store)",
              "sample": "old tool dumps cleared\npreference still in the Store"
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/05.production_backends.py",
              "kind": "lesson",
              "title": "Production backends",
              "n": "05",
              "learn": "Postgres uses the same Store and checkpointer calls as the in-memory versions.",
              "notes": [
                "`PostgresStore` has the same put and search API as `InMemoryStore`. It survives a process restart.",
                "`PostgresSaver` is the same `compile(checkpointer=...)` as `MemorySaver`, shared across processes for one `thread_id`.",
                "The order-support shapes do not change. The backend does."
              ],
              "file": "05.production_backends.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "snippet": "PostgresStore.from_conn_string(POSTGRES_URI)\nPostgresSaver.from_conn_string(POSTGRES_URI)",
              "sample": "restart the process\ncontact preference and thread ord-1 are still there"
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/06.semantic_memory.py",
              "kind": "lesson",
              "title": "Semantic memory",
              "n": "06",
              "learn": "A fact about the customer, found by the meaning of the question, not by the key name.",
              "notes": [
                "Semantic memory is a fact. \"Contact by email. Do not call.\" The chat that produced it is not the memory.",
                "The Store item is the fact. `search(query=...)` ranks items with an embedding. The question does not have to match the key `contact`.",
                "This is not RAG. RAG searches policy documents. This searches facts you saved about the customer."
              ],
              "file": "06.semantic_memory.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "snippet": "store.search(namespace, query=\"Do we call this customer or email them?\", limit=1)",
              "sample": "Stored: Contact by email. Do not call.\nHit: Contact by email. Do not call.",
              "evolution": {
                "title": "How a preference became a fact",
                "subtitle": "From entity memory to a Store search",
                "eras": [
                  {
                    "era": "Era 1",
                    "years": "2022",
                    "name": "ConversationEntityMemory",
                    "what": "LangChain extracted people and preferences into a dict and stuffed that dict back into the prompt.",
                    "flaw": "The dict lived in the process. A new thread did not have it unless you passed it yourself.",
                    "shift": "Put the fact somewhere that outlives the thread."
                  },
                  {
                    "era": "Era 2",
                    "years": "2023",
                    "name": "A row in your own database",
                    "what": "Teams saved \"email, not phone\" and injected it by hand on the next ticket.",
                    "flaw": "You had to know the key. A question phrased another way missed the row.",
                    "shift": "Search the fact by meaning."
                  },
                  {
                    "era": "Era 3",
                    "years": "2024 – now",
                    "name": "Store search",
                    "what": "LangGraph Store holds the fact. search(query=...) returns the closest one.",
                    "standard": "A fact is semantic memory. A past case is episodic. A rule for next time is procedural."
                  }
                ],
                "takeaway": "Semantic memory is the fact. It is not the transcript and not the policy document."
              }
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/07.episodic_memory.py",
              "kind": "lesson",
              "title": "Episodic memory",
              "n": "07",
              "learn": "One past case: what the situation was, what you did, and how it ended.",
              "notes": [
                "An episode is a case. Ticket TKT-42: late ORD-1, refunded, customer satisfied.",
                "Semantic memory would only say \"this customer likes email.\" The episode says what worked last time a shipment was late.",
                "Store one short case. Search with the new ticket. Do not replay the old transcript."
              ],
              "file": "07.episodic_memory.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "snippet": "store.search(namespace, query=\"Package is late. What did we do last time?\", limit=1)",
              "sample": "Hit: tkt-42 — Late shipment of ORD-1. Action: refunded. Outcome: customer satisfied.",
              "evolution": {
                "title": "How a past case stayed findable",
                "subtitle": "From the chat log to one episode",
                "eras": [
                  {
                    "era": "Era 1",
                    "years": "2022",
                    "name": "The log was the memory",
                    "what": "Whatever happened lived only in the message list.",
                    "flaw": "Trim and a new thread delete the case. You cannot ask \"what did we do last time?\"",
                    "shift": "Write the case down as its own record."
                  },
                  {
                    "era": "Era 2",
                    "years": "2023",
                    "name": "A sentence pasted into the prompt",
                    "what": "Someone copied \"last time we refunded a late order\" into the system text.",
                    "flaw": "One sentence, chosen by a person, for one ticket. The next similar ticket did not find it.",
                    "shift": "Save every case and search."
                  },
                  {
                    "era": "Era 3",
                    "years": "2024 – now",
                    "name": "An episode in the Store",
                    "what": "Each item is situation, action, and outcome. search() returns the closest past case.",
                    "standard": "Keep the case. Drop the transcript."
                  }
                ],
                "takeaway": "Episodic memory answers what happened. Semantic memory answers what is true."
              }
            },
            {
              "id": "lesson:day 2/05. Agent Memory & Context Engineering/08.procedural_memory.py",
              "kind": "lesson",
              "title": "Procedural memory",
              "n": "08",
              "learn": "A rule for the next run. The system prompt changes because the instruction changed.",
              "notes": [
                "Procedural memory is an instruction. \"When a shipment is late, offer the refund before asking them to wait.\"",
                "That is not a customer fact and not a past ticket. It is how the agent should behave next time.",
                "Save the rule in the Store. The next thread reads it into the system prompt. The chat does not have to be longer for the behavior to change."
              ],
              "file": "08.procedural_memory.py",
              "day": 2,
              "module": "05. Agent Memory & Context Engineering",
              "snippet": "system_prompt = f\"You handle order support.\\nStanding rule: {rule}\"",
              "sample": "Before: Greet the customer, then look up the order.\nAfter: When a shipment is late, offer the refund before asking them to wait.",
              "evolution": {
                "title": "How a better reply became a standing rule",
                "subtitle": "From editing the file to loading the instruction",
                "eras": [
                  {
                    "era": "Era 1",
                    "years": "2022",
                    "name": "The system string in the file",
                    "what": "Behavior changed when someone edited the prompt in source.",
                    "flaw": "A bad late-order reply did not update the next ticket until a person shipped a new string.",
                    "shift": "Store the current rule outside the file."
                  },
                  {
                    "era": "Era 2",
                    "years": "2023",
                    "name": "A prompt registry",
                    "what": "Teams versioned prompts and pasted the winner back into the agent.",
                    "flaw": "The agent still started from whatever string was deployed. It did not load a rule learned from the last case.",
                    "shift": "Read the instruction at the start of the thread."
                  },
                  {
                    "era": "Era 3",
                    "years": "2024 – now",
                    "name": "A procedure in the Store",
                    "what": "put() replaces the rule. The next system prompt is built from that value.",
                    "standard": "Semantic is a fact. Episodic is a case. Procedural is the rule you follow next."
                  }
                ],
                "takeaway": "Procedural memory changes the instruction. It does not add another message to the thread."
              }
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
              "learn": "ORDERS can answer a status. It cannot answer a policy question.",
              "file": "01.why_rag.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "notes": [
                "A model does not have your private policy, and a policy change should not mean another training run.",
                "Stuffing the whole policy into the prompt hits the context window.",
                "RAG retrieves the relevant passages at question time and the answer can name the file.",
                "\"What is the refund window?\" is a document question. \"Status of ORD-1\" stays a tool."
              ],
              "snippet": "question → embed → search → top chunks → prompt → answer",
              "sample": "ORD-1: shipped (tool)\nrefund window: 30 days (policy doc)"
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/02.rag_pipeline_index.py",
              "kind": "lesson",
              "title": "Rag pipeline index",
              "n": "02",
              "learn": "Indexing is once per document change: load, chunk, embed, store.",
              "notes": [
                "A document is `page_content` plus metadata, so a later answer can cite the file.",
                "The splitter breaks on paragraphs and sentences. The same embedding model must be used for the chunks and for the question.",
                "This file stops at a searchable store. It does not answer yet."
              ],
              "file": "02.rag_pipeline_index.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "snippet": "load → chunk → embed → InMemoryVectorStore",
              "sample": "policy files indexed\nready for a question"
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/03.rag_pipeline_query.py",
              "kind": "lesson",
              "title": "Rag pipeline query",
              "n": "03",
              "learn": "Query time embeds the question with the same model and returns the closest chunks.",
              "notes": [
                "`similarity_search` is the store's own method. `as_retriever()` is the runnable: question in, documents out.",
                "A chain can call the retriever without importing the store type.",
                "Retrieved chunks are not the customer-facing answer. Grounding is the next file."
              ],
              "file": "03.rag_pipeline_query.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "snippet": "retriever = store.as_retriever()\ndocs = retriever.invoke(question)",
              "sample": "refund question → refund policy chunk"
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/04.grounded_answers.py",
              "kind": "lesson",
              "title": "Grounded answers",
              "n": "04",
              "learn": "The model answers only from the retrieved policy text.",
              "notes": [
                "The path is retriever, then context, then prompt, then model.",
                "Retrieval alone is not a reply the customer can read.",
                "An answer with no source list is hard to trust. Citations are next."
              ],
              "file": "04.grounded_answers.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "snippet": "retriever → context → prompt → model",
              "sample": "The refund window is 30 days."
            },
            {
              "id": "lesson:day 2/06. RAG Fundamentals/05.citations.py",
              "kind": "lesson",
              "title": "Citations",
              "n": "05",
              "learn": "Return the answer and the file names the chunks came from.",
              "notes": [
                "Each chunk already has metadata from indexing. The reply lists those sources.",
                "A grounded sentence without a file name is hard to audit on an ORD ticket.",
                "The fundamentals stop here. The next module wires the full app."
              ],
              "file": "05.citations.py",
              "day": 2,
              "module": "06. RAG Fundamentals",
              "snippet": "answer + [doc.metadata[\"source\"] for doc in docs]",
              "sample": "30 days\nsource: refund-policy.md"
            }
          ]
        },
        {
          "id": "module:day 2/07. Building RAG Applications",
          "title": "07. Building RAG Applications",
          "items": [
            {
              "id": "lesson:day 2/07. Building RAG Applications/01.production_rag_setup.py",
              "kind": "lesson",
              "title": "Production rag setup",
              "n": "01",
              "learn": "One script: folder, documents, chunks that keep their source, retriever.",
              "notes": [
                "Ingest the directory into documents with metadata.",
                "Chunk without dropping the source. Index. Build the retriever.",
                "The earlier files were the steps. This file is those steps in one setup."
              ],
              "file": "01.production_rag_setup.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "snippet": "folder → documents → chunks → retriever",
              "sample": "Acme policy folder indexed"
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/02.prompt_composition.py",
              "kind": "lesson",
              "title": "Prompt composition",
              "n": "02",
              "learn": "Retrieved chunks become the {context} string the prompt fills.",
              "notes": [
                "Question, retriever, join the chunks, `ChatPromptTemplate` fills `{context}` and `{question}`, model answers.",
                "That is the grounded-answer path as app wiring.",
                "An empty retrieval still reaches the model unless the next file stops it."
              ],
              "file": "02.prompt_composition.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "snippet": "context = \"\\n\\n\".join(doc.page_content for doc in docs)",
              "sample": "prompt sees the refund chunk, then the question"
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/03.no_result_handling.py",
              "kind": "lesson",
              "title": "No result handling",
              "n": "03",
              "learn": "If retrieval is not useful, do not invent a policy fact.",
              "notes": [
                "Prompt composition still calls the model when the context is empty.",
                "A known policy question gets an answer. An off-topic question gets the fallback.",
                "A good hit should also show its source. That is the next file."
              ],
              "file": "03.no_result_handling.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "snippet": "if not docs:\n    return \"I don't have a policy for that.\"",
              "sample": "refund window → answered\noff-topic → fallback"
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/04.source_attribution.py",
              "kind": "lesson",
              "title": "Source attribution",
              "n": "04",
              "learn": "The reply includes the policy file names that backed it.",
              "notes": [
                "Support has to show which document the sentence came from.",
                "Pair the answer with the source list from the retrieved chunks.",
                "The chain and the graph that package this come next."
              ],
              "file": "04.source_attribution.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "snippet": "return {\"answer\": answer, \"sources\": sources}",
              "sample": "shipping answer\nsources: shipping-policy.md"
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/05.rag_langchain.py",
              "kind": "lesson",
              "title": "Rag langchain",
              "n": "05",
              "learn": "One LCEL chain: retriever, prompt, model.",
              "notes": [
                "The pieces from the earlier files become one object you can call with a question.",
                "The path is fixed. It always retrieves, then generates.",
                "A branch or a tool choice needs a graph or an agent."
              ],
              "file": "05.rag_langchain.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "snippet": "chain = retriever | prompt | model",
              "sample": "What is the refund window? → 30 days"
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/06.rag_langgraph.py",
              "kind": "lesson",
              "title": "Rag langgraph",
              "n": "06",
              "learn": "Retrieve and generate are nodes. You can see each step.",
              "notes": [
                "LCEL is a straight chain. A graph makes the steps inspectable.",
                "Same Acme policy corpus. Same idea as Day 1 nodes and edges.",
                "This graph always retrieves. An agent should choose when to search."
              ],
              "file": "06.rag_langgraph.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "snippet": "graph.add_edge(\"retrieve\", \"generate\")",
              "sample": "retrieve → generate → answer"
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/07.rag_as_agent_tool.py",
              "kind": "lesson",
              "title": "Rag as agent tool",
              "n": "07",
              "learn": "Policy search is a tool. The agent decides when to call it.",
              "notes": [
                "`lookup_order` answers ORD-1. `search_policies` answers the refund window.",
                "Always-on retrieve cannot mix those. The agent picks the tool.",
                "Status stays structured. Policy stays retrieval."
              ],
              "file": "07.rag_as_agent_tool.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "snippet": "create_agent(model, tools=[lookup_order, search_policies])",
              "sample": "status of ORD-1 → lookup_order\nrefund window → search_policies"
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/08.complete_rag_agent.py",
              "kind": "lesson",
              "title": "Complete rag agent",
              "n": "08",
              "learn": "One agent: ORDERS tool, policy tool, Store, and context middleware.",
              "notes": [
                "Day 1 is the structured lookup. Day 2 adds middleware, memory, and policy search.",
                "Those pieces were separate files. This is the first time the course wires them together.",
                "A status question hits ORDERS. A policy question hits the retriever. A preference stays in the Store."
              ],
              "file": "08.complete_rag_agent.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "snippet": "create_agent(model, tools=[lookup_order, search_policies], store=store, middleware=[...])",
              "sample": "ORD-1 shipped\nrefund window from policy\nemail preference recalled"
            },
            {
              "id": "lesson:day 2/07. Building RAG Applications/09.rag_evaluation.py",
              "kind": "lesson",
              "title": "Rag evaluation",
              "n": "09",
              "learn": "Check two things: did the right chunk come back, and is the answer grounded.",
              "notes": [
                "Retrieval: did the right source file come back?",
                "Answer: a judge model scores whether the reply stays on the retrieved text. Treat the score as a flag, not a proof.",
                "Run it when you change chunk size, overlap, or the embedding model, before a customer sees the change."
              ],
              "file": "09.rag_evaluation.py",
              "day": 2,
              "module": "07. Building RAG Applications",
              "snippet": "right_source = expected in retrieved_sources\njudge scores grounding",
              "sample": "refund question retrieved refund-policy.md\nanswer flagged as grounded"
            }
          ]
        }
      ]
    }
  ]
}
