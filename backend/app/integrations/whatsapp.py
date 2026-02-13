import os
import requests
import json

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
API_VERSION = "v18.0"
BASE_URL = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}"

def send_whatsapp_message(phone: str, message: str):
    """
    Send a basic text message.
    """
    url = f"{BASE_URL}/messages"

    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message},
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print("WhatsApp Text Sent:", response.json())
        return response.json()
    except Exception as e:
        print(f"Error sending WhatsApp text: {e}")
        if hasattr(e, 'response') and e.response:
             print(e.response.text)
        return {"error": str(e)}

def upload_media(file_path: str, mime_type: str = "application/pdf"):
    """
    Uploads a file to WhatsApp Media API.
    Returns the Media ID.
    """
    url = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/media"
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}"
    }
    
    try:
        with open(file_path, 'rb') as f:
            files = {
                'file': (os.path.basename(file_path), f, mime_type),
                'type': (None, mime_type),
                'messaging_product': (None, "whatsapp")
            }
            response = requests.post(url, headers=headers, files=files)
            response.raise_for_status()
            data = response.json()
            print("Media Uploaded:", data)
            return data.get("id")
    except Exception as e:
        print(f"Error uploading media: {e}")
        if hasattr(e, 'response') and e.response:
             print(e.response.text)
        return None

def send_document_message(phone: str, media_id: str, filename: str, caption: str = ""):
    """
    Send a document (PDF) using a Media ID.
    """
    url = f"{BASE_URL}/messages"

    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "document",
        "document": {
            "id": media_id,
            "filename": filename,
            "caption": caption
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print("WhatsApp Document Sent:", response.json())
        return response.json()
    except Exception as e:
        print(f"Error sending WhatsApp document: {e}")
        return {"error": str(e)}
