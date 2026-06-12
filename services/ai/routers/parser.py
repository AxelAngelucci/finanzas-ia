import os
import json
from datetime import date
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from openai import AsyncOpenAI

router = APIRouter()
client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")

CATEGORIES = [
    "Alimentacion", "Transporte", "Alquiler", "Salud", "Entretenimiento",
    "Trabajo", "Tecnologia", "Ropa", "Educacion", "Ahorro", "Sueldo", "Freelance", "Otros"
]

TONE_INSTRUCTIONS = {
    "amigable": "Usá emojis, tono cercano y cálido. Ejemplos: ✅ 🍕 💸",
    "formal": "Tono profesional y conciso. Sin emojis.",
    "estricto": "Muy directo y breve. Solo los datos necesarios.",
}

PARSE_TOOL = {
    "type": "function",
    "function": {
        "name": "save_transactions",
        "description": "Guarda una o más transacciones financieras extraídas del texto.",
        "parameters": {
            "type": "object",
            "properties": {
                "transactions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "amount": {"type": "integer", "description": "Monto en ARS centavos (sin punto decimal). 45000 ARS = 4500000"},
                            "type": {"type": "string", "enum": ["expense", "income", "saving"]},
                            "description": {"type": "string", "maxLength": 120},
                            "category": {"type": "string", "enum": CATEGORIES},
                            "date": {"type": "string", "format": "date", "description": "YYYY-MM-DD"},
                            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                        },
                        "required": ["amount", "type", "description", "category", "date", "confidence"],
                    },
                },
                "reply": {"type": "string", "description": "Mensaje de confirmación para el usuario."},
                "ambiguous": {"type": "boolean"},
                "clarification_question": {"type": "string"},
            },
            "required": ["transactions", "reply", "ambiguous"],
        },
    },
}


class ParseRequest(BaseModel):
    text: str
    userId: str
    timezone: str = "America/Argentina/Buenos_Aires"
    channel: str = "app"
    tone: str = "amigable"


class ParseResponse(BaseModel):
    parsed: bool
    transactions: List[dict] = []
    reply: str
    ambiguous: bool = False
    clarification_question: Optional[str] = None


@router.post("/parse", response_model=ParseResponse)
async def parse_transaction(req: ParseRequest):
    today = date.today().isoformat()
    tone_hint = TONE_INSTRUCTIONS.get(req.tone, TONE_INSTRUCTIONS["amigable"])

    system = f"""Sos un asistente financiero argentino experto. Hoy es {today}.

SLANG ARGENTINO:
- "lucas" = ×1.000 (45 lucas = 45.000 ARS)
- "palo" = 1.000.000 ARS
- "mangos" / "pesos" = valor literal

REGLAS:
1. Almacenás montos en CENTAVOS: 45.000 ARS = 4.500.000 centavos
2. Detectá tipo: gasto (compré, gasté, pagué, salí) | ingreso (cobré, me pagaron, entró, sueldo) | ahorro
3. Categorías disponibles: {", ".join(CATEGORIES)}
4. Si hay múltiples transacciones en un solo texto, incluílas todas.
5. Si el monto NO está claro, devolvé ambiguous=true y no guardes transacción.
6. Respondé SIEMPRE con la función save_transactions.
7. Tono de respuesta: {tone_hint}"""

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": req.text},
        ],
        tools=[PARSE_TOOL],
        tool_choice={"type": "function", "function": {"name": "save_transactions"}},
        temperature=0.1,
    )

    call = response.choices[0].message.tool_calls[0]
    args = json.loads(call.function.arguments)

    if args.get("ambiguous") or not args.get("transactions"):
        return ParseResponse(
            parsed=False,
            reply=args.get("clarification_question") or args.get("reply") or "¿Podés darme más detalles sobre el monto?",
            ambiguous=True,
            clarification_question=args.get("clarification_question"),
        )

    return ParseResponse(
        parsed=True,
        transactions=args["transactions"],
        reply=args["reply"],
        ambiguous=False,
    )
