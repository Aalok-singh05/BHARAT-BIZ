"""
Intent classifier for incoming WhatsApp messages.
Determines if a message is an order, greeting, help request, or general query.
Only called when there is NO active order session and NO media attached.
"""

import json
from pathlib import Path
from app.services.llm_service import get_llm

PROMPT_PATH = Path("app/prompts/intent_prompt.txt")


def load_prompt():
    with open(PROMPT_PATH, "r") as file:
        return file.read()


def classify_message_intent(message: str) -> dict:
    """
    Classifies the intent of an incoming message.
    
    Returns:
        dict with keys:
        - intent: "order" | "greeting" | "help" | "general_query" | "unclear"
        - reply: suggested reply text (for non-order intents)
    """
    llm = get_llm()
    prompt_template = load_prompt()

    full_prompt = f"{prompt_template}\n\nCustomer Message:\n{message}"

    try:
        response = llm.invoke(full_prompt)
        raw_output = response.content.strip()

        # Clean markdown fences
        if raw_output.startswith("```"):
            raw_output = raw_output.split("```")[1]
        if raw_output.startswith("json"):
            raw_output = raw_output[4:].strip()

        parsed = json.loads(raw_output)
        return parsed

    except Exception as e:
        print(f"Intent classification failed: {e}")
        return {"intent": "unclear", "reply": ""}
