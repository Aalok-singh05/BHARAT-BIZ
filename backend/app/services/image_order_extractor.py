
import json
import os
import google.generativeai as genai
from pathlib import Path
from app.schemas.measurement_schema import TextileMeasurement

PROMPT_PATH = Path("app/prompts/image_order_prompt.txt")

def load_prompt():
    with open(PROMPT_PATH, "r") as file:
        return file.read()

def get_gemini_vision_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found")
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.5-flash')

def extract_order_from_image(image_bytes: bytes, mime_type: str, caption: str | None = None) -> list[TextileMeasurement]:
    """
    Extracts textile order items from an image using Gemini Vision.
    """
    model = get_gemini_vision_model()
    prompt_template = load_prompt()
    
    prompt_parts = [prompt_template]
    
    if caption:
        prompt_parts.append(f"\n\nUser Caption/Note: {caption}")
        
    prompt_parts.append({
        "mime_type": mime_type,
        "data": image_bytes
    })
    
    try:
        response = model.generate_content(prompt_parts)
        raw_output = response.text.strip()
        
        # Cleanup Markdown formatting
        if raw_output.startswith("```"):
            raw_output = raw_output.split("```")[1]
        if raw_output.startswith("json"):
            raw_output = raw_output[4:].strip()
            
        parsed_json = json.loads(raw_output)
        
        items = [
            TextileMeasurement(**item) 
            for item in parsed_json.get("items", [])
        ]
        
        return items
        
    except Exception as e:
        print(f"Gemini Vision extraction failed: {e}")
        raise ValueError(f"Failed to process image order: {str(e)}")
