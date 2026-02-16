import json
from pathlib import Path
from typing import List

from app.services.llm_service import get_llm
from app.schemas.measurement_schema import TextileMeasurement

PROMPT_PATH = Path("app/prompts/customer_reply_prompt.txt")


def load_prompt():
    with open(PROMPT_PATH, "r") as file:
        return file.read()


def classify_customer_reply(
    message: str,
    session_items: List[TextileMeasurement]):

    llm = get_llm()
    prompt_template = load_prompt()

    item_list = "\n".join(
        [
            f"- {item.material_name} ({item.color})"
            if item.color
            else f"- {item.material_name} (no color specified)"
            for item in session_items
        ]
    )

    full_prompt = f"""
{prompt_template}

Pending Order Items:
{item_list}

Customer Message:
{message}
"""

    response = llm.invoke(full_prompt)

    raw_output = response.content.strip()

    # Remove markdown fences
    if raw_output.startswith("```"):
        raw_output = raw_output.split("```")[1]

    if raw_output.startswith("json"):
        raw_output = raw_output[4:].strip()

    try:
        parsed = json.loads(raw_output)
    except json.JSONDecodeError:
        # Retry once with stricter instruction
        retry_prompt = (
            f"The following text is NOT valid JSON. Extract ONLY the JSON object from it:\n\n{raw_output}"
        )
        retry_response = llm.invoke(retry_prompt)
        retry_output = retry_response.content.strip()

        if retry_output.startswith("```"):
            retry_output = retry_output.split("```")[1]
        if retry_output.startswith("json"):
            retry_output = retry_output[4:].strip()

        try:
            parsed = json.loads(retry_output)
        except json.JSONDecodeError:
            # Safe fallback — no_change for all items
            print(f"Customer reply LLM parse failed. Raw: {raw_output}")
            parsed = {
                "item_decisions": [
                    {"material": item.material_name, "decision": "no_change"}
                    for item in session_items
                ],
                "language": "hinglish"
            }

    return parsed

FINAL_PROMPT_PATH = Path("app/prompts/final_confirmation_prompt.txt")

def classify_final_confirmation_intent(message: str):

    llm = get_llm()

    with open(FINAL_PROMPT_PATH, "r") as file:
        prompt_template = file.read()

    full_prompt = f"""
{prompt_template}

Customer Message:
{message}
"""

    response = llm.invoke(full_prompt)

    raw_output = response.content.strip()

    if raw_output.startswith("```"):
        raw_output = raw_output.split("```")[1]

    if raw_output.startswith("json"):
        raw_output = raw_output[4:].strip()

    try:
        parsed = json.loads(raw_output)
    except json.JSONDecodeError:
        # Retry once
        retry_prompt = (
            f"The following text is NOT valid JSON. Extract ONLY the JSON object from it:\n\n{raw_output}"
        )
        retry_response = llm.invoke(retry_prompt)
        retry_output = retry_response.content.strip()

        if retry_output.startswith("```"):
            retry_output = retry_output.split("```")[1]
        if retry_output.startswith("json"):
            retry_output = retry_output[4:].strip()

        try:
            parsed = json.loads(retry_output)
        except json.JSONDecodeError:
            print(f"Final confirmation LLM parse failed. Raw: {raw_output}")
            parsed = {"global_intent": "unclear"}

    return parsed.get("global_intent", "unclear")

