import os
import json
from dotenv import load_dotenv
from google import genai

# ==========================================
# LOAD ENV
# ==========================================
load_dotenv(
    dotenv_path=os.path.join(
        os.path.dirname(os.path.dirname(__file__)), ".env"
    )
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in environment variables")

# ==========================================
# INIT GEMINI CLIENT (CLIENT-BASED, CONSISTENT)
# ==========================================
client = genai.Client(api_key=GEMINI_API_KEY)

# ==========================================
# PROMPT TEMPLATE
# ==========================================
SYSTEM_PROMPT_TEMPLATE = """
You are an expert regional planner and data analyst for Indonesian villages.
Analyze the provided village data and generate a comprehensive insight report in valid JSON format.

Input Data:
{village_data}

Output JSON Schema:
{{
  "swot": {{
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  }},
  "persona": "string",
  "local_hero": "string",
  "recommendations": ["string"]
}}
"""

# ==========================================
# MAIN FUNCTION
# ==========================================
def generate_village_insights(village_data: dict) -> dict:
    """
    Generates AI insights for a village using Gemini (client-based API).
    """

    prompt = SYSTEM_PROMPT_TEMPLATE.format(
        village_data=json.dumps(village_data, indent=2, ensure_ascii=False)
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 4096,
                "response_mime_type": "application/json",
            },
        )

        # Gemini client returns unified text
        raw_text = response.text.strip()

        return json.loads(raw_text)

    except Exception as e:
        # ⚠️ jangan silent fail di production nanti
        print(f"[AI ERROR] Failed to generate village insights: {e}")

        return {
            "swot": {
                "strengths": [],
                "weaknesses": [],
                "opportunities": [],
                "threats": [],
            },
            "persona": "Unknown",
            "local_hero": "Analysis failed.",
            "recommendations": [],
        }
