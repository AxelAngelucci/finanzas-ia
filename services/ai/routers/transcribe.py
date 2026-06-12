import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from openai import AsyncOpenAI

router = APIRouter()
client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

SUPPORTED_TYPES = {"audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/webm", "audio/x-m4a"}


class TranscribeResponse(BaseModel):
    text: str
    language: str


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    content_type = file.content_type or "audio/mpeg"
    if content_type not in SUPPORTED_TYPES and not content_type.startswith("audio/"):
        raise HTTPException(400, f"Tipo de archivo no soportado: {content_type}")

    data = await file.read()
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(400, "El audio no puede superar 25MB")

    ext = _ext_from_mime(content_type)

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            result = await client.audio.transcriptions.create(
                model="whisper-1",
                file=(file.filename or f"audio{ext}", f, content_type),
                language="es",
                response_format="verbose_json",
            )
        return TranscribeResponse(
            text=result.text.strip(),
            language=result.language or "es",
        )
    finally:
        import os as _os
        _os.unlink(tmp_path)


def _ext_from_mime(mime: str) -> str:
    mapping = {
        "audio/mpeg": ".mp3",
        "audio/mp4": ".mp4",
        "audio/ogg": ".ogg",
        "audio/wav": ".wav",
        "audio/webm": ".webm",
        "audio/x-m4a": ".m4a",
    }
    return mapping.get(mime, ".mp3")
