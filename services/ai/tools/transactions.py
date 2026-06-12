from datetime import date
from lib.api_client import api_get, api_post, api_put, api_delete

CATEGORIES = [
    "Alimentacion", "Transporte", "Alquiler", "Salud", "Entretenimiento",
    "Trabajo", "Tecnologia", "Ropa", "Educacion", "Ahorro", "Sueldo", "Freelance", "Otros"
]

# ─── Tool Definitions ─────────────────────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_transaction",
            "description": (
                "Crea una transacción financiera (gasto, ingreso o ahorro). "
                "Usá esta tool cuando el usuario mencione un gasto, ingreso o pago. "
                "El monto debe estar en ARS (pesos). "
                "Ejemplo: '45 lucas en nafta' → amount=45000, type='expense', category='Transporte'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "amount_ars": {
                        "type": "number",
                        "description": "Monto en ARS (pesos argentinos). No en centavos. 45 lucas = 45000.",
                    },
                    "type": {"type": "string", "enum": ["expense", "income", "saving"]},
                    "description": {"type": "string", "maxLength": 120, "description": "Descripción corta del movimiento."},
                    "category": {"type": "string", "enum": CATEGORIES},
                    "date": {"type": "string", "description": "Fecha en formato YYYY-MM-DD. Si el usuario dijo 'hoy', usá la fecha actual."},
                    "note": {"type": "string", "description": "Nota adicional opcional."},
                    "channel": {"type": "string", "enum": ["app", "wa_text", "wa_audio"], "default": "app"},
                    "raw_text": {"type": "string", "description": "Texto original del usuario (para auditoría)."},
                },
                "required": ["amount_ars", "type", "description", "category", "date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_transaction",
            "description": (
                "Modifica una transacción existente. Requiere el transaction_id. "
                "IMPORTANTE: Si no tenés el ID en el contexto de la conversación, "
                "llamá primero `list_transactions` para encontrar la transacción correcta. "
                "NUNCA inventes un ID ni crees una transacción nueva para modificarla."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "transaction_id": {"type": "string"},
                    "amount_ars": {"type": "number"},
                    "description": {"type": "string", "maxLength": 120},
                    "category": {"type": "string", "enum": CATEGORIES},
                    "type": {"type": "string", "enum": ["expense", "income", "saving"]},
                    "date": {"type": "string"},
                    "note": {"type": "string"},
                },
                "required": ["transaction_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_transaction",
            "description": (
                "Elimina (soft delete) una transacción. Pedí confirmación al usuario antes de llamar esta tool. "
                "IMPORTANTE: Si no tenés el transaction_id, llamá primero `list_transactions` para encontrarlo. "
                "NUNCA inventes un ID."
            ),
            "parameters": {
                "type": "object",
                "properties": {"transaction_id": {"type": "string"}},
                "required": ["transaction_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_transactions",
            "description": "Lista las transacciones del usuario con filtros opcionales.",
            "parameters": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["expense", "income", "saving"]},
                    "category": {"type": "string", "enum": CATEGORIES},
                    "from_date": {"type": "string", "description": "Fecha inicio YYYY-MM-DD."},
                    "to_date": {"type": "string", "description": "Fecha fin YYYY-MM-DD."},
                    "search": {"type": "string", "description": "Búsqueda por descripción."},
                    "limit": {"type": "integer", "default": 10, "maximum": 50},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_monthly_summary",
            "description": "Obtiene el resumen financiero de un mes: ingresos, gastos, balance, presupuestos, metas y suscripciones.",
            "parameters": {
                "type": "object",
                "properties": {
                    "month": {"type": "string", "description": "Formato YYYY-MM. Si no se especifica, usa el mes actual."},
                },
            },
        },
    },
]

# ─── Executors ────────────────────────────────────────────────────────────────

async def create_transaction(user_id: str, args: dict) -> dict:
    centavos = round(args["amount_ars"] * 100)
    payload = {
        "amount": centavos,
        "type": args["type"],
        "description": args["description"],
        "category": args["category"],
        "date": args.get("date", date.today().isoformat()),
        "channel": args.get("channel", "app"),
    }
    if args.get("note"):
        payload["note"] = args["note"]
    if args.get("raw_text"):
        payload["raw_text"] = args["raw_text"]
    return await api_post("/transactions", user_id, payload)


async def update_transaction(user_id: str, args: dict) -> dict:
    txn_id = args.pop("transaction_id")
    if "amount_ars" in args:
        args["amount"] = round(args.pop("amount_ars") * 100)
    return await api_put(f"/transactions/{txn_id}", user_id, args)


async def delete_transaction(user_id: str, args: dict) -> dict:
    return await api_delete(f"/transactions/{args['transaction_id']}", user_id)


async def list_transactions(user_id: str, args: dict) -> dict:
    params: dict = {"limit": args.get("limit", 10)}
    if args.get("type"):
        params["type"] = args["type"]
    if args.get("category"):
        params["category"] = args["category"]
    if args.get("from_date"):
        params["from"] = args["from_date"]
    if args.get("to_date"):
        params["to"] = args["to_date"]
    if args.get("search"):
        params["q"] = args["search"]
    return await api_get("/transactions", user_id, params)


async def get_monthly_summary(user_id: str, args: dict) -> dict:
    params = {}
    if args.get("month"):
        params["month"] = args["month"]
    return await api_get("/transactions/summary", user_id, params)
