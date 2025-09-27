from fastapi import APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect
import whisper
import tempfile
import numpy as np
import os
import shutil

import certifi

router = APIRouter()

# Set SSL_CERT_FILE to use certifi's certificate bundle
os.environ["SSL_CERT_FILE"] = certifi.where()
model = whisper.load_model("tiny")

AUDIO_CACHE_DIR = "audio_cache"
os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)

@router.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    file_path = os.path.join(AUDIO_CACHE_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"/audio/{file.filename}"}

@router.websocket("/ws/speech-to-text")
async def speech_to_text(websocket: WebSocket):
    await websocket.accept()
    audio_data = []
    try:
        while True:
            data = await websocket.receive_bytes()
            audio_data.append(data)
    except WebSocketDisconnect:
        # Once the client disconnects, process the audio
        combined_audio = b"".join(audio_data)
        
        # Convert byte data to a NumPy array
        audio_np = np.frombuffer(combined_audio, dtype=np.int16).astype(np.float32) / 32768.0

        # Use a temporary file to process with Whisper
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmpfile:
            # Whisper expects a file path, so we write the NumPy array to a temporary WAV file.
            # Note: This requires scipy.io.wavfile.write, which is a dependency of Whisper.
            from scipy.io.wavfile import write as write_wav
            write_wav(tmpfile.name, 16000, audio_np) # Assuming 16kHz sample rate
            
            # Transcribe the audio file
            result = model.transcribe(tmpfile.name)
            await websocket.send_text(result["text"])
        print("Client disconnected")