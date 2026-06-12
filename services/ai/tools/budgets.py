from lib.api_client import api_get, api_post, api_put, api_delete

CATEGORIES = [
    "Alimentacion", "Transporte", "Alquiler", "Salud", "Entretenimiento",
    "Trabajo", "Tecnologia", "Ropa", "Educacion", "Ahorro", "Sueldo", "Freelance", "Otros"
]

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_budget",
            "description": (
                "Crea un presupuesto mensual para una categoría. "
                "Ejemplo: 'quiero gastar máximo $30.000 en comida este mes' → "
                "category='Alimentacion', limit_ars=30000, month='2026-06'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "enum": CATEGORIES},
                    "limit_ars": {"type": "number", "description": "Límite mensual en ARS (pesos, no centavos)."},
                    "month": {"type": "string", "description": "Mes en formato YYYY-MM. Default: mes actual."},
                    "alert_threshold": {
                        "type": "integer",
                        "description": "% de uso para enviar alerta (50–100). Default: 80.",
                        "minimum": 50,
                        "maximum": 100,
                    },
                },
                "required": ["category", "limit_ars"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_budget",
            "description": (
                "Modifica el límite o umbral de alerta de un presupuesto existente. Requiere el budget_id. "
                "IMPORTANTE: Si no tenés el ID, llamá primero `list_budgets` para encontrar el presupuesto correcto. "
                "NUNCA inventes un ID ni crees un presupuesto nuevo para modificarlo."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "budget_id": {"type": "string"},
                    "limit_ars": {"type": "number"},
                    "alert_threshold": {"type": "integer", "minimum": 50, "maximum": 100},
                },
                "required": ["budget_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_budget",
            "description": (
                "Elimina un presupuesto. Pedí confirmación antes de llamar esta tool. "
                "IMPORTANTE: Si no tenés el budget_id, llamá primero `list_budgets` para encontrarlo. "
                "NUNCA inventes un ID."
            ),
            "parameters": {
                "type": "object",
                "properties": {"budget_id": {"type": "string"}},
                "required": ["budget_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_budgets",
            "description": "Lista los presupuestos activos con el gasto acumulado de cada categoría.",
            "parameters": {
                "type": "object",
                "properties": {
                    "month": {"type": "string", "description": "Formato YYYY-MM. Default: mes actual."},
                },
            },
        },
    },
]

# ─── Executors ────────────────────────────────────────────────────────────────

from datetime import date as _date

def _current_month() -> str:
    d = _date.today()
    return f"{d.year}-{str(d.month).zfill(2)}"


async def create_budget(user_id: str, args: dict) -> dict:
    return await api_post("/budgets", user_id, {
        "category": args["category"],
        "limit_amount": round(args["limit_ars"] * 100),
        "month": args.get("month", _current_month()),
        "alert_threshold": args.get("alert_threshold", 80),
    })


async def update_budget(user_id: str, args: dict) -> dict:
    budget_id = args.pop("budget_id")
    body: dict = {}
    if "limit_ars" in args:
        body["limit_amount"] = round(args["limit_ars"] * 100)
    if "alert_threshold" in args:
        body["alert_threshold"] = args["alert_threshold"]
    return await api_put(f"/budgets/{budget_id}", user_id, body)


async def delete_budget(user_id: str, args: dict) -> dict:
    return await api_delete(f"/budgets/{args['budget_id']}", user_id)


async def list_budgets(user_id: str, args: dict) -> dict:
    params = {}
    if args.get("month"):
        params["month"] = args["month"]
    return await api_get("/budgets", user_id, params)
