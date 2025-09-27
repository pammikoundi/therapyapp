from fastapi import UploadFile, File
from app.core.firebase import bucket

@router.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    blob = bucket.blob(f"audio/{file.filename}")
    blob.upload_from_file(file.file, content_type=file.content_type)
    return {"url": blob.public_url}
