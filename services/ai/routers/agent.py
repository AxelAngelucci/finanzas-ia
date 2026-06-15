import os
import json
import asyncio
import httpx
from datetime import date
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from openai import AsyncOpenAI

from tools import ALL_TOOLS, EXECUTORS

router = APIRouter()
client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"].strip())
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")
MAX_ITERATIONS = 6

APP_DOWNLOAD_URL = os.environ.get("APP_DOWNLOAD_URL", "https://finanzias-ia.app/download")

APP_INFO_BLOCK = f"""
APP MÓVIL — Existe una app móvil de Finanzas IA (iOS y Android) con gráficos, historial visual, presupuestos en tiempo real, metas con barras de progreso y recap mensual compartible. Link: {APP_DOWNLOAD_URL}
Si el usuario pregunta si hay una app, si puede ver algo en pantalla, o si existe otra forma de usar el servicio → respondé que SÍ existe la app y compartí el link.
"""

APP_CTA_BLOCK_WA = f"""
INVITACIÓN A LA APP — El usuario todavía no descargó la app. En ciertos momentos clave, al FINAL de tu respuesta agregá una invitación breve y natural. La idea es mostrar valor genuino, nunca parecer publicidad.

MOMENTOS DONDE SÍ INVITAR (elegí el más apropiado, nunca fuerces todos):
• Después de un resumen mensual o reporte → la app tiene gráficos, tendencias y desglose visual
• Después de crear/listar metas → en la app se ve el progreso con barras y proyecciones
• Después de listar presupuestos → la app muestra cuánto te queda por categoría en tiempo real
• Cuando el usuario registra su primer gasto del mes → celebrá y mencioná que en la app puede ver el historial
• Cuando el usuario muestra consistencia (múltiples registros seguidos) → es el mejor momento para fidelizar
• Cuando pregunta algo complejo que sería más fácil visual (ver todos sus gastos, comparar meses, etc.)

REGLAS ESTRICTAS:
- Incluí siempre el link: {APP_DOWNLOAD_URL}
- Solo una invitación por respuesta, al final, separada por un salto de línea
- Máximo 1-2 líneas. Nunca interrumpas la respuesta principal
- Tono natural: "Por cierto, en la app podés ver esto en gráficos 📊 → {APP_DOWNLOAD_URL}"
- NO invitar en respuestas cortas (confirmaciones simples, respuestas de 1 línea)
- NUNCA en más de 1 de cada 3 respuestas consecutivas
"""

TONE_HINTS = {
    "amigable": "Usá tono cálido y cercano, con emojis ocasionales. Sos como un amigo que entiende de finanzas.",
    "formal":   "Tono profesional y conciso. Sin emojis. Directo al punto.",
    "estricto": "Muy directo y breve. Solo lo esencial. Sin rodeos.",
}

SYSTEM_PROMPT = """Sos un asistente financiero personal argentino inteligente llamado "Finanzas IA".

FECHA HOY: {today}
TONO: {tone_hint}

CAPACIDADES — Podés hacer TODO esto usando las tools disponibles:
• Registrar gastos e ingresos (incluso múltiples en un mismo mensaje)
• Crear, modificar y eliminar presupuestos mensuales por categoría
• Crear y gestionar metas de ahorro; registrar aportes
• Consultar resúmenes financieros, historial de transacciones y tendencias
• Listar e ignorar suscripciones recurrentes detectadas (Netflix, Spotify, etc.)
• Registrar compromisos de pago recurrentes inevitables (alquiler, créditos, expensas, seguros, servicios) y marcarlos como pagados
• Actualizar preferencias del usuario (tono, tema, ingreso mensual)
• Analizar fotos de facturas/tickets para extraer datos automáticamente
• Procesar notas de voz (ya transcriptas) como si fueran texto

CONTEXTO FINANCIERO DEL USUARIO:
{context}

REGLAS DE COMPORTAMIENTO:
1. Cuando el usuario mencione un gasto, ingreso o pago → llamá `create_transaction` directamente. No preguntés si querés crearlo, simplemente hacelo y confirmá.
   EXCEPCIÓN — pago de compromiso existente: si el usuario dice que pagó algo que ya existe en sus "Compromisos registrados" (alquiler, crédito, expensas, etc.) → llamá `mark_commitment_paid` con el ID del contexto. NO uses `create_transaction` ni `create_commitment` para esto.
   EXCEPCIÓN — nuevo compromiso: si el usuario menciona un pago recurrente inevitable que NO figura en sus compromisos actuales → usá `create_commitment` para registrarlo (sin crear transacción).
2. Para operaciones destructivas (delete) → pedí confirmación ANTES de llamar la tool.
3. Si hay ambigüedad en el monto → preguntá antes de crear.
4. Usá SIEMPRE las tools para leer datos (no inventes cifras).
5. Después de ejecutar tools, respondé en lenguaje natural resumiendo lo que hiciste.
6. Si el usuario pide reportes o resúmenes → llamá `get_monthly_summary` y presentá los datos de forma clara.
7. Slang argentino: "lucas" = ×1000, "palo" = 1.000.000, "mangos" = literal.
8. Los montos son en ARS. Nunca uses centavos en tu respuesta al usuario.
9. REGLA CRÍTICA — Para modificar o eliminar cualquier item (transacción, meta, presupuesto):
   - Si no tenés el ID exacto en el historial de la conversación, PRIMERO llamá list_transactions / list_goals / list_budgets para encontrar el item correcto.
   - NUNCA inventes ni generes IDs. NUNCA crees un item nuevo para "simular" una modificación.
   - El flujo correcto es: list → identificar ID → update/delete. Nunca create → update.

CATEGORÍAS VÁLIDAS: Alimentacion, Transporte, Alquiler, Salud, Entretenimiento, Trabajo, Tecnologia, Ropa, Educacion, Ahorro, Sueldo, Freelance, Otros

{app_cta_block}"""


class Message(BaseModel):
    role: str
    content: str


class AgentRequest(BaseModel):
    message: str
    history: list[Message] = []
    user_id: str
    tone: str = "amigable"
    context: dict = {}
    channel: Optional[str] = None
    image_base64: Optional[str] = None
    image_mime: Optional[str] = None


class AgentResponse(BaseModel):
    reply: str
    tools_used: list[str] = []
    rich_content: Optional[dict] = None


def _fmt_context(ctx: dict) -> str:
    if not ctx:
        return "Sin datos disponibles aún."

    def fmt(centavos: Any) -> str:
        if not isinstance(centavos, (int, float)):
            return str(centavos)
        return f"${centavos / 100:,.0f}".replace(",", ".")

    lines = []
    if ctx.get("income_monthly"):
        lines.append(f"- Ingreso mensual base: {fmt(ctx['income_monthly'])}")
    if ctx.get("month_income") is not None:
        lines.append(f"- Ingresos del mes: {fmt(ctx['month_income'])}")
    if ctx.get("month_expenses") is not None:
        lines.append(f"- Gastos del mes: {fmt(ctx['month_expenses'])}")
    if ctx.get("balance") is not None:
        lines.append(f"- Balance disponible: {fmt(ctx['balance'])}")
    if ctx.get("budgets"):
        budgets_str = ", ".join(
            f"{b['category']} (límite {fmt(b['limit'])})" for b in ctx["budgets"]
        )
        lines.append(f"- Presupuestos: {budgets_str}")
    if ctx.get("goals"):
        goals_str = ", ".join(
            f"{g['name']} ({fmt(g['saved'])}/{fmt(g['target'])})" for g in ctx["goals"]
        )
        lines.append(f"- Metas: {goals_str}")
    if ctx.get("commitments"):
        commitments_str = ", ".join(
            f"{c['name']} (ID:{c['id']}, {fmt(c['amount'])}/mes, último pago: {c.get('last_paid_month') or 'nunca'})"
            for c in ctx["commitments"]
        )
        lines.append(f"- Compromisos registrados: {commitments_str}")
    return "\n".join(lines) if lines else "Sin datos disponibles aún."


def _build_user_content(message: str, image_base64: str | None, image_mime: str | None) -> Any:
    if not image_base64:
        return message

    mime = image_mime or "image/jpeg"
    return [
        {"type": "text", "text": message or "Analizá esta imagen y extraé los datos del gasto."},
        {
            "type": "image_url",
            "image_url": {"url": f"data:{mime};base64,{image_base64}", "detail": "high"},
        },
    ]


@router.post("/agent", response_model=AgentResponse)
async def run_agent(req: AgentRequest):
    is_wa        = req.channel in ("wa_text", "wa_audio")
    user_has_app = req.context.get("has_app", False)

    if is_wa and not user_has_app:
        app_block = APP_INFO_BLOCK + APP_CTA_BLOCK_WA
    elif is_wa:
        app_block = APP_INFO_BLOCK
    else:
        app_block = ""

    system = SYSTEM_PROMPT.format(
        today=date.today().isoformat(),
        tone_hint=TONE_HINTS.get(req.tone, TONE_HINTS["amigable"]),
        context=_fmt_context(req.context),
        app_cta_block=app_block,
    )

    messages: list[dict] = [{"role": "system", "content": system}]
    for m in req.history:
        messages.append({"role": m.role, "content": m.content})

    messages.append({
        "role": "user",
        "content": _build_user_content(req.message, req.image_base64, req.image_mime),
    })

    tools_used: list[str] = []

    for _ in range(MAX_ITERATIONS):
        response = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=ALL_TOOLS,
            tool_choice="auto",
            temperature=0.3,
            max_tokens=1024,
        )

        choice = response.choices[0]
        messages.append(choice.message)

        if choice.finish_reason != "tool_calls" or not choice.message.tool_calls:
            break

        # Execute all tool calls in parallel
        tool_calls = choice.message.tool_calls
        results = await asyncio.gather(
            *[_execute_tool(tc, req.user_id) for tc in tool_calls],
            return_exceptions=True,
        )

        for tc, result in zip(tool_calls, results):
            tools_used.append(tc.function.name)
            if isinstance(result, Exception):
                content = json.dumps({"error": str(result)})
            else:
                content = json.dumps(result, default=str, ensure_ascii=False)

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": content,
            })

    final = messages[-1]
    if isinstance(final, dict):
        reply = final.get("content") or ""
    else:
        reply = final.content or ""
    reply = reply if isinstance(reply, str) else ""

    # Build rich_content hint for the frontend
    rich = _infer_rich_content(tools_used, messages)

    return AgentResponse(reply=reply, tools_used=tools_used, rich_content=rich)


async def _execute_tool(tool_call: Any, user_id: str) -> Any:
    name = tool_call.function.name
    executor = EXECUTORS.get(name)
    if not executor:
        return {"error": f"Tool desconocida: {name}"}
    try:
        args = json.loads(tool_call.function.arguments)
        result = await executor(user_id, args)
        return result
    except httpx.HTTPStatusError as e:
        body = e.response.text
        print(f"[TOOL ERROR] {name} → HTTP {e.response.status_code}: {body}", flush=True)
        return {"error": f"API error {e.response.status_code}: {body}"}
    except Exception as e:
        import traceback
        print(f"[TOOL ERROR] {name} → {type(e).__name__}: {e}", flush=True)
        traceback.print_exc()
        return {"error": str(e)}


def _infer_rich_content(tools_used: list[str], messages: list[dict]) -> dict | None:
    if not tools_used:
        return None
    last_tool_result = None
    for m in reversed(messages):
        if isinstance(m, dict) and m.get("role") == "tool":
            try:
                last_tool_result = json.loads(m["content"])
            except Exception:
                pass
            break

    if any(t in tools_used for t in ("create_transaction", "update_transaction")):
        return {"type": "txn_card", "data": last_tool_result}
    if any(t in tools_used for t in ("create_budget", "list_budgets", "update_budget")):
        return {"type": "budget_list", "data": last_tool_result}
    if any(t in tools_used for t in ("create_goal", "list_goals", "deposit_to_goal")):
        return {"type": "goal_list", "data": last_tool_result}
    if "get_monthly_summary" in tools_used:
        return {"type": "summary", "data": last_tool_result}
    if any(t in tools_used for t in ("list_subscriptions",)):
        return {"type": "subscription_list", "data": last_tool_result}
    return None
