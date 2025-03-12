import os
import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv

# Variables de entorno
load_dotenv()

AZURE_SPEECH_KEY_1 = os.getenv("AZURE_SPEECH_KEY_1")
AZURE_SPEECH_KEY_2 = os.getenv("AZURE_SPEECH_KEY_2")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")

def text_to_speech(text: str, output_audio_path: str):
    speech_config = speechsdk.SpeechConfig(
        subscription=AZURE_SPEECH_KEY_1 or AZURE_SPEECH_KEY_2,
        region=AZURE_SPEECH_REGION
    )

    audio_config = speechsdk.audio.AudioOutputConfig(filename=output_audio_path)
    synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)

    synthesizer.speak_text_async(text).get()

    return output_audio_path