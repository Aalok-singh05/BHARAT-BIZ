
import json
import os
import google.generativeai as genai
from pathlib import Path
from app.schemas.measurement_schema import TextileMeasurement

# Reuse existing text prompt as it works for general order extraction info
PROMPT_PATH = Path("app/prompts/textile_order_prompt.txt")

def load_prompt():
    with open(PROMPT_PATH, "r") as file:
        return file.read()

def get_gemini_audio_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found")
    
    genai.configure(api_key=api_key)
    # Gemini 2.5 Flash is multimodal and handles audio natively
    return genai.GenerativeModel('gemini-2.5-flash')

def extract_order_from_voice(audio_bytes: bytes, mime_type: str) -> list[TextileMeasurement]:
    """
    Extracts textile order items from a voice note using Gemini Audio.
    """
    model = get_gemini_audio_model()
    prompt_template = load_prompt()
    
    prompt_parts = [
        "Listen to this customer voice note (Hindi/English/Hinglish) and extract the textile order items.",
        prompt_template,
        {
            "mime_type": mime_type,
            "data": audio_bytes
        }
    ]
    
    try:
        # Generate content
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
        print(f"Gemini Audio extraction failed: {e}")
        raise ValueError(f"Failed to process voice order: {str(e)}")
