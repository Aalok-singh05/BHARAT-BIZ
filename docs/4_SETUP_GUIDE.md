# 🚀 Deployment & Setup Guide

Technical instructions for running Bharat-Biz locally or on a server.

---

## 📋 Prerequisites
- **Docker & Docker Compose** (Recommended)
- **Python 3.10+** (If running manually)
- **Node.js 18+** (If running frontend manually)
- **Supabase/PostgreSQL** Database

---

## 🐳 Docker Quick Start (Recommended)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-repo/BHARAT-BIZ.git
    cd BHARAT-BIZ
    ```

2.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    # AI Keys
    GEMINI_API_KEY=your_key_here
    
    # Database
    DATABASE_URL=postgresql://user:pass@host:5432/db
    
    # WhatsApp API
    WHATSAPP_TOKEN=your_meta_token
    WHATSAPP_PHONE_ID=your_phone_id
    VERIFY_TOKEN=your_webhook_verify_token
    ```

3.  **Run with Docker Compose**
    ```bash
    docker-compose up --build
    ```
    
    - **Backend API**: `http://localhost:8000`
    - **Frontend Dashboard**: `http://localhost:3000`

---

## 🛠️ Manual Setup

### Backend (Python/FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Webhook Configuration
For the WhatsApp bot to work locally, you need to expose your local server to the internet using `ngrok`.

```bash
ngrok http 8000
```
Copy the forwarding URL (e.g., `https://xyz.ngrok-free.app`) and set it as your **Callback URL** in the Meta Developer Portal:
`https://xyz.ngrok-free.app/webhook`

---

[⬅️ Back to Showcase](../PROJECT_SHOWCASE.md)
