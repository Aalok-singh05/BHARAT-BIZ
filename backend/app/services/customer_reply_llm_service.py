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
        [f"- {item.material_name}" for item in session_items]
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

    parsed = json.loads(raw_output)

    return parsed
