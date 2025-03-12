from fastapi import FastAPI, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
import os
from services.azure_speech import speech_to_text
from services.azure_translate import translate_text
from services.azure_text_to_speech import text_to_speech

app = FastAPI()

# Carpetas
UPLOAD_DIR = "uploads/"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

# Plantillas
templates = Jinja2Templates(directory="templates")

# Interfaz web
@app.get("/uploads/{filename}")
async def get_file(filename: str):
    return FileResponse(path=os.path.join(UPLOAD_DIR, filename))

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Backend
@app.post("/translate-audio/")
async def translate_audio(file: UploadFile = File(...), original_language: str = Form(...), target_language: str = Form(...)):

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    # Convertir audio a texto
    texto_recognizado = speech_to_text(file_path, original_language)

    # Traducir el texto al idioma
    texto_traducido = translate_text(texto_recognizado, target_language)

    # Convertir el texto traducido en un audio
    translated_filename = f"translated_{file.filename}"
    output_audio_path = os.path.join(UPLOAD_DIR, translated_filename)
    text_to_speech(texto_traducido, output_audio_path)

    return {
        "texto_original": texto_recognizado,
        "texto_traducido": texto_traducido,
        "audio_traducido": f"/uploads/{translated_filename}"
    }