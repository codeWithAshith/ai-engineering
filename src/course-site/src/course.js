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
              "learn": "Every LangGraph app is a graph: START → middle → END. Same ORD-3 cancelled ticket three ways — only the graph can route.",
              "file": "01.why_langgraph.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "**Always START and END.** The elementary graph is one node P: send a prompt to an LLM, then stop. The middle can grow — more nodes, branches, loops — and it is still START … END.",
                "**Approach 1 · LLM.** One invoke. Escalation lives in the system prompt. The model might escalate ORD-3. It might not. You have no path to force.",
                "**Approach 2 · Chain.** You look up ORD-3 yourself, then `prompt | model | parser`. Linear A → B → C. No escalate desk vs normal desk.",
                "**Approach 3 · LangGraph.** `normalize` writes status onto shared state. `route()` reads it: cancelled → `escalate`, else → `normal`. The file runs ORD-1 and ORD-3 on the same graph.",
                "**Why a graph.** A real workflow is a series of decisions, memory updates, and tool calls. LangChain gives you the models, memory, and tools. It does not give you a clear way to organize them when there are many steps and conditions. LangGraph does that with a graph: a finite state machine. Think of it as a roadmap with directions and traffic rules.",
                "**Built on LangChain.** Models, memory, and tools you already use drop into nodes. The difference is how you organize them: branching, retries, loops, parallel decisions, and multi-agent handoffs stay visible in the graph.",
                "**Node.** One step. A function: call a model, run a tool, or process data. In the delivery analogy, Ravi picks up letters at the post office, or checks which house is next. One clear action.",
                "**Edge.** The path between nodes. It says what happens next from the result of the last step. If house 1 is locked, the map sends Ravi to the next house. In the graph, that is a conditional edge.",
                "**State.** The bag Ravi carries. Order id, status, notes from people he meets, the draft of the final report. The state schema is the input shape for every node and edge. It persists and evolves as the graph runs.",
                "**What the graph gives you.** Loops and branches live in the graph, so you are not burying the flow in nested if/else. Pause and resume from a checkpoint, exactly where you left off. Insert a human checkpoint so someone can review or edit state before the next node. Stream tokens and intermediate results as nodes run. LangChain components and LCEL still work inside those nodes.",
                "**In production.** Teams use this when the workflow has to stay correct under branching, retries, and oversight, and still be readable."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": [
                    "Approach",
                    "Path",
                    "ORD-3 cancelled"
                  ],
                  "rows": [
                    [
                      "LLM",
                      "one invoke",
                      "Might escalate. No control."
                    ],
                    [
                      "Chain",
                      "lookup (you) then prompt | model | parser",
                      "Cannot pick a desk from status."
                    ],
                    [
                      "LangGraph",
                      "START → normalize → escalate | normal → END",
                      "route() sends it to escalate."
                    ]
                  ]
                }
              ],
              "snippet": "graph.add_edge(START, \"normalize\")\ngraph.add_conditional_edges(\"normalize\", route)\ngraph.add_edge(\"escalate\", END)\ngraph.add_edge(\"normal\", END)",
              "sample": "ORD-1: Order ORD-1 status: shipped.\nORD-3: Order ORD-3 is cancelled — escalating to specialist team.\nLLM  → no control\nChain → cannot route\nGraph → cancelled→escalate, shipped→normal",
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
                "**Concept:** a **node** is `function(state) →` a partial update. A **fixed edge** always goes A → B (`add_edge`). `START` / `END` are entry and exit.",
                "**Limitation:** without a graph you only have a script. Here the ticket is real shared state that nodes update step by step.",
                "**Example:** linear path normalize → enrich for ORD-1. Still limited: every ticket takes the same path — no VIP vs standard desk.",
                "Press Play on the graph. Return only the fields you change."
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
              "learn": "A route function reads the ticket and returns the next node name. Use it when the field is already on the ticket.",
              "file": "03.conditional_edges.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "**Concept:** `add_conditional_edges(source, route_fn)` — `route_fn(state)` returns the next node name. Branching lives in that edge function.",
                "**Use when:** simple branch on known fields. Priority is already on the ticket. Logic lives in `route()`. State is only read.",
                "**Limitation:** the decision disappears after the transition — harder to audit, and later nodes cannot see why this path was taken. That is a routing node — next lesson.",
                "**Example:** priority high → vip, else → standard (ORD-1 / ORD-2). Press Play, then switch **else**."
              ],
              "snippet": "def route(state: TicketState) -> str:\n    return \"vip\" if state[\"priority\"] == \"high\" else \"standard\"\n\ngraph.add_conditional_edges(\"classify\", route)",
              "sample": "high: {'order_id': 'ORD-1', 'priority': 'high', 'desk': 'VIP desk: ORD-1 → shipped'}\nnormal: {'order_id': 'ORD-2', 'priority': 'normal', 'desk': 'Standard desk: ORD-2 → pending'}",
              "demo": "graph",
              "graph": "conditional"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/04.routing_nodes.py",
              "kind": "lesson",
              "title": "Routing nodes",
              "n": "04",
              "learn": "A routing node writes the decision into state. The edge stays thin. Use it when you need the choice in history and in later nodes.",
              "file": "04.routing_nodes.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "**Where logic lives.** Pattern 1: inside `route()` on the edge. Pattern 2: inside a worker node (`classify`). The edge only reads.",
                "**State footprint.** A pure conditional edge only reads. A routing node updates state — it saves `intent`.",
                "**Audit and reuse.** After a pure edge, the decision disappears. You cannot log it, and later nodes cannot see why this path was taken. After `classify`, `intent` stays in history. Downstream nodes can read `state[\"intent\"]`.",
                "**Edge complexity.** Pure edge is thick — business or LLM classification lives there. Routing node is thin: `return state[\"intent\"]`."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": [
                    "Metric",
                    "Pure conditional edge",
                    "Routing node + thin edge"
                  ],
                  "rows": [
                    [
                      "Where logic lives",
                      "Inside the edge function (route)",
                      "Inside a worker node (classify)"
                    ],
                    [
                      "State footprint",
                      "No change. State is only read, not updated.",
                      "State is updated. Saves the decision (intent) to state."
                    ],
                    [
                      "Auditability & logging",
                      "Harder. The decision disappears once the transition occurs.",
                      "Easy. The routing choice remains in the state history."
                    ],
                    [
                      "Downstream reuse",
                      "Low. Later nodes cannot see why this path was taken.",
                      "High. Downstream nodes can read state[\"intent\"] to alter their behavior."
                    ],
                    [
                      "Edge complexity",
                      "Thick. Contains the core business or LLM classification logic.",
                      "Thin. Simply reads a pre-computed value (return state[\"intent\"])."
                    ]
                  ]
                }
              ],
              "snippet": "def classify(state):\n    return {\"intent\": intent}  # routing NODE\n\ndef pick(state):\n    return state[\"intent\"]  # thin EDGE\n\ngraph.add_conditional_edges(\"classify\", pick)",
              "sample": "Q: Status of ORD-1?\n  intent=order → Order desk: ORD-1 → shipped\nQ: Is the Mouse in stock?\n  intent=product → Product desk: check catalog stock.\nQ: Hello!\n  intent=other → Happy to help with orders or products.",
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
                "**Concept:** nodes return a partial dict. A reducer decides how each field merges: `new = reducer(old, update)`. A plain field last-write-wins (`new = update`). `Annotated[int, add]` sums. `Annotated[list, add]` concatenates. `Annotated[list, add_messages]` appends chat messages (not raw list +).",
                "**Limitation:** without Annotated, enrich's `events=['enriched']` replaces normalize's `events=['normalized']`, and `touch_count: 1` then `touch_count: 1` stays 1. The audit trail is lost.",
                "**Example:** same path as lesson 02 — START → normalize → enrich → END for ` ord-1 `. Press Play on **with reducers**, then **plain overwrite**. Still scripted — even a tool_call would not run. That desk is ToolNode."
              ],
              "snippet": "touch_count: Annotated[int, add]\nevents: Annotated[list[str], add]\nmessages: Annotated[list, add_messages]",
              "sample": "order_id (overwrite): ORD-1\nstatus / note:        shipped | ORD-1 is currently shipped\ntouch_count (sum):    2\nevents (concat):      ['normalized', 'enriched']\nmessages:             Need help with ORD-1 | ORD-1 is currently shipped",
              "demo": "graph",
              "graph": "reducers"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/06.tool_node.py",
              "kind": "lesson",
              "title": "ToolNode",
              "n": "06",
              "learn": "ToolNode is the executor you wrote by hand. The graph decides when it runs. The agent loop is next — the model decides if, when, and which tools.",
              "file": "06.tool_node.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "**What it is.** In Tool Calling, `bind_tools` returned a call and you ran `lookup_order.invoke` plus a `ToolMessage`. `ToolNode(tools)` is that desk as a graph node: `add_node(\"tools\", ToolNode(tools))`. `create_agent` uses this node — not a different idea.",
                "**Control flow.** This pattern is deterministic: START → chatbot → tools → END. The graph dictates when the tool runs. An agent loop is dynamic — the LLM decides if, when, and which tools to call.",
                "**LLM responsibility.** Here the model only writes arguments. The graph executes. In the loop the model must reason, inspect outputs, and decide to stop.",
                "**State and use.** Linear: one pass, sequential updates. Best for structured workflows. Cyclic message history and open-ended research wait for the next lesson.",
                "**ToolNode vs tools_condition.** `ToolNode` is a node: it runs `tool_calls` and appends a `ToolMessage`. `tools_condition` is an edge: tool calls present means go to `tools`, none means `END`. It does not run Python. This lesson wires only `ToolNode` plus fixed edges: chatbot → tools → END. The graph always runs the tool, then stops, so there is no condition to check."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": [
                    "Metric",
                    "Tool node pattern",
                    "Agent loop pattern"
                  ],
                  "rows": [
                    [
                      "Control flow",
                      "Deterministic. The graph dictates when a tool runs based on pre-defined edges.",
                      "Dynamic. The LLM decides if, when, and which tools to call sequentially."
                    ],
                    [
                      "LLM responsibility",
                      "Low. The LLM only generates the arguments; the graph executes it.",
                      "High. The LLM must reason, call tools, inspect outputs, and decide to stop."
                    ],
                    [
                      "State mutation",
                      "Linear. Updates state attributes sequentially.",
                      "Cyclic. Appends new tool logs to a message history array iteratively."
                    ],
                    [
                      "Best used for",
                      "Structured, predictable workflows (extract text, then query the database).",
                      "Open-ended problem solving (research this topic, then summarize)."
                    ]
                  ]
                }
              ],
              "snippet": "graph.add_node(\"tools\", ToolNode(tools))\ngraph.add_edge(\"chatbot\", \"tools\")\ngraph.add_edge(\"tools\", END)",
              "sample": "AIMessage: tool_calls=lookup_order(ORD-1)\nToolMessage: shipped",
              "demo": "graph",
              "graph": "toolnode"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/07.agent_loops.py",
              "kind": "lesson",
              "title": "Agent loops",
              "n": "07",
              "learn": "tools_condition sits on chatbot: if there are tool_calls, go to tools; if not, go to END.",
              "file": "07.agent_loops.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "**tools_condition on chatbot.** After chatbot writes a message, this function reads that message. Tool calls means go to `tools`. No tool calls means go to `END`. It does not judge whether the question was answered. The model stops by writing a reply with no tool calls.",
                "**END is not in the file.** You never `add_node(\"END\")`. `START` and `END` already exist. `add_conditional_edges(\"chatbot\", tools_condition)` is the exit. The only edge you add back is `tools → chatbot`, so the picture looks like a loop. It ends on the chatbot visit that does not request a tool.",
                "**The missing edge.** Lesson 06 always did chatbot → tools → END. Here the graph is `chatbot ↔ tools`. The ↑ result sends the ToolMessage back. Chatbot sees `shipped`, writes the reply with no calls, `tools_condition` sends you to END.",
                "**create_agent is this graph.** Same two desks. You add the nodes. The shortcut compiles `chatbot` ↔ `ToolNode` with `tools_condition` as the stop.",
                "**One example.** Status of ORD-1? Chatbot asks for the lookup, tools return `shipped`, chatbot answers in text, then `END`. If that second visit asks for another tool, the same check sends it back to `tools` instead of stopping on an unrun call.",
                "**Both pieces.** `ToolNode` executes. `tools_condition` decides. Wire `ToolNode`, put `tools_condition` on the way out of chatbot, and add `tools → chatbot`. No tools at all means neither."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": [
                    "After chatbot",
                    "tools_condition sends you"
                  ],
                  "rows": [
                    [
                      "Last message has tool_calls",
                      "tools"
                    ],
                    [
                      "Last message has no tool_calls",
                      "END"
                    ]
                  ]
                },
                {
                  "type": "table",
                  "headers": [
                    "Situation",
                    "What you wire"
                  ],
                  "rows": [
                    [
                      "The graph always runs a tool, then stops (lesson 06)",
                      "ToolNode plus fixed edges: chatbot → tools → END"
                    ],
                    [
                      "The model may call a tool, may call again, and must be the one that stops (this lesson)",
                      "ToolNode plus tools_condition on the way out of chatbot, and tools → chatbot"
                    ],
                    [
                      "No tools at all",
                      "Neither"
                    ]
                  ]
                }
              ],
              "snippet": "graph.add_conditional_edges(\"chatbot\", tools_condition)\ngraph.add_edge(\"tools\", \"chatbot\")",
              "sample": "AIMessage: tool_calls=lookup_order(ORD-1)\nToolMessage: shipped\nAIMessage: The status of ORD-1 is shipped.",
              "demo": "graph",
              "graph": "loop",
              "evolution": {
                "title": "How agent loops got a graph",
                "subtitle": "From while True to tools_condition you can inspect",
                "eras": [
                  {
                    "era": "Era 1",
                    "years": "2022",
                    "name": "Manual while True",
                    "what": "You wrote while True, checked tool_calls yourself, and called the tool. The loop lived in your script.",
                    "flaw": "Error-prone, and you could not see or pause a step once it started.",
                    "shift": "A ready-made executor hid the loop."
                  },
                  {
                    "era": "Era 2",
                    "years": "2023 Q1",
                    "name": "AgentExecutor was a black box",
                    "what": "LangChain AgentExecutor ran the loop for you. You got a final answer.",
                    "flaw": "You could not inspect, pause, or control the loop mid-run.",
                    "shift": "Route on a graph you can see."
                  },
                  {
                    "era": "Era 3",
                    "years": "2023 Q3 – now",
                    "name": "tools_condition",
                    "what": "LangGraph routes chatbot → tools or END. The cycle is nodes and edges. create_agent compiles this same graph.",
                    "standard": "The loop is a graph you can inspect: chatbot ↔ ToolNode."
                  }
                ],
                "takeaway": "An agent loop is a graph you can see — not a hidden while True."
              }
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/08.parallel_edges.py",
              "kind": "lesson",
              "title": "Parallel fixed edges",
              "n": "08",
              "learn": "Merge waits. The fast branch does not start merge early. The slow one does not get skipped.",
              "notes": [
                "**Join.** Both `normalize` and `check_tier` leave START at the same time, and both have an edge into `merge`. LangGraph treats that as a join: `merge` runs **once**, after **both** have finished.",
                "**If one is faster.** The fast branch does not start `merge` early. The slow one does not get skipped. `merge` still waits.",
                "**Branches are blind.** They do not see each other's writes until merge. `check_tier` still uses the raw `order_id`. `notes` accumulate with `Annotated[list, add]`."
              ],
              "file": "08.parallel_edges.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "snippet": "graph.add_edge(START, \"normalize\")\ngraph.add_edge(START, \"check_tier\")\ngraph.add_edge(\"normalize\", \"merge\")\ngraph.add_edge(\"check_tier\", \"merge\")\ngraph.add_edge(\"merge\", END)",
              "sample": "🌟 VIP | Order ORD-1 → shipped\nnotes: ['Normalized:  ord-1  → ORD-1', 'Customer tier: VIP', 'Merged parallel results']",
              "demo": "graph",
              "graph": "parallel"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/09.streaming.py",
              "kind": "lesson",
              "title": "Streaming",
              "n": "09",
              "learn": "Same question, four watches. No tools. Only stream_mode (or invoke) changes.",
              "notes": [
                "**Same question, four times.** `Write one sentence: order ORD-1 has shipped.` Graph is `START → chatbot → END`. No tools. Only the watch changes.",
                "**updates.** One dict from the node that just finished: `{'chatbot': ['AIMessage: Order ORD-1 has shipped.']}`. The human question is not in it, because chatbot did not write that. This fires once, when the node is done. It is not the typing effect.",
                "**values.** The whole ticket after each step, so both sides are there. First the question: `HumanMessage: Write one sentence: order ORD-1 has shipped.` Then that question plus `AIMessage: Order ORD-1 has shipped.` Use this when the screen must redraw the whole chat.",
                "**messages.** The typing effect. Pieces of the AI sentence while the model is still writing: `\"Order\"`, `\" ORD-1\"`, `\" has shipped.\"` Join them and you get the sentence. The question never appears.",
                "**invoke().** Waits until chatbot is done, then prints `Order ORD-1 has shipped.` once. Same words as messages. No pieces along the way."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": ["Mode", "Each event is", "When to use"],
                  "rows": [
                    ["`updates`", "`{node_name: partial update}`", "Debug / progress: which node just wrote what"],
                    ["`values`", "full TicketState after that step", "UI that re-renders the whole ticket each step"],
                    ["`messages`", "`(token_chunk, meta)` from the LLM", "Last AI reply, typing effect"],
                    ["`invoke()`", "one final state (not streaming)", "Same last AI reply, dumped once"]
                  ]
                },
                {
                  "type": "table",
                  "headers": ["Mode", "How to see the difference"],
                  "rows": [
                    ["`updates`", "{'chatbot': ['AIMessage: Order ORD-1 has shipped.']}", "Human question is not here. One shot when the node finishes — not typing."],
                    ["`values`", "Human: Write one sentence…   then also AI: Order ORD-1 has shipped.", "Whole ticket, so a screen can redraw the chat"],
                    ["`messages`", "\"Order\" then \" ORD-1\" then \" has shipped.\"", "Typing. Pieces of the AI sentence only."],
                    ["`invoke()`", "Order ORD-1 has shipped.", "Same sentence as messages, one print after the wait"]
                  ]
                }
              ],
              "file": "09.streaming.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "snippet": "QUESTION = \"Write one sentence: order ORD-1 has shipped.\"\nfor event in app.stream(inputs, stream_mode=\"updates\"):\n    print(event)  # {'chatbot': ['AIMessage: ...']}\nfor state in app.stream(inputs, stream_mode=\"values\"):\n    print(len(state[\"messages\"]))  # 1 then 2\nfor chunk, _meta in app.stream(inputs, stream_mode=\"messages\"):\n    print(getattr(chunk, \"content\", \"\"), end=\"\")\nprint(app.invoke(inputs)[\"messages\"][-1].content)",
              "sample": "Question: Write one sentence: order ORD-1 has shipped.\n1) updates   {'chatbot': ['AIMessage: Order ORD-1 has shipped.']}\n2) values    msgs=1 ['HumanMessage']\n             msgs=2 ['HumanMessage', 'AIMessage']\n3) messages  Order ORD-1 has shipped.  (typing)\n4) invoke()  Order ORD-1 has shipped.  (same reply, no typing)",
              "demo": "graph",
              "graph": "streaming"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/10.thinking_stream.py",
              "kind": "lesson",
              "title": "Thinking stream",
              "n": "10",
              "learn": "Way 1 labels which node ran. Way 2 is a smaller model that only writes a thought.",
              "notes": [
                "**What it is:** same two streams as lesson 09, now together on the agent loop. `stream_mode=['updates', 'messages']` makes each event `(mode, data)`.",
                "**Way 1 — graph steps.** `stream_mode=['updates', 'messages']`. `updates` prints `[step] chatbot` then `[step] tools`. Those are node names, not thoughts. `messages` types the last AI reply.",
                "**Way 2 — a separate small call mimics the thought.** Same `gpt-oss-20b`, no tools, asked for one short thought about the next action. It must not invent `shipped`. The live status still comes from Way 1, where `tools` runs `lookup_order`.",
                "**Limitation.** One mode alone cannot show tool progress and live answer text. Way 2 does not tell you that `tools` ran. Each run starts fresh — no thread memory."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": ["Watch", "Each event is", "What you send the user"],
                  "rows": [
                    ["`updates`", "`{node_name: partial update}`", "Way 1: `[step] chatbot` then `[step] tools` — node names, not thoughts"],
                    ["`messages`", "`(token_chunk, meta)`", "Way 1: last AI reply, token by token"],
                    ["separate call, no tools", "one thought about the next action", "Way 2: a mimic. It does not look up ORD-1."]
                  ]
                }
              ],
              "file": "10.thinking_stream.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "snippet": "for mode, event in app.stream(ticket, stream_mode=[\"updates\", \"messages\"]):\n    if mode == \"updates\":\n        print(\"[thinking] step=\", next(iter(event)))\n    elif mode == \"messages\":\n        print(getattr(event[0], \"content\", \"\"), end=\"\")\n\nthink = init_chat_model(model=\"groq:openai/gpt-oss-20b\", reasoning_format=\"parsed\")\nfor chunk in think.stream([HumanMessage(content=\"One sentence: order ORD-1 has shipped.\")]):\n    scratch = chunk.additional_kwargs.get(\"reasoning_content\") or \"\"\n    if scratch:\n        print(scratch, end=\"\")\n    if chunk.content:\n        print(chunk.content, end=\"\")",
              "sample": "WAY 1\n[step] chatbot\n[step] tools\nThe status of ORD-1 is shipped\n\nWAY 2  separate call, no tools\n[thinking] I should look up ORD-1 before answering.",
              "demo": "graph",
              "graph": "thinking"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/11.persistence.py",
              "kind": "lesson",
              "title": "Persistence",
              "n": "11",
              "learn": "The second turn still knows ORD-1, because the same thread_id reads the last checkpoint.",
              "notes": [
                "**What persists.** Turn one says the order id is ORD-1. Turn two asks which id, on the same `thread_id`, and the reply can use it. A new `thread_id` cannot.",
                "**Saver vs checkpoint.** `InMemorySaver` is the box on `compile(checkpointer=...)`. A checkpoint is one snapshot of that chat after a step. `get_state` reads the latest snapshot.",
                "**Later.** A file that is still there after the process stops is the next lesson. A fact that survives a new thread is the Day 2 store."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": ["Key on config", "What it is", "When you set it"],
                  "rows": [
                    ["`configurable.thread_id`", "which conversation", "Every invoke with a checkpointer. Latest snapshot if you omit checkpoint_id."],
                    ["`configurable.checkpoint_id`", "which frame of that conversation", "Optional: inspect history, time travel, human fix, debug."]
                  ]
                },
                {
                  "type": "table",
                  "headers": ["When you need checkpoint_id", "Why"],
                  "rows": [
                    ["Inspect history", "`get_state` / `get_state_history` — ticket at step N"],
                    ["Time travel / replay", "Re-run from an older snapshot, not only latest"],
                    ["Human fix + resume", "Jump to a bad step, `update_state`, continue"],
                    ["Debug", "Reproduce state when a tool / node failed"]
                  ]
                }
              ],
              "snippet": "thread = {\"configurable\": {\"thread_id\": \"support-1\"}}\napp.invoke(turn1, config=thread)\napp.invoke(turn2, config=thread)\nsnap = app.get_state(thread)",
              "sample": "same thread: ORD-1\nnew thread: (does not know ORD-1)\nthread_id support-1\nmessages 4",
              "file": "11.persistence.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "demo": "graph",
              "graph": "persistence",
              "evolution": {
                "title": "How memory landed on the graph",
                "subtitle": "From rebuild-the-prompt to thread_id checkpoints",
                "eras": [
                  {
                    "era": "Era 1",
                    "years": "2022",
                    "name": "No memory between calls",
                    "what": "Each invoke was a new prompt. To remember ORD-1 you rebuilt context from a database.",
                    "flaw": "Expensive and slow. The graph itself forgot the ticket.",
                    "shift": "Store the session yourself."
                  },
                  {
                    "era": "Era 2",
                    "years": "2023 Q1",
                    "name": "Manual session dicts",
                    "what": "Projects kept a dict in Redis or Postgres and stuffed it back into the prompt.",
                    "flaw": "Every team wrote their own save/restore.",
                    "shift": "A checkpointer keyed by thread."
                  },
                  {
                    "era": "Era 3",
                    "years": "2023 Q3",
                    "name": "MemorySaver",
                    "what": "Checkpoints live in RAM, keyed by thread_id. Later invoke() on the same thread sees the ticket.",
                    "flaw": "Process restart wipes the thread.",
                    "shift": "Same API, on disk."
                  },
                  {
                    "era": "Era 4",
                    "years": "2023 Q4 – now",
                    "name": "SqliteSaver, then time travel",
                    "what": "SqliteSaver keeps checkpoints on disk. get_state_history plus checkpoint_id pins one snapshot.",
                    "standard": "thread_id is the conversation. checkpoint_id is a frame, for history, debug, and human fix-and-resume."
                  }
                ],
                "takeaway": "Memory is a checkpointer on the graph, not a session dict you bolt on the side."
              }
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/12.runnable_config.py",
              "kind": "lesson",
              "title": "RunnableConfig extras (recursion_limit, metadata)",
              "n": "12",
              "learn": "Same config dict. No config_id. recursion_limit and metadata ride along this invoke.",
              "file": "12.runnable_config.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "**One dict, every invoke.** `app.invoke(ticket, config=config)`. LangGraph does not invent a config_id. Config does not float onto a thread by itself.",
                "**This file has no checkpointer**, so `thread_id` / `checkpoint_id` are omitted. They live under `configurable` — same bag, previous lesson.",
                "**`recursion_limit`:** top-level. Max graph steps this run (default ~25). This file sets 10. Exceed it → `GraphRecursionError`.",
                "**`metadata`:** top-level. Free-form for THIS run. `chatbot(state, config)` reads `config['metadata']`. The model cannot. Next invoke you pass it again."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": ["Key", "Where", "What it does"],
                  "rows": [
                    ["`configurable.thread_id`", "nested", "Lesson 10. Omitted here — no checkpointer."],
                    ["`recursion_limit`", "top-level", "Max steps this invoke. Exceed → `GraphRecursionError`. This file: 10."],
                    ["`metadata`", "top-level", "This run only. Node can read (desk=vip). Model cannot."]
                  ]
                }
              ],
              "snippet": "config = {\"recursion_limit\": 10, \"metadata\": {\"desk\": \"vip\", \"order_hint\": \"ORD-1\"}}\nresult = app.invoke(ticket, config=config)",
              "sample": "metadata on this run: {'desk': 'vip', 'order_hint': 'ORD-1'} → desk: vip\ndesk stored from metadata: vip",
              "demo": "graph",
              "graph": "config"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/13.durable_checkpointers.py",
              "kind": "lesson",
              "title": "Durable checkpointers",
              "n": "13",
              "learn": "SqliteSaver is the same checkpointer API, on disk, so the thread is still there after the process stops.",
              "file": "13.durable_checkpointers.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "**What it is:** `SqliteSaver` is another checkpointer, not a new graph. Same `compile(checkpointer=...)` as `InMemorySaver`. The snapshots go to a file, so a later run still has the thread.",
                "**Why this lesson.** Persistence already showed the second turn remembering ORD-1. That copy lived in RAM. Here the copy is still there after the process stops.",
                "**Example:** thread `durable-1` stores ORD-2, then a later invoke still replies ORD-2. Still limited: persist is not inspect-and-fix — that is `get_state` / `update_state`."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": ["Saver", "Lives", "Survives process restart"],
                  "rows": [
                    ["`InMemorySaver`", "RAM", "No — previous lesson"],
                    ["`SqliteSaver`", "disk", "Yes — same compile() call"]
                  ]
                }
              ],
              "snippet": "with SqliteSaver.from_conn_string(str(DB)) as checkpointer:\n    app = graph.compile(checkpointer=checkpointer)",
              "sample": "ORD-2",
              "demo": "graph",
              "graph": "durable"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/14.get_state_update_state.py",
              "kind": "lesson",
              "title": "get_state and update_state",
              "n": "14",
              "learn": "A human reads get_state, writes update_state, then invoke(None) resumes from .next.",
              "file": "14.get_state_update_state.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "**Human on the checkpoint.** Persistence cannot fix a wrong order id. Organization: `get_state` → human interprets → `update_state` → `invoke(None)` resumes from `.next`. This is not `interrupt()` yet — that pause is Building Agents.",
                "**Where it runs:** `as_node='__start__'` on `update_state` tells the checkpointer the write came from START, so `.next` is `enrich`. Resume is calculated from that — you do not send the ticket again.",
                "**The graph:** START → enrich → END. Example: ran ORD-1 (shipped); human meant ORD-2; resume → pending.",
                "**Still limited:** lookup is stuck in one flat graph — that is subgraphs.",
                "**Vs interrupt.** Both use a checkpointer and a person. Here the person is outside the graph, after the run, correcting `order_id`. `interrupt()` pauses during the run, inside a tool, and `Command(resume=...)` is an approval, not a field edit. A wrong id found while a refund is paused needs both."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": ["Step", "Who", "What"],
                  "rows": [
                    ["1 `get_state(config)`", "you, then the human", "Read `.values` and `.next`. Wrong id is visible."],
                    ["2 human", "human", "Interpret. Meant ORD-2. No node runs."],
                    ["3 `update_state(..., as_node='__start__')`", "you", "Write the correction. `.next` becomes enrich."],
                    ["4 `invoke(None, config)`", "the graph", "Resume from `.next`. Do not pass the ticket again."]
                  ]
                },
                {
                  "type": "table",
                  "headers": ["", "This lesson", "interrupt() — human in the loop"],
                  "rows": [
                    ["When the person acts", "After the run, because the id was wrong", "During the run, before the refund"],
                    ["What they change", "State (`order_id`)", "The resume value (`True` / `False`)"],
                    ["How it continues", "`invoke(None, config)`", "`Command(resume=...)` on the same thread"],
                    ["Graph shape", "START → enrich → END. Never pauses.", "chatbot ↔ tools, pause inside one tool"]
                  ]
                }
              ],
              "snippet": "print(app.get_state(config).values)\napp.update_state(config, {\"order_id\": \"ORD-2\"}, as_node=\"__start__\")\nprint(app.invoke(None, config=config))",
              "sample": "1) get_state: order_id=ORD-1 status=shipped\n2) after update_state, next=enrich order_id=ORD-2\n3) resume: ORD-2 → pending",
              "demo": "graph",
              "graph": "state"
            },
            {
              "id": "lesson:day 1/03. LangGraph Fundamentals/15.subgraphs.py",
              "kind": "lesson",
              "title": "Subgraphs",
              "n": "15",
              "learn": "A subgraph is a graph used as one node in a parent graph.",
              "file": "15.subgraphs.py",
              "day": 1,
              "module": "03. LangGraph Fundamentals",
              "notes": [
                "**The box is the lesson.** `lookup` is `lookup_sub` — a compiled graph (`START → fetch_status → END`) used as one parent node, not `fetch_status` drawn on the parent.",
                "**Compile once.** `parent.add_node(\"lookup\", lookup_sub)` — reuse that subgraph on other ticket flows."
              ],
              "snippet": "parent.add_node(\"lookup\", lookup_sub)\nparent.add_edge(\"normalize\", \"lookup\")",
              "sample": "ORD-1: {'order_id': 'ORD-1', 'status': 'shipped', 'note': 'ORD-1 is currently shipped'}",
              "demo": "graph",
              "graph": "subgraph"
            }
          ]
        },
        {
          "id": "module:day 1/04. Human pauses",
          "title": "04. Human pauses",
          "items": [
            {
              "id": "lesson:day 1/04. Human pauses/01.when_to_build_agents.py",
              "kind": "lesson",
              "title": "When to build an agent",
              "n": "01",
              "learn": "If you can write the steps on a whiteboard, do not start with an agent.",
              "file": "01.when_to_build_agents.py",
              "day": 1,
              "module": "04. Human pauses",
              "notes": [
                "**No program.** This is a decision. The page is the lesson.",
                "**LLM app.** One prompt, no live data. FAQs and policy. “Can I get a refund for ORD-1?” — the model guesses. It cannot see the order table.",
                "**Workflow.** You already know the steps: invoices, ETL, always normalize → lookup → format. The same question always runs every step. It cannot skip lookup when the customer only says hello.",
                "**Agent.** The model chooses the next tool. Order support — status, list, refund, tracking — the path is not known up front. It may call lookup, the refund policy, both, or neither.",
                "**Whiteboard test.** If you can write the steps, do not start with an agent. An agent that always calls one tool in one order is a workflow with extra ways to fail."
              ],
              "sample": "Refund ORD-1?\nLLM app: guesses — no live data\nworkflow: always lookup, then format\nagent: the model picks lookup, refund, or both",
              "demo": "graph",
              "graph": "when"
            },
            {
              "id": "lesson:day 1/04. Human pauses/06.where_to_pause.py",
              "kind": "lesson",
              "title": "Where a pause can sit",
              "n": "02",
              "learn": "Four boundaries: before the model, after the model, before the tool, after the tool.",
              "file": "06.where_to_pause.py",
              "day": 1,
              "module": "04. Human pauses",
              "notes": [
                "**Before the model.** `interrupt_before=[\"chatbot\"]`. The question is in. The model has not written yet.",
                "**After the model.** `interrupt_after=[\"chatbot\"]`. You can read the message, including a planned tool call. The tool has not run.",
                "**Before the tool.** `interrupt_before=[\"tools\"]`. The route already chose tools. `ToolNode` has not started.",
                "**After the tool.** `interrupt_after=[\"tools\"]`. The tool result is on the ticket. The model has not turned it into a reply.",
                "**Inside the tool.** `interrupt()` in `request_refund` stops mid-tool. That is the next lesson. `END` is still the built-in exit when the model sends no tool call."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": ["Pause", "What you write", "What the person sees"],
                  "rows": [
                    ["Before the model", "interrupt_before chatbot", "The question, no reply yet"],
                    ["After the model", "interrupt_after chatbot", "The planned tool call"],
                    ["Before the tool", "interrupt_before tools", "The call, not executed"],
                    ["After the tool", "interrupt_after tools", "The tool result, no customer reply yet"]
                  ]
                }
              ],
              "snippet": "interrupt_before=[\"chatbot\"]\ninterrupt_after=[\"chatbot\"]\ninterrupt_before=[\"tools\"]\ninterrupt_after=[\"tools\"]",
              "sample": "before model → model → after model → before tool → tool → after tool",
              "demo": "graph",
              "graph": "pauses"
            },
            {
              "id": "lesson:day 1/04. Human pauses/02.human_in_the_loop.py",
              "kind": "lesson",
              "title": "Human in the loop",
              "n": "03",
              "learn": "interrupt() inside a tool pauses the run until a person approves.",
              "notes": [
                "**Steps.** System prompt, message state, three tools. `lookup_order` finishes. `request_refund` calls `interrupt()`. The run stops. The checkpoint for that `thread_id` stays.",
                "**Resume.** The next call is `Command(resume=True)` on the same `thread_id`. You do not send the question again. `interrupt()` returns that True, the tool says approved, chatbot writes the reply.",
                "**The screen.** The first request returns `__interrupt__` with `please_approve` and the order id. The page shows Yes / No. Yes calls your API again with the same thread and `resume=True`. The graph is not sitting in a loop waiting on the browser.",
                "**Only this tool.** Lookup never pauses. Approving every tool, or editing the id while paused, is the next lesson."
              ],
              "file": "02.human_in_the_loop.py",
              "day": 1,
              "module": "04. Human pauses",
              "blocks": [
                {
                  "type": "table",
                  "headers": ["", "get_state / update_state", "This lesson"],
                  "rows": [
                    ["When the person acts", "After the run, because the id was wrong", "During the run, before the refund"],
                    ["What they change", "State (`order_id`)", "The resume value (`True` / `False`)"],
                    ["How it continues", "`invoke(None, config)`", "`Command(resume=...)` on the same thread"],
                    ["Graph shape", "START → enrich → END. Never pauses.", "chatbot ↔ tools, pause inside one tool"]
                  ]
                }
              ],
              "snippet": "approved = interrupt({\"please_approve\": f\"refund {order_id}\", \"order\": order_id})\ndone = app.invoke(Command(resume=True), config=cfg)",
              "sample": "status of ORD-1: shipped (no pause)\nrefund ORD-1: paused, then approved",
              "demo": "graph",
              "graph": "hitl",
              "evolution": {
                "title": "How a human pause entered the graph",
                "subtitle": "From webhooks to interrupt() and Command(resume)",
                "eras": [
                  {
                    "era": "Era 1",
                    "years": "2022",
                    "name": "External approval queues",
                    "what": "A refund waited on a webhook or a message broker outside the agent.",
                    "flaw": "The pause was another system. Resume meant stitching two architectures.",
                    "shift": "Save and restore the run yourself."
                  },
                  {
                    "era": "Era 2",
                    "years": "2023 Q1",
                    "name": "Manual state save/restore",
                    "what": "Each project pickled state, stopped the process, and reloaded it after a person clicked.",
                    "flaw": "Custom pause/resume per codebase.",
                    "shift": "Pause inside the tool."
                  },
                  {
                    "era": "Era 3",
                    "years": "2023 Q3",
                    "name": "interrupt() in a tool",
                    "what": "request_refund calls interrupt(). The graph stops mid-node until Command(resume=...).",
                    "flaw": "Only that tool pauses. Lookup still runs. Boundary review of every tool is the next lesson.",
                    "shift": "Declare the pause on a node."
                  },
                  {
                    "era": "Era 4",
                    "years": "2024 – now",
                    "name": "interrupt_before + Command",
                    "what": "interrupt_before=['tools'] pauses at the node. Command(resume) continues. MemorySaver + thread_id make it resumable.",
                    "standard": "HITL is a graph feature, not a queue in front of the agent."
                  }
                ],
                "takeaway": "A person approves on the same thread. You do not resend the question."
              }
            },
            {
              "id": "lesson:day 1/04. Human pauses/03.approve_before_tools.py",
              "kind": "lesson",
              "title": "Approve before tools",
              "n": "04",
              "learn": "interrupt_before=[\"tools\"] pauses before any tool runs.",
              "notes": [
                "**Concept:** `interrupt_before=[\"tools\"]` pauses at the tools node boundary. No special code inside the tool. Resume with `invoke(None, config)`.",
                "**Limitation:** `interrupt()` inside one tool only covers that tool. A boundary pause reviews any tool call the model chose.",
                "**Example:** Customer: Cancel ORD-1. The agent plans `cancel_order`. The graph pauses. The desk sees the pending call, then approves. Press Play.",
                "Still limited: if the order id is wrong, approving is not enough. Next lesson: edit state, then resume."
              ],
              "file": "03.approve_before_tools.py",
              "day": 1,
              "module": "04. Human pauses",
              "snippet": "app = graph.compile(checkpointer=MemorySaver(), interrupt_before=[\"tools\"])\ndone = app.invoke(None, config=cfg)",
              "sample": "pending: cancel_order(ORD-1)\napproved → tool runs",
              "demo": "graph",
              "graph": "approve"
            },
            {
              "id": "lesson:day 1/04. Human pauses/04.hitl_fix_resume.py",
              "kind": "lesson",
              "title": "Fix and resume",
              "n": "05",
              "learn": "While paused, update_state can fix the order id. Then you resume.",
              "notes": [
                "**Concept:** `update_state(config, values)` while paused writes a correction on the checkpoint. Then `invoke(None, config)` continues.",
                "**Limitation:** approve or reject cannot correct a wrong id. The customer said refund ORD-1 but meant ORD-2.",
                "**Example:** the desk sees the pending tool call, rewrites the args to ORD-2, then resumes. Press Play.",
                "You are editing the pending call, not starting a new question."
              ],
              "file": "04.hitl_fix_resume.py",
              "day": 1,
              "module": "04. Human pauses",
              "snippet": "app.update_state(config, {\"messages\": [fixed]})\napp.invoke(None, config)",
              "sample": "paused — planned refund ORD-1\nedited to ORD-2\nresume → refund filed for ORD-2",
              "demo": "graph",
              "graph": "fix"
            },
            {
              "id": "lesson:day 1/04. Human pauses/05.agent_handoff.py",
              "kind": "lesson",
              "title": "Agent handoff",
              "n": "06",
              "learn": "A coordinator routes the ticket to a specialist agent.",
              "notes": [
                "**Concept:** a coordinator classifies intent, then routes to refund / tracking / general. Each specialist is a compiled subgraph with its own tools and prompt.",
                "**Vs routing nodes:** LangGraph Fundamentals lesson 04 writes `intent` and goes to one function. Here the next step is a whole agent graph.",
                "**Example:** refund, tracking, or a hello. Press Play on each path. The coordinator does not answer the specialist's question itself.",
                "Use this when different intents need different behavior, tools, or models — not only a different node name."
              ],
              "file": "05.agent_handoff.py",
              "day": 1,
              "module": "04. Human pauses",
              "snippet": "coordinator.add_node(\"refund\", refund_agent)\ncoordinator.add_conditional_edges(\"classify\", route, {\"refund\": \"refund\", \"tracking\": \"tracking\", \"general\": \"general\"})",
              "sample": "refund question → refund agent\ntracking question → tracking agent\nhello → general agent",
              "demo": "graph",
              "graph": "handoff"
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
          "id": "module:day 2/04.1 Middleware",
          "title": "04.1 Middleware",
          "items": [
            {
              "id": "lesson:day 2/04.1 Middleware/01.default_middleware.py",
              "kind": "lesson",
              "title": "Default middleware",
              "n": "01",
              "learn": "Middleware is a wrapper in a list. The agent function stays the same.",
              "notes": [
                "**The list.** You pass middleware on `create_agent`. The agent function does not change.",
                "**A.** `ToolErrorMiddleware` turns a raised error into a tool message. ORD-999 is not in ORDERS. The model reads `ERROR`, it does not crash.",
                "**B.** `ToolCallLimitMiddleware(run_limit=1)` stops a second tool call. Ping twice raises `ToolCallLimitExceededError`.",
                "**C.** `ModelCallLimitMiddleware(run_limit=1)` allows the plan, then blocks the model call after the tool. Status of ORD-1 raises `ModelCallLimitExceededError`. A person approving a write is the next lesson."
              ],
              "blocks": [
                {
                  "type": "table",
                  "headers": ["Wrapper", "ORD example"],
                  "rows": [
                    ["ToolErrorMiddleware", "ORD-999 raises → the model gets an error tool message"],
                    ["ToolCallLimitMiddleware", "run_limit=1, ping twice → ToolCallLimitExceededError"],
                    ["ModelCallLimitMiddleware", "run_limit=1, lookup then reply → ModelCallLimitExceededError"]
                  ]
                }
              ],
              "file": "01.default_middleware.py",
              "day": 2,
              "module": "04.1 Middleware",
              "snippet": "middleware=[\n    ToolErrorMiddleware(on_error=lambda exc, _req: f\"ERROR: {exc}\"),\n    ToolCallLimitMiddleware(run_limit=1, exit_behavior=\"error\"),\n    ModelCallLimitMiddleware(run_limit=1, exit_behavior=\"error\"),\n]",
              "sample": "A) ORD-999 → ERROR tool message, model replies\nB) caught: ToolCallLimitExceededError\nC) caught: ModelCallLimitExceededError",
              "demo": "graph",
              "graph": "mw01"
            },
            {
              "id": "lesson:day 2/04.1 Middleware/02.human_middleware.py",
              "kind": "lesson",
              "title": "A person approves the write",
              "n": "02",
              "learn": "One question: set ORD-1 to delivered. The write waits until a person approves.",
              "notes": [
                "Ask to change the status. `HumanInTheLoopMiddleware` pauses before `update_order_status` runs.",
                "The thread sits in `InMemorySaver` until the resume says approve.",
                "Then the tool runs. Until then, ORD-1 is still shipped."
              ],
              "file": "02.human_middleware.py",
              "day": 2,
              "module": "04.1 Middleware",
              "snippet": "HumanInTheLoopMiddleware(interrupt_on={\"update_order_status\": True})",
              "sample": "paused: true\nafter approve: ORD-1 is delivered",
              "demo": "human-pause",
              "graph": "mw02"
            },
            {
              "id": "lesson:day 2/04.1 Middleware/03.custom_middleware.py",
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
              "module": "04.1 Middleware",
              "snippet": "@wrap_tool_call\ndef audit(request, handler):\n    print(request.tool_call)\n    return handler(request)",
              "sample": "lookup_order ORD-1\nshipped",
              "demo": "graph",
              "graph": "mw03"
            },
            {
              "id": "lesson:day 2/04.1 Middleware/04.agent_context.py",
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
              "module": "04.1 Middleware",
              "snippet": "agent.invoke({\"messages\": [...]}, context={\"role\": \"agent\", \"user_id\": \"u1\"})",
              "sample": "who_am_i: agent u1",
              "demo": "graph",
              "graph": "mw04"
            },
            {
              "id": "lesson:day 2/04.1 Middleware/06.tool_governance.py",
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
              "module": "04.1 Middleware",
              "snippet": "if request.runtime.context.role != \"agent\":\n    return \"ERROR: not allowed\"",
              "sample": "viewer + issue_refund → blocked\nagent + issue_refund → allowed",
              "demo": "graph",
              "graph": "mw06"
            },
            {
              "id": "lesson:day 2/04.1 Middleware/07.dynamic_prompt.py",
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
              "module": "04.1 Middleware",
              "snippet": "@dynamic_prompt\ndef role_prompt(request):\n    return prompt_for(request.runtime.context.role)",
              "sample": "agent: I can check that order.\ncustomer: I can't look up orders.",
              "demo": "graph",
              "graph": "mw07"
            },
            {
              "id": "lesson:day 2/04.1 Middleware/08.dynamic_tools.py",
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
              "module": "04.1 Middleware",
              "snippet": "@wrap_model_call\ndef tools_for_role(request, handler):\n    return handler(request.override(tools=tools_for(request.runtime.context.role)))",
              "sample": "agent: ORD-1 is shipped.\ncustomer: no lookup tool on this call",
              "demo": "graph",
              "graph": "mw08"
            },
            {
              "id": "lesson:day 2/04.1 Middleware/09.dynamic_model.py",
              "kind": "lesson",
              "title": "Dynamic model",
              "n": "09",
              "learn": "The model for this turn is middleware. Context picks it before the model node.",
              "notes": [
                "`@wrap_model_call` can replace `request.model` the same way the tool list is replaced.",
                "A viewer and an agent can share one `create_agent`. The role chooses the model object.",
                "This account uses one Groq model for both branches. The swap is still the wrapper."
              ],
              "file": "09.dynamic_model.py",
              "day": 2,
              "module": "04.1 Middleware",
              "snippet": "return handler(request.override(model=chosen))",
              "sample": "viewer -> openai/gpt-oss-20b\nagent -> openai/gpt-oss-20b",
              "demo": "graph",
              "graph": "mw09"
            },
            {
              "id": "lesson:day 2/04.1 Middleware/10.dynamic_messages.py",
              "kind": "lesson",
              "title": "Dynamic messages",
              "n": "10",
              "learn": "A viewer is sent only the latest message. An agent on the same thread still sees the email.",
              "notes": [
                "`@wrap_model_call` reads `context.role` before the model runs.",
                "A viewer gets `messages[-1:]`. The email was in the invoke, and that role cannot quote it.",
                "An agent is not trimmed. Folding a long thread into a summary is the memory section."
              ],
              "file": "10.dynamic_messages.py",
              "day": 2,
              "module": "04.1 Middleware",
              "snippet": "if request.runtime.context.role == \"viewer\":\n    messages = request.messages[-1:]",
              "sample": "viewer: in 2 sent 1 — does not know the email\nagent: in 2 sent 2 — ada@example.com",
              "demo": "graph",
              "graph": "mw10"
            },
            {
              "id": "lesson:day 2/04.1 Middleware/11.tool_retry.py",
              "kind": "lesson",
              "title": "Tool retry",
              "n": "11",
              "learn": "A lookup that times out runs once more. The retry list is the tool name.",
              "notes": [
                "`ToolRetryMiddleware` retries only the tools you name.",
                "The first `lookup_order` raises a timeout. The second call returns shipped.",
                "A write such as a refund stays off that list, so a failed charge is not sent twice."
              ],
              "file": "11.tool_retry.py",
              "day": 2,
              "module": "04.1 Middleware",
              "snippet": "ToolRetryMiddleware(max_retries=1, tools=[\"lookup_order\"])",
              "sample": "lookup calls: 2\nORD-1 shipped",
              "demo": "graph",
              "graph": "mw11"
            },
            {
              "id": "lesson:day 2/04.1 Middleware/12.pii_redaction.py",
              "kind": "lesson",
              "title": "PII redaction",
              "n": "12",
              "learn": "An email in the user message is redacted before the model reads it.",
              "notes": [
                "`PIIMiddleware` with `apply_to_input=True` rewrites the human message.",
                "The strategy here is redact. The model is asked to quote the email and can only quote the placeholder.",
                "The same wrapper can also mask a card number, an IP address, or a URL."
              ],
              "file": "12.pii_redaction.py",
              "day": 2,
              "module": "04.1 Middleware",
              "snippet": "PIIMiddleware(\"email\", strategy=\"redact\", apply_to_input=True)",
              "sample": "model saw: My email is [REDACTED_EMAIL].",
              "demo": "graph",
              "graph": "mw12"
            },
            {
              "id": "lesson:day 2/04.1 Middleware/13.model_fallback.py",
              "kind": "lesson",
              "title": "Model fallback",
              "n": "13",
              "learn": "If the first model call fails, the next model answers that same turn.",
              "notes": [
                "The agent is built on a model name that does not exist.",
                "`ModelFallbackMiddleware` catches that error and calls the Groq model.",
                "The user still gets one reply. They do not send the question again."
              ],
              "file": "13.model_fallback.py",
              "day": 2,
              "module": "04.1 Middleware",
              "snippet": "ModelFallbackMiddleware(\"groq:openai/gpt-oss-20b\")",
              "sample": "ready",
              "demo": "graph",
              "graph": "mw13"
            },
            {
              "id": "lesson:day 2/04.1 Middleware/14.tool_selector.py",
              "kind": "lesson",
              "title": "Tool selector",
              "n": "14",
              "learn": "A cheap model call keeps one relevant tool. The main model does not see the other three.",
              "notes": [
                "The agent is registered with lookup, refund, hours, and menu.",
                "`LLMToolSelectorMiddleware` with `max_tools=1` filters that list for this question.",
                "A status question should leave `lookup_order`. The other tools stay registered for a later call."
              ],
              "file": "14.tool_selector.py",
              "day": 2,
              "module": "04.1 Middleware",
              "snippet": "LLMToolSelectorMiddleware(model=\"groq:openai/gpt-oss-20b\", max_tools=1)",
              "sample": "tools called: lookup_order\nORD-1 shipped",
              "demo": "graph",
              "graph": "mw14"
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
              "learn": "Long-term memory starts here. The Store keeps a fact after the thread is new.",
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
        },
        {
          "id": "module:day 2/08. Debugging Agents",
          "title": "08. Debugging Agents",
          "items": [
            {
              "id": "lesson:day 2/08. Debugging Agents/01.debugging_agents.py",
              "kind": "lesson",
              "title": "Debugging agents",
              "n": "01",
              "learn": "When an agent fails, name which of the four it is.",
              "notes": [
                "**Concept:** agents fail in four predictable ways. Name which one, then look.",
                "**Failures:** wrong tool (or none). A loop that never stops. A reply that ignores the tool result. Arguments in the wrong shape.",
                "**Look at:** `print(msg.tool_calls)`, `stream(mode=\"updates\")`, `get_state` while paused, `draw_mermaid` of the compiled graph.",
                "**Example:** vague docstrings confuse the model; a tool that always errors hits `recursion_limit`. Press Play on each failure."
              ],
              "file": "01.debugging_agents.py",
              "day": 2,
              "module": "08. Debugging Agents",
              "snippet": "for event in app.stream(inputs, stream_mode=\"updates\"):\n    print(next(iter(event)), event)",
              "sample": "AIMessage tool_calls lookup_order\nToolMessage shipped\nAIMessage ignored the tool and guessed",
              "demo": "graph",
              "graph": "debug",
              "evolution": {
                "title": "How the loop became a glass box",
                "subtitle": "From printf to stream, get_state, and draw_mermaid",
                "eras": [
                  {
                    "era": "Era 1",
                    "years": "2022",
                    "name": "Printf and guesswork",
                    "what": "You printed messages and hoped you could see why the agent called the wrong tool.",
                    "flaw": "Hours lost. No map of which node ran.",
                    "shift": "A ready-made executor."
                  },
                  {
                    "era": "Era 2",
                    "years": "2023 Q1",
                    "name": "AgentExecutor was opaque",
                    "what": "The loop ran, you got an answer. Failures were “the agent did something.”",
                    "flaw": "You could not see inside the loop.",
                    "shift": "Stream node transitions."
                  },
                  {
                    "era": "Era 3",
                    "years": "2023 Q3",
                    "name": "LangGraph streaming",
                    "what": "stream(mode='updates') shows which node just ran. The cycle is visible.",
                    "flaw": "Streaming alone does not show a paused ticket or the planned tool args.",
                    "shift": "Inspect and draw the graph."
                  },
                  {
                    "era": "Era 4",
                    "years": "2024 – now",
                    "name": "get_state, stream, draw_mermaid",
                    "what": "Print tool_calls. Stream updates. get_state while paused. Draw the mermaid of the compiled graph.",
                    "standard": "Name the failure — wrong tool, infinite loop, ignored result, bad args — then look at that place."
                  }
                ],
                "takeaway": "A modern graph is a glass box. recursion_limit turns an infinite loop into a stop you can see."
              }
            }
          ]
                }
              ]
            }
          ]
        }
