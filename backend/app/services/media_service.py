
import os
import requests
from typing import Tuple


def download_whatsapp_media(media_id: str) -> Tuple[bytes, str]:
    """
    Downloads media from WhatsApp Cloud API.
    Returns (file_bytes, mime_type).
    """
    WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
    if not WHATSAPP_TOKEN:
        raise ValueError("WHATSAPP_TOKEN not found in environment")

    # 1. Get Media URL
    url = f"https://graph.facebook.com/v18.0/{media_id}"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        media_url = data.get("url")
        mime_type = data.get("mime_type")
        
        if not media_url:
            raise ValueError("Media URL not found in WhatsApp response")

        # 2. Download File Bytes
        media_response = requests.get(media_url, headers=headers)
        media_response.raise_for_status()
        
        return media_response.content, mime_type

    except Exception as e:
        print(f"Error downloading WhatsApp media {media_id}: {e}")
        raise e
