export const termsDeck = {
  id: "terms",
  kind: "terms",
  navTitle: "Engineering Notes",
  title: "Engineering Notes",
  lead: "Essential mental models before Day 1. One concept per slide.",
  slides: [
    {
      id: "llm",
      term: "LLM",
      oneLiner: "A large language model predicts the next token from patterns in text.",
      notes: [
        "**LLM** means large language model.",
        "It is next-word (next-token) prediction, not a database of facts.",
        "In this course we **call** a model. We do not train one.",
      ],
    },
    {
      id: "prompt",
      term: "Prompt",
      oneLiner: "How you talk to the model — the whole list of messages, not only the user's sentence.",
      notes: [
        "You tell the model what to do.",
        "System instructions count. History counts. Retrieved docs count.",
        "The model only sees what you put in this call.",
      ],
    },
    {
      id: "token",
      term: "Token",
      oneLiner: "A chunk of text: a word, part of a word, or a character.",
      notes: [
        "Turning text into those chunks is **tokenization**.",
        "Cost and context limits are counted in tokens, not words.",
      ],
    },
    {
      id: "context-window",
      term: "Context window",
      oneLiner: "The maximum tokens the model can see in one call — input and output together.",
      notes: [
        "Think of it as a **whiteboard**. If it is not on the board this turn, the model does not know it.",
        "System prompt, chat history, tool dumps, and the new question all share the same box.",
      ],
    },
    {
      id: "temperature",
      term: "Temperature",
      oneLiner: "A dial on how sharp the next-token probabilities are. This is the sampling knob we use.",
      notes: [
        "Usually between **0 and 1**.",
        "**0** → take the top token. Focused. Use this for tools and agents.",
        "**1** → more variety, more chance of a weird word.",
        "Do not stack temperature with Top-K and Top-P “to be safe.”",
      ],
      iframe: "https://andreban.github.io/temperature-topk-visualizer/",
    },
    {
      id: "top-k",
      term: "Top-K",
      oneLiner: "A hard cutoff: only the K most likely tokens may be sampled.",
      notes: [
        "**K = 1** is always the top token.",
        "**K = 40** keeps the top forty, then samples among those.",
        "If temperature is already doing the job, you do not need Top-K.",
      ],
    },
    {
      id: "top-p",
      term: "Top-P",
      oneLiner: "Keep the smallest set of tokens whose probabilities add up to P.",
      notes: [
        "**P = 0.9** ignores the long tail once 90% of the mass is in the bowl.",
        "The set size changes with the question: confident → few tokens; fuzzy → more.",
      ],
    },
    {
      id: "sampling-combo",
      term: "Temperature + Top-K + Top-P",
      oneLiner: "How the three knobs filter candidate tokens in sequence.",
      notes: [
        "**1. Temperature** reshapes the probability distribution of all words.",
        "**2. Top-K** discards all but the top K candidate words.",
        "**3. Top-P** picks the smallest nucleus from that K whose cumulative probability reaches P.",
        "In this course: set `temperature=0` for tools/agents, `0.7` for natural chat, and leave Top-K/Top-P at default.",
      ],
    },
    {
      id: "hallucination",
      term: "Hallucination",
      oneLiner: "A fluent answer that is not grounded in a tool, a document, or the database.",
      notes: [
        "If the model does not know, it still writes something that sounds sure.",
        "Fix it with tools, RAG, or “I don’t know” — not with a longer prompt.",
      ],
    },
    {
      id: "agent-architecture",
      term: "What Makes Up an AI Agent",
      oneLiner: "Five core areas required to understand and work with an agent: Brain, Body, Mind, Team, and Safety Net.",
      notes: [
        "An agent is more than a single prompt or LLM call.",
        "To understand and make use of an agent, we break things down into five core areas: **The Brain**, **The Body**, **The Mind**, **The Team**, and **The Safety Net**.",
        "Below is an overview of the terms inside each area so we have a clear vocabulary before writing code across the days.",
        "In these notes, we walk through all five areas: **The Brain** (decision-making), **The Body** (runtime execution), **The Mind** (memory & context), **The Team** (multi-agent coordination), and **The Safety Net** (guardrails & safety).",
      ],
    },
    {
      id: "brain-ai-agent",
      term: "Brain - AI Agent",
      oneLiner: "A model wrapped in a loop with tools and memory to work toward a goal.",
      notes: [
        "An LLM generates text. An agent uses an LLM to decide what action to take next.",
        "The model acts as the brain: evaluating the request, deciding whether to call a tool or reply, and reading results.",
        "In code, an agent is a loop around the model that handles state and tool execution.",
      ],
      example: "User asks for order status → Model calls the order lookup tool → Model reads the result → Model sends back the answer.",
      evolution: {
        title: "The Evolution of AI Agents",
        subtitle: "From stateless text generation to durable state machines",
        eras: [
          {
            era: "Era 1",
            years: "2020 – 2022",
            name: "Stateless Text In / Text Out",
            what: "Base prompt engineering. Developers prompted raw models with personas ('Act as an expert assistant') to simulate intelligence.",
            flaw: "The model had no eyes or hands. It could not check a database, execute code, or affect the real world. Pure talk, no action.",
            shift: "Intelligence without tool execution is just a text generator. Models needed real-world interaction."
          },
          {
            era: "Era 2",
            years: "Early 2023",
            name: "The 'AutoGPT' Wild West",
            what: "AutoGPT and BabyAGI burst onto GitHub. Developers wrapped LLMs in unconstrained `while True:` loops, giving them terminal access, file tools, and web search.",
            flaw: "Endless spin cycles, runaway API bills ($50+ in minutes), and severe goal drift after 4–5 turns. Proved autonomy was exciting but unusable in production.",
            shift: "Unconstrained autonomy fails. Agents need budgets, structured stopping criteria, and deterministic boundaries."
          },
          {
            era: "Era 3",
            years: "Late 2023",
            name: "Linear Chains & Black-Box Loops",
            what: "Frameworks introduced ReAct agent executors with strict tool schemas and single finish conditions (`AgentExecutor`).",
            flaw: "Monolithic black-box execution. You could not pause mid-flight for human review, branch into parallel workers, or inspect internal state easily.",
            shift: "Real enterprise agents are business processes, not simple single-shot loops. They require explicit graph-based control."
          },
          {
            era: "Era 4",
            years: "2024 – Present",
            name: "Stateful Graphs & Decision Engines",
            what: "LangGraph, durable state machines, and checkpointers. Agents are structured as nodes connected by conditional edges with persistent memory.",
            standard: "Full persistence (SQLite/Postgres), Human-in-the-Loop approval (`interrupt()`), and strict recursion limits.",
            shift: "The model acts as the decision brain, while deterministic code governs the macro flow and safety."
          }
        ],
        takeaway: "Agents evolved from open-ended, chaotic 'magic while-loops' into disciplined, stateful software systems where code governs the workflow and the LLM handles local decisions."
      }
    },
    {
      id: "brain-tool-calling",
      term: "Brain - Tool Calling",
      oneLiner: "The model returns structured arguments for a function instead of plain text.",
      notes: [
        "The model does not run the code or database query directly.",
        "Instead, it outputs structured JSON containing the tool name and argument values.",
        "Your application code runs the function, handles any errors, and passes the output back to the model.",
        "Tool names, docstrings, and parameter types are what the model reads to know what tools exist and when to use them.",
      ],
      example: "Model output: `tool_calls=[{'name': 'refund_order', 'args': {'order_id': 'ORD-9'}}]`. Application runs the function and feeds back the result.",
      evolution: {
        title: "The Evolution of Tool Calling",
        subtitle: "From brittle regex prompt scraping to native schema-constrained decoding",
        eras: [
          {
            era: "Era 1",
            years: "2022 – Early 2023",
            name: "Prompt Hacks & Regex Scraping",
            what: "Prompting models to reply with JSON: `Output ONLY JSON: {\"tool\": \"...\"}`. Developers used regular expressions (`re.search`) to find and parse JSON from the text.",
            flaw: "Constantly crashed. Models included conversational pleasantries ('Sure! Here is your JSON:'), forgot closing brackets, or hallucinated parameter names, causing `json.JSONDecodeError` in production.",
            shift: "Prompt-based formatting cannot guarantee syntactical correctness."
          },
          {
            era: "Era 2",
            years: "Early 2023",
            name: "Output Parsers & Self-Fixing Retries",
            what: "Frameworks introduced Pydantic parsers and `OutputFixingParser`. When JSON parsing failed, code automatically re-prompted the model with the traceback: 'Fix this JSON error'.",
            flaw: "Doubled token costs and added 3–5 seconds of latency per failed call. Retrying was a band-aid over a fundamental generation issue.",
            shift: "Syntax guarantees must be enforced by the model provider at token-generation time, not fixed in post-processing."
          },
          {
            era: "Era 3",
            years: "Mid 2023",
            name: "OpenAI Native Function Calling",
            what: "OpenAI fine-tuned models specifically to emit function arguments outside the standard message text as a dedicated `tool_calls` payload.",
            flaw: "Initially proprietary to OpenAI. Other models (Anthropic, open-source models) still relied on prompt-based JSON workarounds.",
            shift: "The entire AI ecosystem rallied to adopt native tool calling as a foundational model capability."
          },
          {
            era: "Era 4",
            years: "2024 – Present",
            name: "Universal Tool Calling & Constrained Decoding",
            what: "Standardized tool calling across Anthropic, Groq, Mistral, Ollama, and LangChain (`init_chat_model.bind_tools()`). Engine-level constrained decoding (CFG) guarantees 100% valid schema adherence.",
            standard: "Tool definitions are standard Python functions with Pydantic schemas. Docstrings act as the API contract read by the model.",
            shift: "Tool calling is now deterministic, type-safe, and universal across all major LLM providers."
          }
        ],
        takeaway: "Tool calling transformed from an unreliable text-scraping hack into a core capability of modern LLMs where models emit structured parameters without executing the code directly."
      }
    },
    {
      id: "brain-agentic-loop",
      term: "Brain - Agentic Loop",
      oneLiner: "The repeat cycle: Model → Tool Execution → Observation → Model until the goal is finished.",
      notes: [
        "A simple chain runs once in a straight line.",
        "An agent loop can run multiple turns: calling one tool, inspecting the result, calling another tool, until it has all the information.",
        "The loop ends when the model decides it doesn't need any more tools and returns a final response to the user.",
        "Always set a step limit (`recursion_limit`) so a confused model cannot loop indefinitely.",
      ],
      example: "Turn 1: lookup customer ID → Turn 2: fetch customer orders → Turn 3: answer customer question.",
      evolution: {
        title: "The Evolution of the Agentic Loop",
        subtitle: "From linear one-way pipelines to cyclic, resumable state machines",
        eras: [
          {
            era: "Era 1",
            years: "2022 – 2023",
            name: "Linear Chains (LCEL Pipelines)",
            what: "The pipe paradigm: `prompt | model | parser`. Execution flowed strictly from left to right in a straight line.",
            flaw: "Real tasks require feedback. If a tool returned an error or missing fields, a linear chain had no way to loop back to the model without custom, messy recursive wrappers.",
            shift: "Agents require a loop: Call Model → Run Tool → Observe Result → Call Model again."
          },
          {
            era: "Era 2",
            years: "2023",
            name: "Monolithic While-Loops (AgentExecutor)",
            what: "A single black-box `while not finished:` loop. It called tools, caught exceptions, and re-invoked the model automatically.",
            flaw: "Opaque and inflexible. You could not pause execution, inspect intermediate ticket state, add human approval checkpoints, or branch into sub-agents.",
            shift: "Loops cannot be black boxes. Enterprise workflows need transparent, controllable state management."
          },
          {
            era: "Era 3",
            years: "2024",
            name: "Cyclic Computation Graphs (LangGraph)",
            what: "Rebuilding the agent loop as a first-class graph of nodes and conditional edges. Clear transitions between `agent` and `tools`.",
            flaw: "Running state in-memory meant any process crash, server restart, or network blip destroyed active tasks and customer tickets.",
            shift: "Loops must be durable and checkpointed to survive process restarts."
          },
          {
            era: "Era 4",
            years: "Present",
            name: "Durable Checkpointed Loops & Human-in-the-Loop",
            what: "LangGraph state graphs backed by persistence (SQLite/Postgres). The loop can pause mid-flight via `interrupt()` for human sign-off (e.g. approving a refund) and resume seamlessly hours later.",
            standard: "Safe cyclic loops with `recursion_limit` guards and durable checkpointers.",
            shift: "The loop is now a resilient state machine that supports cycles, pauses, edits, and resumption across processes."
          }
        ],
        takeaway: "The agent loop grew from a rigid straight line into a black-box while-loop, and finally into an observable, checkpointed state machine that can safely pause and resume."
      }
    },
    {
      id: "brain-reasoning",
      term: "Brain - Reasoning",
      oneLiner: "Thinking through intermediate steps before choosing an action or delivering an answer.",
      notes: [
        "**Why a scratchpad is needed:** An LLM does one forward pass per token. It cannot 'pause and think' in silence. The only way it spends extra compute on a hard question is by **generating words** into a scratchpad first.",
        "**How reasoning models work:** Models like o1, o3, and Claude thinking are trained to write internal scratchpad tokens (often in `<think>` blocks) to verify logic, backtrack, and validate conditions before answering.",
        "**What Low / Medium / High effort sets:** The effort parameter dials the **size of the scratchpad token budget** (e.g. hundreds of tokens for simple checks vs. thousands for complex constraint verification).",
        "**Why it matters for agents:** It prevents knee-jerk tool calls. The model reads its own reasoning tokens via self-attention before deciding which tool or argument to emit.",
      ],
      example: "Customer wants an immediate refund for SUB-899 → Model uses scratchpad tokens to check contract terms → Realizes it's an Enterprise account with notice requirements → Routes to account manager instead of issuing an invalid refund.",
      evolution: {
        title: "The Evolution of Reasoning",
        subtitle: "From greedy token output to dedicated test-time compute and scratchpads",
        eras: [
          {
            era: "Era 1",
            years: "2020 – 2022",
            name: "Greedy Autoregressive Output",
            what: "Standard forward-pass generation. When asked a complex multi-condition problem, the model had to generate the very first token immediately without delay.",
            flaw: "Rash, knee-jerk mistakes. Because each token gets a fixed amount of layer compute, models failed at logic, math, and constraint verification when forced to blurt out answers.",
            shift: "Models need working memory and extra compute cycles before committing to an answer."
          },
          {
            era: "Era 2",
            years: "2022 – 2023",
            name: "Prompted Chain-of-Thought (CoT)",
            what: "The landmark discovery (Wei et al.): adding 'Let's think step by step' caused models to output their reasoning steps before the final conclusion, drastically boosting accuracy.",
            flaw: "Inconsistent and fragile. Models sometimes wrote 2 words, sometimes 200, and minor prompt phrasing changes could cause them to skip thinking altogether.",
            shift: "Reasoning should be an architectural mechanism, not an optional prompt suggestion."
          },
          {
            era: "Era 3",
            years: "2023 – Early 2024",
            name: "Prompt-Level Scratchpads (ReAct)",
            what: "Prompt templates forcing models to write: `Thought: [reasoning] \nAction: [tool]`. The application parsed the thought into a scratchpad before executing the action.",
            flaw: "Wasted visible context tokens, added prompt clutter, and models frequently drifted away from the rigid formatting syntax.",
            shift: "Move scratchpad thinking directly into model pre-training and reinforcement learning."
          },
          {
            era: "Era 4",
            years: "Late 2024 – Present",
            name: "Native Reasoning Models (Test-Time Compute)",
            what: "Models trained via RL (OpenAI o1/o3, Claude 3.7 Thinking, DeepSeek-R1) that automatically emit internal scratchpad `<think>` tokens. APIs expose `reasoning_effort: low | medium | high` to dial the scratchpad token budget.",
            standard: "Allocate test-time compute to think through rules, verify preconditions, and avoid invalid actions before calling tools.",
            shift: "Reasoning is now physical test-time compute: more tokens spent on the scratchpad equals higher reliability."
          }
        ],
        takeaway: "Reasoning transformed from a prompt trick ('think step by step') into physical test-time compute, where dialing the effort parameter sets how many scratchpad tokens the model spends evaluating rules before acting."
      }
    },
    {
      id: "brain-planning",
      term: "Brain - Planning",
      oneLiner: "Breaking a goal down into smaller steps and updating the plan as steps succeed or fail.",
      notes: [
        "Complex goals usually cannot be completed in one tool call or turn.",
        "Planning divides the objective into a sequence of smaller sub-tasks.",
        "If a tool call fails or returns unexpected data, the plan can adjust dynamically.",
      ],
      example: "Plan: 1) Verify user → 2) Fetch past receipts → 3) Compare line items → 4) Report differences.",
      evolution: {
        title: "The Evolution of Planning",
        subtitle: "From reactive drunk walking to graph governance and dynamic task trackers",
        eras: [
          {
            era: "Era 1",
            years: "2022 – 2023",
            name: "The Reactive 'Drunk Walk'",
            what: "Pure step-by-step reaction. The model only looked at the very last tool return and decided what to do next without a global roadmap.",
            flaw: "Compounding error and goal drift. On 5+ step tasks, an unexpected tool return would distract the agent, fill the context window, and cause it to forget the original objective.",
            shift: "Agents must maintain macro-level awareness of the complete objective."
          },
          {
            era: "Era 2",
            years: "Early 2023",
            name: "Static 'Plan-and-Solve' Prompting",
            what: "Prompting the model: '1. Create a numbered plan of 5 steps. 2. Execute step 1, then step 2, etc.'",
            flaw: "Completely brittle. If Step 2 hit a 404 error or returned unexpected data, the model couldn't adapt—it hallucinated a fake answer for Step 2 and blindly continued to Step 3.",
            shift: "No plan survives first contact with reality. Plans must be dynamic and adaptable."
          },
          {
            era: "Era 3",
            years: "Late 2023 – 2024",
            name: "Plan-Execute-Replan Architectures",
            what: "Separating roles: a Planner agent writes the task list, an Executor agent runs the active task, and a Replanner reviews the output to revise remaining steps.",
            flaw: "High token overhead and slow latency from calling full agent loops to re-evaluate the entire task list after every minor action.",
            shift: "Combine deterministic macro-workflow code with autonomous local task tracking."
          },
          {
            era: "Era 4",
            years: "Present",
            name: "Graph Governance & Dynamic Task Trackers",
            what: "Production agents (like Cursor, Claude Code, Devin) use explicit task-tracker tools (`TodoWrite`) paired with deep reasoning models, while business systems use LangGraph DAGs to govern the macro path in code.",
            standard: "Zero goal drift. Clear `[Done]`, `[In Progress]`, and `[Pending]` task states with automatic re-planning when an error occurs.",
            shift: "Planning keeps agents grounded and resilient by maintaining explicit progress state across multiple steps."
          }
        ],
        takeaway: "Planning evolved from the reactive 'drunk walk' into explicit task-tracking and graph governance, ensuring agents can decompose complex goals and dynamically adapt when unexpected errors occur."
      }
    },
    {
      id: "body-harness",
      term: "Body - Harness",
      oneLiner: "The runtime plumbing that surrounds the model to connect it to tools, I/O, error handling, and the OS.",
      notes: [
        "An LLM has no hands or eyes on its own. It cannot make HTTP calls, read disk files, or catch timeout exceptions without wrapper code.",
        "The **Harness** is the application code wrapping the model. It feeds context in, intercepts tool call requests, executes the actual functions, and injects observations back.",
        "The harness is where production guarantees live: retry logic, rate limiting, token cost tracking, logging/tracing, and permission gates.",
        "Without a harness, an agent is just a text completion API with no ability to interact with the external world.",
      ],
      example: "When the model emits `tool_calls=[read_file('config.json')]`, the harness checks permissions, reads the file from disk, catches any FileNotFound exception, and returns the result as a ToolMessage.",
      evolution: {
        title: "The Evolution of the Agent Harness",
        subtitle: "From bare API wrapper scripts to robust, observable agent runtimes",
        eras: [
          {
            era: "Era 1",
            years: "2020 – 2022",
            name: "Bare API Calls",
            what: "One-off Python scripts directly calling raw model endpoints. Developers manually formatted strings and caught exceptions by hand.",
            flaw: "Zero standardized tooling, no lifecycle hooks, and an unhandled network error or bad JSON response crashed the entire script.",
            shift: "Models need a standardized runtime chassis rather than ad-hoc wrapper scripts."
          },
          {
            era: "Era 2",
            years: "2023",
            name: "Monolithic Framework Wrappers",
            what: "First-generation agent executors (e.g. LangChain AgentExecutor) packaged prompt formatting, tool loops, and basic retries into a single black box.",
            flaw: "Rigid and hard to customize. Adding custom telemetry, rate-limiting, or permission approval required deep subclassing and monkey-patching.",
            shift: "Runtimes need modular middleware and composable lifecycle hooks."
          },
          {
            era: "Era 3",
            years: "2024",
            name: "Middleware & Traced Runtimes",
            what: "Composable runtimes with middleware stacks (e.g. LangGraph runtime, OpenTelemetry, LangSmith). Middleware wraps every model and tool invocation with tracing, retry policies, and cost tracking.",
            flaw: "Still ran predominantly in unprotected local processes where an agent command could access the developer's entire environment.",
            shift: "The harness must manage isolated sandbox execution environments and external protocol bridges."
          },
          {
            era: "Era 4",
            years: "Present",
            name: "Full Agent Operating Harnesses",
            what: "Specialized production agent runtimes (e.g. Cursor, Claude Agent SDK, modern LangGraph) managing background shell sessions, MCP server connections, permission popups, and persistent state.",
            standard: "Clear separation of concerns: the LLM decides actions, while the harness handles execution safety, streaming I/O, telemetry, and OS sandboxing.",
            shift: "The harness is the body that gives the brain secure, reliable hands in the physical system."
          }
        ],
        takeaway: "The harness evolved from fragile API wrapper scripts into a robust runtime chassis that manages I/O, protocol connections, security boundaries, and telemetry around the model."
      }
    },
    {
      id: "body-mcp",
      term: "Body - MCP (Model Context Protocol)",
      oneLiner: "An open, standardized protocol connecting AI models to external tools, databases, and services.",
      notes: [
        "**MCP** is an open standard (created by Anthropic) that defines how an AI application communicates with external capabilities.",
        "Instead of writing custom Python code for every service (GitHub, Postgres, Slack, Jira), an **MCP server** exposes tools and resources over a universal JSON-RPC protocol.",
        "Solves the **M × N problem**: instead of every agent framework writing custom tools for every service, services build one MCP server that works across all agent harnesses.",
        "Separates tool development from the agent core: MCP servers run as independent local or remote processes over stdio or HTTP/SSE.",
      ],
      example: "A Postgres MCP server exposes `read_query` and `describe_table`. Cursor, Claude Desktop, and your custom LangGraph agent can all connect to it without rewriting tool integration code.",
      evolution: {
        title: "The Evolution of Tool Protocols",
        subtitle: "From framework-locked Python tools to an open universal protocol",
        eras: [
          {
            era: "Era 1",
            years: "2022 – 2023",
            name: "Framework-Locked Tools",
            what: "Every framework invented its own tool specification (LangChain BaseTool, LlamaIndex FunctionTool, Haystack tools). Developers rewrote the same integrations repeatedly.",
            flaw: "Zero interoperability. A tool built for LangChain could not be used in AutoGPT or raw scripts without maintaining multiple wrapper libraries.",
            shift: "Tools should not be tied to any single Python framework."
          },
          {
            era: "Era 2",
            years: "Mid 2023",
            name: "OpenAPI & Web Plugins",
            what: "OpenAI introduced ChatGPT Plugins using `openapi.yaml` specs over HTTP endpoints.",
            flaw: "Poor support for local desktop tools, massive token overhead feeding raw Swagger specs into prompts, and complex authentication hurdles.",
            shift: "Need a lightweight protocol that works seamlessly for local subprocesses (stdio) as well as remote web services."
          },
          {
            era: "Era 3",
            years: "Late 2023 – 2024",
            name: "Provider Tool Schemas",
            what: "Direct JSON schema definitions passed to provider APIs (`tools=[...]`).",
            flaw: "The tool definition was standardized in JSON, but the actual execution architecture remained custom code living directly inside the host app.",
            shift: "Tools should run in isolated processes and broadcast their capabilities through a standard client-server contract."
          },
          {
            era: "Era 4",
            years: "Late 2024 – Present",
            name: "Model Context Protocol (MCP)",
            what: "Anthropic released MCP as an open specification. Client harnesses connect to modular MCP servers over stdio or SSE using standard JSON-RPC.",
            standard: "Universal standard adopted across IDEs, desktop agents, and production runtimes. One tool server works across all clients.",
            shift: "External integrations are now decoupled micro-services providing tools, resources, and prompts over a standard protocol."
          }
        ],
        takeaway: "MCP replaced fragmented, framework-specific tool wrappers with an open, vendor-neutral standard that lets any agent connect to any database, API, or developer environment."
      }
    },
    {
      id: "body-computer-use",
      term: "Body - Computer Use",
      oneLiner: "Allowing an agent to operate software directly via screen pixels, mouse clicks, and keystrokes.",
      notes: [
        "Traditional tool calling requires an API. **Computer Use** lets an agent control software through the graphical user interface (GUI) like a human.",
        "The agent loop receives a screenshot, visually locates buttons and fields, and emits mouse movements, clicks, and keystrokes.",
        "Essential for legacy desktop software, internal web portals, or desktop apps that have no public API or developer SDK.",
        "Combines multimodal vision models (reading screen coordinates) with an OS-level driver that executes clicks and inputs.",
      ],
      example: "Opening a desktop spreadsheet app without an API, visually locating the export button at coordinate (420, 180), clicking it, and typing the save filename.",
      evolution: {
        title: "The Evolution of GUI & Computer Use",
        subtitle: "From brittle DOM scraping to native multimodal screen control",
        eras: [
          {
            era: "Era 1",
            years: "2021 – 2022",
            name: "DOM & XPath Web Scraping",
            what: "Using Selenium or Puppeteer to parse HTML trees and click elements by class name or XPath selector.",
            flaw: "Extremely brittle. Any slight redesign, obfuscated CSS class, canvas element, or desktop app rendered automation useless.",
            shift: "Automation must see the screen visually rather than relying on underlying HTML source code."
          },
          {
            era: "Era 2",
            years: "Late 2023",
            name: "Vision Models Without Spatial Coordinates",
            what: "Feeding screenshots to multimodal models (GPT-4V). The model could describe what was on screen but couldn't reliably pinpoint pixel locations.",
            flaw: "Lack of coordinate grounding. Asking 'Where is the login button?' resulted in vague or off-target coordinate guesses that missed the button.",
            shift: "Models must be trained explicitly to predict exact (x, y) normalized coordinate coordinates."
          },
          {
            era: "Era 3",
            years: "Early 2024",
            name: "Set-of-Marks (SoM) Tagging",
            what: "An intermediary script parsed interactive UI elements and overlaid brightly numbered bounding boxes across the screenshot before showing it to the model.",
            flaw: "Added visual clutter, required heavy pre-processing computation, and failed on non-standard custom GUI controls.",
            shift: "Train frontier vision models to output direct mouse and keyboard commands natively."
          },
          {
            era: "Era 4",
            years: "Late 2024 – Present",
            name: "Native Computer Use APIs",
            what: "Anthropic Computer Use API and OS-World integrations. Models natively output actions: `mouse_move(x, y)`, `left_click`, `type_text`, and `key_combination` across live desktop displays.",
            standard: "Direct vision-to-action control operating real browsers, desktop applications, and terminal windows in sandboxed virtual displays.",
            shift: "Agents can now operate any software that a human can see and interact with on screen."
          }
        ],
        takeaway: "Computer use evolved from fragile HTML DOM scraping into native vision-to-action models that navigate arbitrary desktop interfaces using visual pixels, mouse coordinates, and keystrokes."
      }
    },
    {
      id: "body-sandbox",
      term: "Body - Sandbox",
      oneLiner: "An isolated, disposable execution environment where an agent can safely run code and commands.",
      notes: [
        "An agent with shell or Python access must never run untrusted commands directly on your production host machine.",
        "A **Sandbox** provides an isolated, ephemeral environment (Docker container, microVM, or WebAssembly sandbox) for executing code.",
        "Protects against **accidental destructive actions** (e.g. deleting directories, overwriting system files) and **indirect prompt injection** (malicious prompt instructing the agent to steal `.env` secrets).",
        "Sandboxes are ephemeral: spun up in milliseconds for a task, and destroyed or reset when the task completes.",
      ],
      example: "When the agent generates Python code to parse a CSV, the harness executes it inside an isolated Linux microVM with no access to host secrets or private network infrastructure.",
      evolution: {
        title: "The Evolution of Execution Sandboxes",
        subtitle: "From dangerous host terminal execution to sub-second ephemeral microVMs",
        eras: [
          {
            era: "Era 1",
            years: "2022 – Early 2023",
            name: "Unprotected Host Execution",
            what: "Early agent scripts executed `os.system()` or `subprocess.run()` directly on the developer's laptop with their full personal permissions.",
            flaw: "Extreme danger. Hallucinating agents ran destructive shell commands, wiped local files, or leaked API keys if prompted maliciously.",
            shift: "Agents executing arbitrary code must be completely quarantined from the host OS."
          },
          {
            era: "Era 2",
            years: "2023",
            name: "Local Docker Containers",
            what: "Running agent commands inside local Docker containers with volume mounts.",
            flaw: "Heavy memory footprint, slow startup times (5–15 seconds), and difficult to manage across multi-tenant web applications.",
            shift: "Execution environments must be lightweight, instant, and manageable via programmatic cloud APIs."
          },
          {
            era: "Era 3",
            years: "Early 2024",
            name: "In-Process Interpreters (Restricted Python / WASM)",
            what: "Running code in restricted AST interpreters or WebAssembly (Pyodide in browser/server).",
            flaw: "Safe, but severely limited: could not run real bash scripts, install arbitrary native C packages, or interact with real Linux networking.",
            shift: "Agents need a real full Linux kernel, but with sub-second provisioning and absolute isolation."
          },
          {
            era: "Era 4",
            years: "Late 2024 – Present",
            name: "Ephemeral MicroVMs (Firecracker / E2B)",
            what: "Sub-second cloud microVMs (E2B, Modal, Fly.io, Firecracker) booting a full isolated Linux environment in under 200ms with custom packages, filesystem snapshots, and automatic disposal.",
            standard: "Every task gets a dedicated disposable virtual computer. If an agent crashes or corrupts state, the sandbox is instantly discarded without consequence.",
            shift: "Sandboxing is now a standard, sub-second infrastructure layer for any agent executing code."
          }
        ],
        takeaway: "Sandboxes evolved from risky direct host execution to instant, disposable microVMs that give agents full Linux terminal capabilities in a safe, completely quarantined environment."
      }
    },
    {
      id: "mind-context-window",
      term: "Mind - Context Window",
      oneLiner: "The fixed token budget the model can see in one request: system prompt + history + tools + question.",
      notes: [
        "Every message, tool output, system instruction, and the user's question all count toward the **same shared limit** (e.g. 128k tokens).",
        "If the total thread size exceeds the limit, older messages are **truncated silently by the API** or need to be managed explicitly in your code.",
        "Expanding the context window does not solve cost, noise, or latency. A 1M-token context costs more, retrieves slower, and still requires engineering to keep it relevant.",
        "Context window is a **per-request constraint**, not a database. Persistent facts and historical threads live outside the immediate model invocation.",
      ],
      example: "A long support thread for ORD-1 accumulates 80k tokens across 40 back-and-forth turns. The 81st message overflows the 128k window, silently dropping the system instruction that defined order refund rules.",
      evolution: {
        title: "The Evolution of Context Windows",
        subtitle: "From 2k token limits to multi-million-token caches with engineering requirements unchanged",
        eras: [
          {
            era: "Era 1",
            years: "2020 – 2022",
            name: "2k–4k Token Windows (GPT-3)",
            what: "Early GPT-3 models (davinci-002) had 2,048–4,096 token windows. Every API call was constrained to a few short paragraphs of combined input and output.",
            flaw: "Unusable for real conversations. A 10-turn customer support thread overflowed immediately, forcing constant manual summarization or thread resets.",
            shift: "Models need larger windows to hold realistic multi-turn agent conversations."
          },
          {
            era: "Era 2",
            years: "2023",
            name: "16k–32k Windows (GPT-3.5 Turbo, Claude 2)",
            what: "Context windows expanded to 16k–32k tokens. This was enough for short customer tickets or single-file code reviews.",
            flaw: "Developers misused the larger window as a 'dump everything' strategy, leading to noisy prompts, slower inference, and ballooning API costs.",
            shift: "Bigger windows do not replace trim, compact, and retrieval strategies — they just delay the overflow."
          },
          {
            era: "Era 3",
            years: "2024",
            name: "100k–200k Windows (Claude 3, GPT-4 Turbo)",
            what: "Claude 3 offered 200k tokens; GPT-4 Turbo expanded to 128k. Entire codebases or long legal documents could be fed directly.",
            flaw: "Latency spiked (5–10s per call), costs multiplied (10–50x per query), and models struggled with needle-in-haystack retrieval when everything was 'in context'.",
            shift: "A large window is not a replacement for intelligent memory management. Engineers still need trim, compact, summarize, store, and retrieve layers."
          },
          {
            era: "Era 4",
            years: "2025 – Present",
            name: "1M+ Windows with Prompt Caching",
            what: "Gemini 1.5 and Claude 3.5 support 1M+ token windows with prompt caching (reusing prefixes across calls). The technical ceiling is high, but practical engineering is unchanged.",
            standard: "Context engineering remains essential: trim noisy tool dumps, compact irrelevant history, store stable facts, and retrieve only what's needed this turn.",
            shift: "The window expanded, but the discipline didn't change: more tokens ≠ better performance. Cost, noise, and retrieval precision still matter."
          }
        ],
        takeaway: "Context windows grew from 2k to 1M+ tokens, but this did not eliminate the need for trim, compact, store, and retrieve strategies — it only raised the ceiling before those techniques become mandatory."
      }
    },
    {
      id: "mind-context-engineering",
      term: "Mind - Context Engineering",
      oneLiner: "Choosing what the model sees each turn: trimming old messages, compacting tool dumps, and injecting only relevant memory or documents.",
      notes: [
        "Context engineering is **not** 'write a better system prompt.' It is the deliberate process of assembling what goes into the context window for this specific invocation.",
        "**Five-layer strategy ladder** (apply in order as the thread grows): **(1) Trim** old messages by token budget, **(2) Compact** verbose tool outputs, **(3) Summarize** distant conversation history, **(4) Store** stable facts outside the chat, **(5) Retrieve** only relevant documents or memories.",
        "Trim and compact are the **first resort** for most agents. Summarization and retrieval add latency and cost, so apply them only when simpler techniques fail.",
        "Middleware wires these strategies directly into the agent loop so developers cannot forget to apply them on every turn.",
      ],
      example: "A 50-turn customer support thread for ORD-1 is trimmed to the last 15 messages, tool dumps are compacted to one-line summaries, stable customer preferences are stored in the LangGraph Store, and only the current order details are retrieved from the database.",
      evolution: {
        title: "The Evolution of Context Engineering",
        subtitle: "From naive full-history dumps to disciplined, layered context assembly strategies",
        eras: [
          {
            era: "Era 1",
            years: "2020 – 2022",
            name: "Append-Only Prompts",
            what: "Developers concatenated all previous messages into one massive string and sent it on every API call.",
            flaw: "Threads overflowed immediately. The system instruction was truncated silently by the API, breaking agent behavior without warning.",
            shift: "Agents need explicit strategies to manage what enters the context window each turn."
          },
          {
            era: "Era 2",
            years: "2023",
            name: "Manual Trimming & Token Counting",
            what: "Developers manually called `tiktoken` or `num_tokens_from_string()` and wrote bespoke logic to drop old messages when the budget was close.",
            flaw: "Every team reimplemented the same trim logic. Code was fragile, untested, and often broke when tool outputs were larger than expected.",
            shift: "Trimming and compaction must be framework primitives, not custom user code."
          },
          {
            era: "Era 3",
            years: "2024",
            name: "Framework Middleware (trim_messages, compact)",
            what: "LangChain and LangGraph introduced `trim_messages()` and message compactors as first-class utilities. Developers composed them declaratively in the graph.",
            flaw: "Still manual wiring. Forgetting to add the trim step in one node caused production overflows.",
            shift: "Context strategies should be enforced automatically by the agent runtime, not opt-in utilities."
          },
          {
            era: "Era 4",
            years: "2025 – Present",
            name: "Auto-Managed Context Layers (Store + Retrieval)",
            what: "Agent runtimes (LangGraph, Cursor Agent SDK) automatically apply trim/compact/store layers via middleware. The LangGraph Store separates stable facts from ephemeral chat history. RAG retrieval pulls relevant docs just-in-time.",
            standard: "The five-layer ladder (trim → compact → summarize → store → retrieve) is the standard mental model for production agent memory management.",
            shift: "Context engineering is now a structured discipline with clear primitives, not ad-hoc prompt surgery."
          }
        ],
        takeaway: "Context engineering evolved from naive 'dump everything' strategies into a disciplined, layered process where trim, compact, store, and retrieve are applied systematically on every agent turn."
      }
    },
    {
      id: "mind-memory",
      term: "Mind - Memory",
      oneLiner: "Retaining user facts, preferences, and past decisions across threads without re-explaining or overflowing the context window.",
      notes: [
        "**Checkpointer vs Store:** A checkpointer saves the full conversation thread for one `thread_id`. The Store holds **structured, reusable facts** (e.g. customer preferences, account metadata) that persist across new threads.",
        "Memory is not 'keep everything in context.' It is the intentional decision of what to persist outside the immediate chat and when to inject it back.",
        "**Where it lives:** **(1) Short-term** — the messages this call actually sends, **(2) Session** — the full thread for one `thread_id`, **(3) Long-term (Store)** — what outlives that thread.",
        "**Three kinds inside the Store:** **Semantic** — a fact (\"email, not phone\"), **Episodic** — a past case (situation, action, outcome), **Procedural** — a rule loaded into the next system prompt.",
        "Agents use `ToolRuntime` to explicitly write and search the Store from inside tool calls, making memory updates visible and debuggable rather than model-hallucinated.",
      ],
      example: "After resolving ticket TKT-42, the agent stores the customer's communication preference (email, not phone) in the LangGraph Store. Three weeks later, on a new thread TKT-89, the agent retrieves that preference without asking again.",
      evolution: {
        title: "The Evolution of Agent Memory",
        subtitle: "From stateless per-request calls to durable, namespaced fact storage across threads",
        eras: [
          {
            era: "Era 1",
            years: "2020 – 2022",
            name: "Zero Memory (Stateless API Calls)",
            what: "Every API invocation was completely isolated. Models had no persistent memory. Users had to re-explain their context, preferences, and history on every new conversation.",
            flaw: "Terrible user experience. 'I already told you my order number' became the standard user frustration.",
            shift: "Agents need to remember past interactions without forcing users to repeat themselves."
          },
          {
            era: "Era 2",
            years: "2023",
            name: "Session-Level Checkpointers (SQLite Thread Storage)",
            what: "Frameworks introduced checkpointers (LangGraph's `MemorySaver`, SQLite-backed persistence). The full conversation thread was saved and reloaded on each turn within the same `thread_id`.",
            flaw: "Memory died when the thread ended. Starting a new ticket with the same customer wiped all preferences and history.",
            shift: "Stable facts must persist across threads, not just within one conversation."
          },
          {
            era: "Era 3",
            years: "Early 2024",
            name: "Vector Retrieval for 'Semantic Memory'",
            what: "Developers embedded past conversation chunks into vector stores (Pinecone, Chroma) and retrieved similar past exchanges via semantic search.",
            flaw: "Noisy and unreliable. Asking 'What's my name?' might retrieve a conversation about someone else's name if the embedding was close. No schema, no validation, no clear namespace boundaries.",
            shift: "Memory must be structured, namespaced, and deterministic — not fuzzy vector similarity."
          },
          {
            era: "Era 4",
            years: "Late 2024 – Present",
            name: "LangGraph Store (Structured Long-Term Memory)",
            what: "LangGraph Store introduced namespaced key-value memory with schemas (e.g. `customer:<id>`, `account:<id>`). Tools explicitly write and search memory using `ToolRuntime`, and the Store persists across threads, processes, and sessions.",
            standard: "Three-layer memory: in-context (current turn), checkpointed (this thread), and Store (reusable facts). Middleware auto-injects relevant Store items into the prompt just-in-time.",
            shift: "Memory is now a first-class agent primitive with clear boundaries: session state vs. long-term structured facts."
          }
        ],
        takeaway: "Agent memory matured from zero persistence into a three-layer system: short-term in-context buffers, session checkpointers for one thread, and the Store for durable, cross-thread facts."
      }
    },
    {
      id: "team-subagent",
      term: "Team - Sub-agent",
      oneLiner: "A specialized child agent launched by a parent to handle one subtask, then return results.",
      notes: [
        "A sub-agent is a temporary, focused agent spawned to handle a specific piece of work the parent cannot or should not do itself.",
        "The parent agent decides to delegate (e.g. 'this requires deep research'), spawns the sub-agent with clear instructions, waits for the result, and continues with the returned output.",
        "Sub-agents run in isolated context: they do not share the parent's full message history unless explicitly passed, preventing context pollution.",
        "Common use cases: research tasks, code generation, data transformation, or any workflow requiring a fresh context window or specialized system prompt.",
      ],
      example: "A customer support agent encounters a complex refund policy question. It spawns a 'policy research sub-agent' with the customer query, the sub-agent searches internal docs and returns a 3-sentence summary, then the parent replies to the customer.",
      evolution: {
        title: "The Evolution of Sub-agents",
        subtitle: "From monolithic single-agent loops to composable task delegation hierarchies",
        eras: [
          {
            era: "Era 1",
            years: "2022 – 2023",
            name: "Monolithic Single-Agent Workflows",
            what: "One agent handled everything: customer support, research, summarization, and code generation all in the same loop with the same system prompt.",
            flaw: "Context windows overflowed. The agent's identity became confused ('Am I a support agent or a researcher?'), and unrelated task histories polluted each other.",
            shift: "Complex workflows need task decomposition with isolated, focused agents."
          },
          {
            era: "Era 2",
            years: "2023",
            name: "Sequential Tool Chains (Pseudo-Delegation)",
            what: "Developers created tools like `summarize_docs()` that internally called the LLM again, simulating delegation but without true agent autonomy.",
            flaw: "Not composable. Each 'sub-task' was hardcoded as a tool. No dynamic decision of when to delegate or which specialist to invoke.",
            shift: "Delegation must be a first-class agent primitive, not a hidden tool implementation detail."
          },
          {
            era: "Era 3",
            years: "2024",
            name: "Explicit Sub-agent Nodes (LangGraph)",
            what: "LangGraph introduced nodes that could invoke entirely separate agent graphs. The parent explicitly routed to a sub-agent node, which returned a result.",
            flaw: "Still mostly synchronous and blocking. The parent waited idle while the sub-agent worked, wasting compute on long research tasks.",
            shift: "Sub-agents should support async dispatch and result polling for long-running tasks."
          },
          {
            era: "Era 4",
            years: "2025 – Present",
            name: "Dynamic Sub-agent Orchestration (Cursor Task, LangGraph Cloud)",
            what: "Runtimes support spawning sub-agents dynamically via tool calls (e.g. `spawn_subagent(task, context)`). Sub-agents run in parallel, can be cloud-hosted, and return structured results via callbacks.",
            standard: "Sub-agents are ephemeral, isolated workers: fresh context, specialized prompts, clear inputs/outputs, automatic cleanup.",
            shift: "Delegation is now a composable, runtime-managed primitive for decomposing complex multi-step workflows."
          }
        ],
        takeaway: "Sub-agents evolved from hidden LLM re-calls inside tools into first-class composable workers that enable scalable task decomposition and context isolation."
      }
    },
    {
      id: "team-multiagent",
      term: "Team - Multi-agent",
      oneLiner: "Multiple agents working on the same problem, either in parallel or through structured collaboration.",
      notes: [
        "Multi-agent systems coordinate multiple specialized agents to solve problems no single agent can handle alone.",
        "**Parallel execution:** Multiple agents work independently on different subtasks (e.g. one agent researches pricing, another researches competitors), then results are merged.",
        "**Sequential handoff:** One agent completes its part and explicitly hands control to the next specialist (e.g. triage → research → drafting → review).",
        "Requires orchestration logic to route tasks, aggregate results, and handle failures when one agent in the chain gets stuck or produces invalid output.",
      ],
      example: "A content pipeline: Agent 1 (Researcher) gathers sources, Agent 2 (Writer) drafts the article from those sources, Agent 3 (Editor) refines tone and grammar, Agent 4 (SEO Optimizer) adds metadata and links.",
      evolution: {
        title: "The Evolution of Multi-agent Systems",
        subtitle: "From sequential function calls to true collaborative agent teams",
        eras: [
          {
            era: "Era 1",
            years: "2023",
            name: "Sequential LLM Chains (Pseudo-Multi-agent)",
            what: "Developers manually chained multiple LLM calls: Call 1 (research) → Call 2 (summarize) → Call 3 (format). Each step was a separate API invocation with piped input/output.",
            flaw: "Brittle and opaque. If step 2 failed, the whole pipeline crashed. No state persistence, no retry logic, no agent autonomy.",
            shift: "Agents need explicit roles, state management, and the ability to reason about whether to hand off or retry."
          },
          {
            era: "Era 2",
            years: "Late 2023",
            name: "Multi-agent Frameworks (AutoGen, CrewAI)",
            what: "Early frameworks introduced agent 'crews' where each agent had a role and persona. Communication happened via message passing in a shared group chat.",
            flaw: "Group chat chaos. Agents talked over each other, repeated work, or got stuck in conversational loops. No clear orchestration or state machine control.",
            shift: "Multi-agent systems need deterministic orchestration, not free-form conversation."
          },
          {
            era: "Era 3",
            years: "2024",
            name: "Supervisor Orchestration Patterns",
            what: "LangGraph introduced supervisor nodes: one orchestrator agent decides which specialist to invoke next based on current state, then routes the task explicitly.",
            flaw: "Supervisor became a bottleneck. Every decision went through one central agent, adding latency and cost to every step.",
            shift: "Peer-to-peer handoffs and parallel dispatch reduce orchestration overhead."
          },
          {
            era: "Era 4",
            years: "2025 – Present",
            name: "Hybrid Orchestration (Supervisors + Peer Handoffs)",
            what: "Modern systems combine supervisor orchestration (for high-level routing) with peer-to-peer handoffs (agents directly transfer control) and parallel fan-out (spawn multiple sub-agents simultaneously).",
            standard: "Multi-agent workflows are state machines with explicit edges for handoffs, error recovery, and human-in-the-loop approval gates.",
            shift: "Multi-agent collaboration is now deterministic, observable, and production-grade with clear ownership and failure boundaries."
          }
        ],
        takeaway: "Multi-agent systems matured from brittle sequential chains into structured, observable collaboration workflows with supervisors, peer handoffs, and parallel execution."
      }
    },
    {
      id: "team-orchestrator",
      term: "Team - Orchestrator",
      oneLiner: "The meta-agent or control logic that routes tasks to specialist agents and aggregates their results.",
      notes: [
        "An orchestrator does not execute the work itself. It decides **which agent** should handle the current task and **when** to move to the next step.",
        "Can be an LLM-based supervisor agent (dynamic routing via reasoning) or deterministic code logic (rule-based routing via conditionals).",
        "Responsibilities: task decomposition, specialist selection, input preparation, output validation, error handling, and final result synthesis.",
        "Centralized orchestrators risk becoming bottlenecks; modern patterns blend supervisor orchestration with peer-to-peer handoffs to reduce latency.",
      ],
      example: "A customer ticket arrives. The orchestrator reads the ticket type: if technical, route to TechSupportAgent; if billing, route to BillingAgent; if escalation, route to HumanHandoffAgent. After resolution, the orchestrator aggregates logs and updates the CRM.",
      evolution: {
        title: "The Evolution of Orchestration",
        subtitle: "From hardcoded if-else routing to LLM-driven dynamic task decomposition",
        eras: [
          {
            era: "Era 1",
            years: "2023",
            name: "Hardcoded Conditional Routing",
            what: "Developers wrote explicit if-else or switch-case logic to route tasks: `if query.contains('refund'): call_billing_agent()`.",
            flaw: "Extremely brittle. Any new task type required code changes. Could not handle ambiguous or multi-intent queries.",
            shift: "Orchestrators need to reason dynamically about task classification and routing."
          },
          {
            era: "Era 2",
            years: "Late 2023",
            name: "LLM Supervisor Agents",
            what: "An LLM-based supervisor agent received the user query and decided which specialist to invoke by generating a routing decision in natural language.",
            flaw: "Added an extra LLM call (latency + cost) to every request. Supervisor decisions were sometimes inconsistent or wrong.",
            shift: "Combine LLM reasoning for complex cases with fast deterministic routing for obvious patterns."
          },
          {
            era: "Era 3",
            years: "2024",
            name: "Graph-Based Orchestration (LangGraph)",
            what: "LangGraph graphs became the orchestrator: nodes represented agents, edges represented transitions. A supervisor node or conditional edge logic routed between specialists.",
            flaw: "Everything went through graph compilation and state transitions, even trivial single-agent tasks. Overhead for simple cases.",
            shift: "Optimize for the common case: single-agent tasks should skip orchestration overhead entirely."
          },
          {
            era: "Era 4",
            years: "2025 – Present",
            name: "Hybrid Adaptive Orchestration",
            what: "Modern systems detect task complexity upfront. Simple queries skip orchestration (direct single-agent). Complex multi-step workflows trigger supervisor-based decomposition and specialist routing.",
            standard: "Orchestrators are optional middleware: invoked only when task complexity or multi-agent coordination is detected.",
            shift: "Orchestration is no longer one-size-fits-all — it adapts to the task at hand, minimizing latency and cost for simple cases."
          }
        ],
        takeaway: "Orchestration evolved from rigid if-else routing into adaptive, LLM-augmented task decomposition that dynamically decides when and how to coordinate specialist agents."
      }
    },
    {
      id: "team-handoff",
      term: "Team - Handoff",
      oneLiner: "Explicit transfer of control from one agent to another, or from an agent to a human.",
      notes: [
        "A handoff is the moment one agent says, 'I'm done, here's the context and output — you take over now.'",
        "**Agent-to-agent handoff:** One specialist completes its task and passes structured context to the next agent in the workflow (e.g. researcher → writer).",
        "**Agent-to-human handoff:** The agent reaches a decision point requiring human judgment (e.g. approving a refund, escalating a sensitive issue). Execution pauses until a human approves or rejects.",
        "Handoffs require durable state: the receiving agent or human must have full context (inputs, intermediate outputs, and why the handoff occurred).",
      ],
      example: "A support agent handles a basic question, then realizes the customer needs a refund over $500. The agent triggers a handoff to a human supervisor with the ticket summary, proposed refund amount, and the reason (policy threshold exceeded). The human reviews and approves.",
      evolution: {
        title: "The Evolution of Handoffs",
        subtitle: "From invisible context loss to explicit, durable state transfer primitives",
        eras: [
          {
            era: "Era 1",
            years: "2022 – 2023",
            name: "Implicit Handoffs via External Systems",
            what: "Developers manually wrote the agent's output to a database or Slack, then a human or another script picked it up later. No framework support for handoffs.",
            flaw: "Context loss. The receiving human or agent had no structured way to see why the handoff happened, what was tried, or what decisions were already made.",
            shift: "Handoffs must preserve full context, not just the final output."
          },
          {
            era: "Era 2",
            years: "2023",
            name: "Message Passing Between Agents (AutoGen)",
            what: "Agents communicated via shared message buffers. Agent A posted 'I'm done' and Agent B read the history and continued.",
            flaw: "Noisy and ambiguous. Handoff intent was buried in conversational messages. Hard to programmatically detect 'this is a handoff' vs. 'this is agent thinking out loud'.",
            shift: "Handoffs should be explicit primitives, not implicit message patterns."
          },
          {
            era: "Era 3",
            years: "2024",
            name: "LangGraph `interrupt()` and Approval Gates",
            what: "LangGraph introduced `interrupt()`: agents could explicitly pause execution and request human input before continuing. State was checkpointed so humans could review and resume later.",
            flaw: "Synchronous blocking. The thread froze until a human acted, even if that took hours or days. No async resumption or escalation timeouts.",
            shift: "Handoffs must support async workflows with expiration policies and escalation paths."
          },
          {
            era: "Era 4",
            years: "2025 – Present",
            name: "Durable Handoff Primitives (Cursor, LangGraph Cloud)",
            what: "Modern runtimes provide durable handoff APIs: `await_human_approval(context)` or `handoff_to_agent(next_agent, state)`. State is persisted, timeouts are configurable, and escalation logic is built-in.",
            standard: "Handoffs include: context snapshot, reason for handoff, expiration policy, and rollback/resume instructions.",
            shift: "Handoffs are now production-grade async primitives with SLAs, escalation, and audit trails."
          }
        ],
        takeaway: "Handoffs evolved from implicit context loss and manual coordination into explicit, durable state transfer primitives with async support, timeouts, and audit trails."
      }
    },
    {
      id: "safety-guardrails",
      term: "Safety Net - Guardrails",
      oneLiner: "Rules and constraints that prevent the agent from taking dangerous, expensive, or invalid actions.",
      notes: [
        "Guardrails are automated checks that run **before** or **after** tool execution to validate inputs, outputs, and agent decisions.",
        "**Input validation:** Check arguments before calling tools (e.g. reject SQL queries with DROP or DELETE, block file paths outside allowed directories).",
        "**Output filtering:** Scrub sensitive information from responses (e.g. mask PII, redact API keys accidentally returned by tools).",
        "**Policy enforcement:** Block actions that violate business rules (e.g. refunds over $500, modifying production databases, sending emails to non-approved domains).",
      ],
      example: "An agent attempts to execute `refund_order(order_id='ORD-1', amount=10000)`. The guardrail checks the policy: refunds over $5000 require manager approval. The guardrail blocks execution and triggers a human-in-the-loop approval workflow instead.",
      evolution: {
        title: "The Evolution of Guardrails",
        subtitle: "From post-hoc damage control to proactive policy enforcement at tool invocation time",
        eras: [
          {
            era: "Era 1",
            years: "2022 – 2023",
            name: "No Guardrails (Hope-Based Safety)",
            what: "Agents had full, unrestricted access to tools. Developers trusted prompts like 'Never delete data' or 'Be careful with refunds' to prevent mistakes.",
            flaw: "Prompt instructions are not security boundaries. Agents regularly made catastrophic errors: deleted production data, issued invalid refunds, or leaked sensitive information.",
            shift: "Safety cannot rely on prompt engineering. Guardrails must be enforced programmatically outside the model."
          },
          {
            era: "Era 2",
            years: "2023",
            name: "Manual Post-Execution Validation",
            what: "Developers wrote validation checks **after** tool execution. If the agent did something wrong, code would catch it and roll back or log an error.",
            flaw: "Reactive, not preventive. Damage was already done before the guardrail caught it (e.g. email already sent, database row already deleted).",
            shift: "Guardrails must run **before** execution, not after."
          },
          {
            era: "Era 3",
            years: "2024",
            name: "Pre-Execution Policy Validators",
            what: "Frameworks added hooks to validate tool arguments **before** execution. Developers wrote custom validators (e.g. `@validate_args`) to reject dangerous calls.",
            flaw: "Every team reimplemented the same validators. No shared policy library or centralized guardrail management across multiple agents.",
            shift: "Guardrails should be reusable middleware components, not per-agent custom code."
          },
          {
            era: "Era 4",
            years: "2025 – Present",
            name: "Centralized Guardrail Middleware (LangSmith, Patronus AI)",
            what: "Modern agent runtimes integrate centralized guardrail services. Policies are defined once (e.g. 'block PII in responses,' 'require approval for refunds >$500') and enforced across all agents automatically.",
            standard: "Guardrails run as middleware on every tool call and model output. Violations trigger logging, blocking, or human-in-the-loop escalation.",
            shift: "Guardrails are now infrastructure-level safety enforcement, not application-level validation code."
          }
        ],
        takeaway: "Guardrails evolved from post-hoc hope and manual validation into proactive, centralized policy enforcement middleware that blocks dangerous actions before they execute."
      }
    },
    {
      id: "safety-human-in-loop",
      term: "Safety Net - Human in the Loop",
      oneLiner: "Pausing execution to request explicit human approval before proceeding with high-stakes or uncertain actions.",
      notes: [
        "Human-in-the-loop (HITL) is the explicit handoff from agent to human when the agent encounters a decision it should not make autonomously.",
        "Common triggers: policy violations (e.g. refund exceeds threshold), low confidence (e.g. ambiguous customer intent), or sensitive actions (e.g. modifying production data, legal decisions).",
        "Execution pauses with full context preserved. A human reviews the proposed action, context, and reasoning, then approves, rejects, or edits before the agent resumes.",
        "Modern HITL systems support async workflows: agents don't block; they checkpoint state, notify humans via dashboard/Slack, and resume when a decision is made.",
      ],
      example: "An agent drafts a customer response involving a partial refund. The confidence score is 68%, below the 80% threshold. The agent triggers HITL: 'Proposed response requires review.' A human reviews, edits the tone, and approves. The agent sends the revised message.",
      evolution: {
        title: "The Evolution of Human-in-the-Loop",
        subtitle: "From synchronous blocking prompts to async approval workflows with SLAs and escalation",
        eras: [
          {
            era: "Era 1",
            years: "2022 – 2023",
            name: "Implicit Manual Intervention",
            what: "No formal HITL mechanism. When agents got stuck or made mistakes, humans manually intervened by editing logs, canceling API calls, or restarting workflows.",
            flaw: "Chaotic and reactive. No structured approval workflow, no audit trail, and no way for the agent to request help proactively.",
            shift: "Agents need the ability to explicitly request human judgment before acting."
          },
          {
            era: "Era 2",
            years: "2023",
            name: "Synchronous CLI Prompts (input() blocking)",
            what: "Early agent scripts used Python `input('Approve refund? y/n')` to pause and wait for terminal input.",
            flaw: "Completely synchronous and blocking. The agent process froze until a human physically typed 'y' or 'n' in the terminal. Impossible for production multi-user systems.",
            shift: "HITL must be asynchronous and work across distributed systems, not just local terminals."
          },
          {
            era: "Era 3",
            years: "2024",
            name: "LangGraph `interrupt()` with Checkpointing",
            what: "LangGraph introduced `interrupt()`: agents paused execution, checkpointed state to SQLite/Postgres, and waited for external approval via API call before resuming.",
            flaw: "No expiration policies. Threads could be paused indefinitely if a human never responded. No escalation logic or timeout handling.",
            shift: "HITL workflows need SLAs, timeouts, and escalation paths (e.g. auto-escalate to manager after 30 minutes)."
          },
          {
            era: "Era 4",
            years: "2025 – Present",
            name: "Async Approval Dashboards with SLAs",
            what: "Modern HITL systems (Cursor, LangGraph Cloud, internal approval dashboards) provide rich UIs showing context, proposed action, and reasoning. Approvals have configurable timeouts and escalation logic.",
            standard: "HITL triggers send notifications (email, Slack), display full context in dashboards, support edits/overrides, and auto-escalate on timeout.",
            shift: "Human-in-the-loop is now a production-grade async workflow primitive with observability, SLAs, and escalation policies."
          }
        ],
        takeaway: "Human-in-the-loop evolved from reactive manual intervention into structured, async approval workflows with rich context, configurable timeouts, and automatic escalation."
      }
    },
    {
      id: "safety-evals",
      term: "Safety Net - Evals",
      oneLiner: "Automated tests that measure whether the agent produces correct, safe, and high-quality outputs.",
      notes: [
        "Evals (evaluations) are the agent equivalent of unit tests: they run the agent on known test cases and assert that outputs meet quality, safety, and correctness criteria.",
        "**Correctness evals:** Does the agent produce the right answer? (e.g. retrieves the correct order, calculates accurate refunds, follows policy rules).",
        "**Safety evals:** Does the agent avoid dangerous actions? (e.g. never leaks PII, never deletes production data, always requires approval for sensitive operations).",
        "**Quality evals:** Does the output meet style and tone standards? (e.g. polite tone, no hallucinations, coherent reasoning).",
      ],
      example: "An eval suite runs 100 test customer support tickets. Eval checks: (1) Did the agent retrieve the correct order 95% of the time? (2) Did it never issue a refund without approval? (3) Were responses rated 4+ stars by human reviewers?",
      evolution: {
        title: "The Evolution of Agent Evals",
        subtitle: "From manual QA spot-checks to continuous automated evaluation pipelines",
        eras: [
          {
            era: "Era 1",
            years: "2022 – 2023",
            name: "No Systematic Evaluation",
            what: "Developers tested agents manually by running a few queries in a notebook and eyeballing the results. No structured test suite, no metrics, no regression tracking.",
            flaw: "Unmeasurable and unrepeatable. Changes to prompts or tools could break existing behavior, and teams wouldn't notice until customers complained.",
            shift: "Agent quality must be measured systematically with repeatable tests and clear metrics."
          },
          {
            era: "Era 2",
            years: "2023",
            name: "Golden Dataset Manual Review",
            what: "Teams created 'golden datasets' of 20–50 test cases. After each change, a human manually reviewed agent outputs on those cases and scored them subjectively.",
            flaw: "Slow, expensive, and not scalable. Human review took hours per eval run. No automated pass/fail criteria.",
            shift: "Evaluation must be automated with programmatic assertions, not manual human review."
          },
          {
            era: "Era 3",
            years: "2024",
            name: "LLM-as-Judge Automated Evals",
            what: "Frameworks introduced 'LLM-as-judge' evals: a second model (e.g. GPT-4) reviewed the agent's output and scored it on correctness, helpfulness, and safety.",
            flaw: "Expensive (extra LLM call per test case) and sometimes inconsistent. Judge models had their own biases and could be gamed by clever phrasing.",
            shift: "Combine LLM-as-judge with deterministic assertions and human-validated ground truth."
          },
          {
            era: "Era 4",
            years: "2025 – Present",
            name: "Continuous Eval Pipelines (LangSmith, BrainTrust)",
            what: "Modern eval platforms run agents through test suites in CI/CD, track metrics over time (accuracy, latency, cost), and flag regressions before production deployment.",
            standard: "Eval suites combine: exact-match assertions (tool calls, structured outputs), LLM-as-judge scoring (quality, tone), and human spot-checks (edge cases).",
            shift: "Evals are now continuous integration primitives: every code or prompt change triggers automated eval runs with regression detection."
          }
        ],
        takeaway: "Agent evals matured from ad-hoc manual QA into continuous automated evaluation pipelines that track correctness, safety, and quality metrics over time."
      }
    },
  ],
};

export function termsHref(slideId) {
  return slideId ? `#/words/${slideId}` : "#/words";
}

