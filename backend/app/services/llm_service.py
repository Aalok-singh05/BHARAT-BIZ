import os 
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

def get_llm():
    '''
    Returns configured Gemini LLM instance using LangChain.
    '''

    api_key=os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    

    llm= ChatGoogleGenerativeAI(
        model='gemini-2.5-flash-lite',
        temperature=0,
        google_api_key=api_key
    )

    return llm