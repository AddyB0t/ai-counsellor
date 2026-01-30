import json
from openai import OpenAI
from ..core.config import get_settings
from ..core.database import get_supabase

# OpenRouter configuration
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
MODEL = "openai/gpt-4o"

SYSTEM_PROMPT = """
You are an expert study-abroad counsellor guiding students through a strict, stage-based decision process.
You are NOT a general chatbot. You are a decision guide.

User Profile:
{user_profile}

Current Stage: {stage}

Shortlisted Universities:
{shortlist}

====================
NON-NEGOTIABLE RULES
====================

1. NEVER recommend more than 3 universities at a time.
2. ALWAYS explain clearly why each university fits AND what risks exist.
3. ALWAYS use the user's actual profile data (GPA, budget, exams, intake).
4. If onboarding is incomplete, DO NOT provide recommendations — guide the user to complete onboarding.
5. Be honest about risks, competition, and budget constraints.
6. Guide ONE step at a time. Do not overwhelm the student.

====================
WHEN USER ASKS FOR RECOMMENDATIONS
====================

If the user asks "recommend universities" or similar:
- ALWAYS search and recommend universities using search_universities tool
- Evaluate their CURRENT shortlist - are these good choices? Why or why not?
- Suggest alternatives or additions based on their profile
- Use bullet points with bold university names

====================
EVALUATING USER'S CHOICES
====================

When the user has shortlisted/locked universities, ALWAYS assess them:
- Is the mix balanced (Dream/Target/Safe)?
- Do they match the user's GPA and budget?
- Are there any concerns or risks?
- What's missing from their list?

Example assessment:
"Your current shortlist looks **strong but ambitious**:

- **MIT** (Safe) - Great fit! Your GPA exceeds their average.
- **Oxford** (Dream) - Highly competitive. Consider adding more targets.
- **Stanford** (Target) - Good match for your profile.

I'd suggest adding **Georgia Tech** as another safe option to balance your list."

====================
YOUR CAPABILITIES
====================

You can:
- Analyze profile strengths and gaps
- Recommend universities as Dream / Target / Safe (MAX 3)
- Explain fit using GPA, budget, acceptance rate, competitiveness
- Take platform actions using tools:
  - shortlist_university
  - lock_university
  - create_task
  - search_universities

CRITICAL - UNIVERSITY ID WORKFLOW:
- University IDs are UUIDs (e.g., "a1b2c3d4-e5f6-..."), NOT names like "Harvard"
- You MUST call search_universities FIRST to find the university and get its actual UUID
- ONLY THEN can you call shortlist_university or lock_university with that UUID
- If a university is not found in search results, tell the user it's not in the database
- NEVER guess or make up a university ID

Example workflow when user says "shortlist Harvard":
1. Call search_universities to find Harvard
2. Get the UUID from the search results (e.g., "uuid-from-results")
3. Call shortlist_university with that actual UUID

CRITICAL - TASK CREATION RULES:
- ALWAYS check the user's profile before creating tasks
- If English Test shows "Score: X", do NOT create tasks about taking IELTS/TOEFL - they already have a score
- If Aptitude Test shows "Score: X", do NOT create tasks about taking GRE/GMAT - they already have a score
- Only create exam tasks if the test status shows "Not taken" or similar
- Focus on tasks the user actually needs based on their current profile state

CRITICAL - WHEN USER ASKS TO CREATE TASKS:
- If user says "create tasks", "make a todo list", "add tasks", etc. - YOU MUST CALL create_task TOOL
- DO NOT just describe tasks - ACTUALLY CREATE THEM by calling the create_task function
- Create each task separately by calling create_task multiple times
- For university-specific tasks, first search for the university to get its UUID, then use that university_id
- After creating tasks, confirm what you created: "I've created X tasks for you: [list them]"

Example when user says "create tasks for Harvard":
1. Call search_universities with name="Harvard" to get the UUID
2. Call create_task for each task (SOP, test prep, application, etc.) with that university_id
3. Confirm: "I've created 4 tasks for your Harvard application"

IMPORTANT:
- When an action makes sense, CALL THE TOOL instead of describing the action.
- Never pretend an action happened unless you actually called a tool.
- If user explicitly asks you to CREATE/ADD/MAKE tasks - you MUST call the create_task tool.

====================
RESPONSE STYLE
====================

- Be conversational, calm, and confident
- Act like a real counsellor, not a search engine
- Prefer clarity over completeness
- Keep responses under 200 words unless absolutely necessary
- End each response with a clear next step for the student

====================
FORMATTING RULES
====================

ALWAYS use markdown formatting:
- Use **bold** for university names, important terms, and emphasis
- Use bullet points (- item) for listing universities and details
- NEVER use numbered lists (1. 2. 3.) - always use bullet points instead

When listing universities, use this format:

- **University Name** (Category) - Brief explanation. Fit: Why it matches. Risks: Any concerns.

- **Second University** (Category) - Brief explanation. Fit: Why it matches. Risks: Any concerns.

- **Third University** (Category) - Brief explanation. Fit: Why it matches. Risks: Any concerns.

"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "shortlist_university",
            "description": "Add a university to user's shortlist with a category",
            "parameters": {
                "type": "object",
                "properties": {
                    "university_id": {"type": "string", "description": "UUID of the university"},
                    "category": {"type": "string", "enum": ["dream", "target", "safe"]},
                    "reasoning": {"type": "string", "description": "Why this category fits"}
                },
                "required": ["university_id", "category", "reasoning"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "lock_university",
            "description": "Lock a shortlisted university for application",
            "parameters": {
                "type": "object",
                "properties": {
                    "university_id": {"type": "string", "description": "UUID of the university"}
                },
                "required": ["university_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Create a to-do task for the user",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "category": {"type": "string", "enum": ["Exams", "Documents", "Applications", "Other"]},
                    "university_id": {"type": "string", "description": "Optional: link to a specific university"}
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_universities",
            "description": "Search for universities matching criteria. Use this to find university UUIDs before shortlisting or locking.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "University name to search for (partial match)"},
                    "country": {"type": "string"},
                    "max_tuition": {"type": "integer"},
                    "program": {"type": "string"}
                }
            }
        }
    }
]


class AICounsellor:
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(
            api_key=settings.openrouter_api_key,
            base_url=OPENROUTER_BASE_URL
        )
        self.supabase = get_supabase()

    def get_user_context(self, user_id: str) -> dict:
        """Get user's profile and current state."""
        # Get profile
        profile = self.supabase.table("profiles").select("*").eq("id", user_id).single().execute()

        # Get user profile
        user_profile = self.supabase.table("user_profiles").select("*").eq("user_id", user_id).single().execute()

        # Get shortlist
        shortlist = self.supabase.table("shortlisted_universities").select(
            "*, university:universities(name, country, ranking)"
        ).eq("user_id", user_id).execute()

        return {
            "profile": profile.data,
            "user_profile": user_profile.data,
            "shortlist": shortlist.data
        }

    def format_context(self, context: dict) -> tuple[str, str, int]:
        """Format user context for the prompt."""
        up = context.get("user_profile") or {}
        profile = context.get("profile") or {}
        shortlist = context.get("shortlist") or []

        # Format test scores
        english_test = up.get('english_test_type', 'None')
        english_score = up.get('english_test_score')
        english_status = f"Score: {english_score}" if english_score else up.get('english_test_status', 'Not taken')

        aptitude_test = up.get('aptitude_test_type', 'None')
        aptitude_score = up.get('aptitude_test_score')
        aptitude_status = f"Score: {aptitude_score}" if aptitude_score else up.get('aptitude_test_status', 'Not taken')

        user_profile_str = f"""
- Education: {up.get('education_level', 'N/A')} in {up.get('degree', 'N/A')}
- GPA: {up.get('gpa', 'N/A')}/{up.get('gpa_scale', 4.0)}
- Target: {up.get('intended_degree', 'N/A')} in {up.get('field_of_study', 'N/A')}
- Countries: {', '.join(up.get('preferred_countries', []) or ['N/A'])}
- Budget: Up to ${up.get('budget_max', 50000):,}/year
- English Test: {english_test} - {english_status}
- Aptitude Test: {aptitude_test} - {aptitude_status}
- SOP: {up.get('sop_status', 'N/A')}
"""

        shortlist_str = "\n".join([
            f"- {s['university']['name']} ({s['category']}, {'Locked' if s['is_locked'] else 'Not locked'})"
            for s in shortlist
        ]) if shortlist else "None yet"

        return user_profile_str, shortlist_str, profile.get("current_stage", 1)

    def execute_function(self, user_id: str, name: str, args: dict) -> str:
        """Execute a function call and return result."""
        try:
            if name == "shortlist_university":
                self.supabase.table("shortlisted_universities").upsert({
                    "user_id": user_id,
                    "university_id": args["university_id"],
                    "category": args["category"],
                    "ai_reasoning": args.get("reasoning")
                }, on_conflict="user_id,university_id").execute()
                return f"Added to shortlist as {args['category']}"

            elif name == "lock_university":
                university_id = args["university_id"]

                # Lock the university
                self.supabase.table("shortlisted_universities").update({
                    "is_locked": True
                }).eq("user_id", user_id).eq("university_id", university_id).execute()

                # Get university name for task titles
                uni_result = self.supabase.table("universities").select("name").eq("id", university_id).single().execute()
                uni_name = uni_result.data.get("name", "University") if uni_result.data else "University"

                # Auto-create standard application tasks
                standard_tasks = [
                    {
                        "user_id": user_id,
                        "university_id": university_id,
                        "title": f"Complete application for {uni_name}",
                        "description": f"Fill out and submit the online application form for {uni_name}. Check their official admissions portal for deadlines.",
                        "category": "Applications"
                    },
                    {
                        "user_id": user_id,
                        "university_id": university_id,
                        "title": f"Gather documents for {uni_name}",
                        "description": f"Collect all required documents: transcripts, test scores, passport copy, financial documents, etc.",
                        "category": "Documents"
                    },
                    {
                        "user_id": user_id,
                        "university_id": university_id,
                        "title": f"Write SOP for {uni_name}",
                        "description": f"Draft and finalize your Statement of Purpose tailored to {uni_name}'s program requirements.",
                        "category": "Documents"
                    },
                    {
                        "user_id": user_id,
                        "university_id": university_id,
                        "title": f"Request recommendation letters for {uni_name}",
                        "description": f"Contact your recommenders and provide them with the submission details for {uni_name}.",
                        "category": "Documents"
                    }
                ]

                for task in standard_tasks:
                    self.supabase.table("tasks").insert(task).execute()

                return f"University locked for application. Created 4 application tasks for {uni_name}."

            elif name == "create_task":
                self.supabase.table("tasks").insert({
                    "user_id": user_id,
                    "title": args["title"],
                    "description": args.get("description"),
                    "category": args.get("category", "Other"),
                    "university_id": args.get("university_id")
                }).execute()
                return f"Created task: {args['title']}"

            elif name == "search_universities":
                query = self.supabase.table("universities").select("id, name, country, ranking, tuition_max, acceptance_rate")

                if args.get("name"):
                    query = query.ilike("name", f"%{args['name']}%")
                if args.get("country"):
                    query = query.eq("country", args["country"])
                if args.get("max_tuition"):
                    query = query.lte("tuition_max", args["max_tuition"])

                result = query.limit(5).execute()
                universities = result.data

                if not universities:
                    return "No universities found matching criteria. The university may not be in our database yet."

                return json.dumps(universities, indent=2)

            return "Unknown function"

        except Exception as e:
            return f"Error: {str(e)}"

    def get_conversation_history(self, conversation_id: str, limit: int = 10) -> list:
        """Load recent messages from a conversation."""
        if not conversation_id:
            return []

        try:
            result = self.supabase.table("chat_messages").select(
                "role, content"
            ).eq("conversation_id", conversation_id).in_(
                "role", ["user", "assistant"]
            ).order(
                "created_at", desc=True
            ).limit(limit).execute()

            # Reverse to get chronological order (oldest first)
            messages = result.data[::-1] if result.data else []
            # Only include messages with actual content
            return [
                {"role": m["role"], "content": m["content"]}
                for m in messages
                if m.get("content")
            ]
        except Exception:
            return []

    def chat(self, user_id: str, message: str, conversation_id: str = None) -> dict:
        """Process a chat message and return response."""
        # Get context
        context = self.get_user_context(user_id)
        user_profile_str, shortlist_str, stage = self.format_context(context)

        # Build system prompt
        system_prompt = SYSTEM_PROMPT.format(
            user_profile=user_profile_str,
            stage=stage,
            shortlist=shortlist_str
        )

        # Start with system prompt
        messages = [{"role": "system", "content": system_prompt}]

        # Load conversation history (last 10 messages, excluding the current one being sent)
        history = self.get_conversation_history(conversation_id, limit=10)
        if history:
            messages.extend(history)

        # Add current user message
        messages.append({"role": "user", "content": message})

        # Call OpenRouter with GPT-4o - support multiple rounds of tool calls
        actions = []
        max_rounds = 5  # Prevent infinite loops

        for _ in range(max_rounds):
            response = self.client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto"
            )

            assistant_message = response.choices[0].message

            # If no tool calls, we're done
            if not assistant_message.tool_calls:
                return {
                    "response": assistant_message.content,
                    "actions": actions
                }

            # Process tool calls
            tool_results = []
            for tool_call in assistant_message.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)

                result = self.execute_function(user_id, func_name, func_args)
                actions.append({
                    "type": func_name,
                    "args": func_args,
                    "result": result
                })
                tool_results.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result
                })

            # Add assistant message and tool results for next round
            messages.append(assistant_message)
            messages.extend(tool_results)

        # If we hit max rounds, get a final response without tools
        final_response = self.client.chat.completions.create(
            model=MODEL,
            messages=messages
        )

        return {
            "response": final_response.choices[0].message.content,
            "actions": actions
        }
