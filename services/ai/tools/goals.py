from lib.api_client import api_get, api_post, api_put, api_delete

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_goal",
            "description": (
                "Crea una meta de ahorro. "
                "Ejemplo: 'quiero ahorrar $500.000 para un viaje en diciembre' → "
                "name='Viaje', target_ars=500000, target_date='2026-12-01'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "maxLength": 60},
                    "emoji": {"type": "string", "description": "Emoji representativo (ej: ✈️ 🏠 💻). Default: 🎯"},
                    "target_ars": {"type": "number", "description": "Monto objetivo en ARS (pesos)."},
                    "target_date": {"type": "string", "description": "Fecha objetivo YYYY-MM-DD."},
                    "color": {"type": "string", "description": "Color hex para la UI. Default: #6366F1"},
                },
                "required": ["name", "target_ars", "target_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_goal",
            "description": (
                "Modifica una meta de ahorro existente. Requiere el goal_id. "
                "IMPORTANTE: Si no tenés el ID en el contexto, llamá primero `list_goals` "
                "para encontrar la meta correcta. NUNCA inventes un ID ni crees una meta nueva para modificarla."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "goal_id": {"type": "string"},
                    "name": {"type": "string"},
                    "emoji": {"type": "string"},
                    "target_ars": {"type": "number"},
                    "target_date": {"type": "string"},
                    "color": {"type": "string"},
                },
                "required": ["goal_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_goal",
            "description": (
                "Elimina una meta de ahorro. Pedí confirmación antes de llamar esta tool. "
                "IMPORTANTE: Si no tenés el goal_id, llamá primero `list_goals` para encontrarlo. "
                "NUNCA inventes un ID."
            ),
            "parameters": {
                "type": "object",
                "properties": {"goal_id": {"type": "string"}},
                "required": ["goal_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_goals",
            "description": "Lista todas las metas de ahorro activas del usuario con su progreso.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "deposit_to_goal",
            "description": (
                "Registra un aporte a una meta de ahorro. "
                "Esto también crea una transacción de tipo 'saving' en el historial."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "goal_id": {"type": "string"},
                    "amount_ars": {"type": "number", "description": "Monto a depositar en ARS."},
                    "note": {"type": "string"},
                },
                "required": ["goal_id", "amount_ars"],
            },
        },
    },
]

# ─── Executors ────────────────────────────────────────────────────────────────

async def create_goal(user_id: str, args: dict) -> dict:
    return await api_post("/goals", user_id, {
        "name": args["name"],
        "emoji": args.get("emoji", "🎯"),
        "target_amount": round(args["target_ars"] * 100),
        "target_date": args["target_date"],
        "color": args.get("color", "#6366F1"),
    })


async def update_goal(user_id: str, args: dict) -> dict:
    goal_id = args.pop("goal_id")
    body: dict = {}
    for k in ("name", "emoji", "color", "target_date"):
        if k in args:
            body[k] = args[k]
    if "target_ars" in args:
        body["target_amount"] = round(args["target_ars"] * 100)
    return await api_put(f"/goals/{goal_id}", user_id, body)


async def delete_goal(user_id: str, args: dict) -> dict:
    return await api_delete(f"/goals/{args['goal_id']}", user_id)


async def list_goals(user_id: str, args: dict) -> dict:
    return await api_get("/goals", user_id)


async def deposit_to_goal(user_id: str, args: dict) -> dict:
    goal_id = args["goal_id"]
    return await api_post(f"/goals/{goal_id}/deposit", user_id, {
        "amount": round(args["amount_ars"] * 100),
        "note": args.get("note"),
    })
