import os
import requests
from dotenv import load_dotenv

load_dotenv()

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
OWNER_PHONE = os.getenv("OWNER_PHONE_NUMBER")

print(f"Token: {WHATSAPP_TOKEN[:5]}... (Length: {len(WHATSAPP_TOKEN) if WHATSAPP_TOKEN else 0})")
print(f"Phone Number ID: {PHONE_NUMBER_ID}")
print(f"Owner Phone: {OWNER_PHONE}")

if not WHATSAPP_TOKEN or not PHONE_NUMBER_ID or not OWNER_PHONE:
    print("❌ Missing environment variables! Check .env file.")
    exit(1)

url = f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages"
headers = {
    "Authorization": f"Bearer {WHATSAPP_TOKEN}",
    "Content-Type": "application/json",
}
payload = {
    "messaging_product": "whatsapp",
    "to": OWNER_PHONE,
    "type": "text",
    "text": {"body": "🔔 This is a test message from your Bharat-Biz Backend!"},
}

print("\nAttempting to send test message to Owner...")
try:
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ Success! Your WhatsApp configuration is working.")
    else:
        print("\n❌ Failed! Check the error message above.")
except Exception as e:
    print(f"\n❌ Exception: {e}")
