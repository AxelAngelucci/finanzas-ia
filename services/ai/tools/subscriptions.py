from lib.api_client import api_get, api_post, api_put, api_delete

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_subscription",
            "description": (
                "Registra una suscripción recurrente mensual a un servicio (Netflix, Spotify, Adobe CC, "
                "iCloud, GitHub, Figma, etc.). Crea el registro de suscripción Y la transacción del mes "
                "actual automáticamente. Usá esta herramienta EN LUGAR de create_transaction cuando el "
                "usuario mencione un gasto que se repite cada mes."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Nombre del servicio (ej: Netflix, Spotify, Adobe CC)",
                    },
                    "amount": {
                        "type": "integer",
                        "description": "Monto mensual en centavos (multiplicar pesos por 100). Ej: $8900 → 890000",
                    },
                    "day_of_charge": {
                        "type": "integer",
                        "description": "Día del mes en que se cobra (1-31). Si el usuario no lo menciona, omitir este campo.",
                    },
                    "category": {
                        "type": "string",
                        "enum": [
                            "Entretenimiento", "Tecnologia", "Trabajo",
                            "Educacion", "Salud", "Otros",
                        ],
                        "description": "Categoría del servicio",
                    },
                },
                "required": ["name", "amount", "category"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_subscriptions",
            "description": "Lista las suscripciones recurrentes detectadas automáticamente (Netflix, Spotify, etc.).",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ignore_subscription",
            "description": "Ignora una suscripción detectada para que no aparezca más en el listado.",
            "parameters": {
                "type": "object",
                "properties": {"subscription_id": {"type": "string"}},
                "required": ["subscription_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_subscription",
            "description": "Elimina definitivamente una suscripción registrada.",
            "parameters": {
                "type": "object",
                "properties": {"subscription_id": {"type": "string"}},
                "required": ["subscription_id"],
            },
        },
    },
]

# ─── Executors ────────────────────────────────────────────────────────────────

async def create_subscription(user_id: str, args: dict) -> dict:
    return await api_post("/ai/subscriptions", user_id, args)


async def list_subscriptions(user_id: str, args: dict) -> list:
    return await api_get("/ai/subscriptions", user_id)


async def ignore_subscription(user_id: str, args: dict) -> dict:
    return await api_put(f"/ai/subscriptions/{args['subscription_id']}/ignore", user_id, {})


async def delete_subscription(user_id: str, args: dict) -> dict:
    return await api_delete(f"/ai/subscriptions/{args['subscription_id']}", user_id)
