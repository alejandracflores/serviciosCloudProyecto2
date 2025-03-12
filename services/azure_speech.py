import os
import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv

# Variables de entorno
load_dotenv()

AZURE_SPEECH_KEY_1 = os.getenv("AZURE_SPEECH_KEY_1")
AZURE_SPEECH_KEY_2 = os.getenv("AZURE_SPEECH_KEY_2")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")

def speech_to_text(audio_path: str, original_language: str) -> str:
    speech_config = speechsdk.SpeechConfig(
        subscription=AZURE_SPEECH_KEY_1 or AZURE_SPEECH_KEY_2,
        region=AZURE_SPEECH_REGION
    )

    # Idioma orginal
    speech_config.speech_recognition_language = original_language

    audio_config = speechsdk.audio.AudioConfig(filename=audio_path)
    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    print("Procesando audio...")
    result = recognizer.recognize_once()

    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        return result.text
    else:
        return "No se pudo reconocer el audio."
