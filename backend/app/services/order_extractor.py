import json
from pathlib import Path

from app.services.llm_service import get_llm
from app.schemas.measurement_schema import TextileMeasurement


PROMPT_PATH = Path("app/prompts/textile_order_prompt.txt")


def load_prompt():
    with open(PROMPT_PATH, "r") as file:
        return file.read()


def extract_textile_order(message: str):
    """
    Uses Gemini LLM to extract textile order information
    from customer message.
    """

    llm = get_llm()
    prompt_template = load_prompt()

    full_prompt = f"{prompt_template}\n\nCustomer Message:\n{message}"

    response = llm.invoke(full_prompt)

    raw_output = response.content.strip()

    # remove markdown JSON fences if present (was causing problem)
    if raw_output.startswith("```"):
        raw_output = raw_output.split("```")[1]

    if raw_output.startswith("json"):
        raw_output = raw_output[4:].strip()
    
    
    try:
        parsed_json = json.loads(raw_output)

        items = [
            TextileMeasurement(**item)
            for item in parsed_json["items"]
        ]

        return items

    except Exception as e:
        raise ValueError(f"Failed to parse LLM output: {e}")
