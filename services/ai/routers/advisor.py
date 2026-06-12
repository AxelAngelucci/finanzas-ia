import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from openai import AsyncOpenAI

router = APIRouter()
client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")

TONE_INSTRUCTIONS = {
    "amigable": "Respondé de forma cálida y cercana, con algún emoji ocasional. Sé conciso (máximo 3 oraciones).",
    "formal": "Respondé de forma profesional y sin emojis. Máximo 3 oraciones.",
    "estricto": "Respondé de forma muy directa y breve. Solo lo esencial, sin rodeos.",
}


class ChatMessage(BaseModel):
    role: str
    content: str


class FinancialContext(BaseModel):
    income_monthly: int = 0
    month_income: int = 0
    month_expenses: int = 0
    balance: int = 0
    budgets: List[Dict[str, Any]] = []
    goals: List[Dict[str, Any]] = []


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    userId: str
    tone: str = "amigable"
    context: FinancialContext


class ChatResponse(BaseModel):
    reply: str
    action: Optional[str] = None
    text: Optional[str] = None
    widget_type: Optional[str] = None


def fmt_ars(centavos: int) -> str:
    return f"${centavos / 100:,.0f}".replace(",", ".")


@router.post("/chat", response_model=ChatResponse)
async def chat_advisor(req: ChatRequest):
    ctx = req.context
    tone_hint = TONE_INSTRUCTIONS.get(req.tone, TONE_INSTRUCTIONS["amigable"])

    budget_summary = ""
    if ctx.budgets:
        budget_summary = "\nPresupuestos activos:\n" + "\n".join(
            f"  - {b['category']}: límite {fmt_ars(b['limit'])}" for b in ctx.budgets
        )

    goal_summary = ""
    if ctx.goals:
        goal_summary = "\nMetas de ahorro:\n" + "\n".join(
            f"  - {g['name']}: {fmt_ars(g['saved'])}/{fmt_ars(g['target'])}" for g in ctx.goals
        )

    system = f"""Sos un asesor financiero personal argentino. Ayudás al usuario a entender y mejorar sus finanzas.

CONTEXTO FINANCIERO DEL USUARIO:
- Ingreso mensual base: {fmt_ars(ctx.income_monthly)}
- Ingresos del mes: {fmt_ars(ctx.month_income)}
- Gastos del mes: {fmt_ars(ctx.month_expenses)}
- Balance disponible: {fmt_ars(ctx.balance)}
{budget_summary}
{goal_summary}

COMPORTAMIENTO:
1. Si el usuario quiere REGISTRAR un gasto/ingreso, devolvé JSON: {{"action": "parse", "text": "texto original"}}
2. Si hace una CONSULTA sobre sus finanzas, respondé con los datos de contexto.
3. {tone_hint}
4. Nunca inventés datos. Si no tenés la información, decilo.
5. Para preguntas sobre "¿cuánto puedo gastar hoy?", calculá: balance / días restantes del mes.

FORMATO RESPUESTA NORMAL:
{{"reply": "tu respuesta", "action": null}}"""

    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.message})

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system}, *messages],
        temperature=0.5,
        max_tokens=300,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or "{}"

    import json
    try:
        data = json.loads(content)
    except Exception:
        data = {"reply": content}

    return ChatResponse(
        reply=data.get("reply", ""),
        action=data.get("action"),
        text=data.get("text"),
        widget_type=data.get("widget_type"),
    )
