import os
import requests
from dotenv import load_dotenv

# Variables de entorno
load_dotenv()

AZURE_TRANSLATOR_KEY_1 = os.getenv("AZURE_TRANSLATOR_KEY_1")
AZURE_TRANSLATOR_KEY_2 = os.getenv("AZURE_TRANSLATOR_KEY_2")
AZURE_TRANSLATOR_ENDPOINT = os.getenv("AZURE_TRANSLATOR_ENDPOINT")
AZURE_TRANSLATOR_REGION = os.getenv("AZURE_TRANSLATOR_REGION")


def translate_text(text: str, target_language: str) -> str:
    if not text:
        return "No hay texto para traducir."

    url = f"{AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0"

    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY_1 or AZURE_TRANSLATOR_KEY_2,
        "Ocp-Apim-Subscription-Region": AZURE_TRANSLATOR_REGION,
        "Content-Type": "application/json"
    }

    params = {"to": target_language}
    body = [{"text": text}]

    response = requests.post(url, headers=headers, params=params, json=body)

    if response.status_code == 200:
        return response.json()[0]["translations"][0]["text"]
    else:
        return f"Error en la traducción: {response.text}"