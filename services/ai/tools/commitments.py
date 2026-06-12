from lib.api_client import api_get, api_post, api_put, api_delete

CATEGORIES = ["Vivienda", "Credito", "Seguros", "Servicios", "Transporte", "Otros"]

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_commitment",
            "description": (
                "Registra un pago recurrente INEVITABLE (alquiler, expensas, crédito hipotecario, "
                "préstamo personal, seguro, luz y gas, etc.). A diferencia de las suscripciones, "
                "estos son compromisos que no se pueden cancelar fácilmente. "
                "Inferí el emoji más representativo: 🏠 vivienda/alquiler, 🏦 hipoteca, 🏢 expensas, "
                "🚗 seguro auto, 💳 préstamo/crédito, 💡 luz/gas, 🏥 salud, 🎓 educación, 🚙 cuota auto."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Nombre del compromiso (ej: Alquiler, Crédito hipotecario, Expensas)",
                    },
                    "emoji": {
                        "type": "string",
                        "description": "Emoji representativo. Inferilo inteligentemente según el tipo de compromiso.",
                    },
                    "amount": {
                        "type": "integer",
                        "description": "Monto mensual en centavos (pesos × 100). Ej: $85.000 → 8500000",
                    },
                    "category": {
                        "type": "string",
                        "enum": CATEGORIES,
                        "description": "Vivienda (alquiler, expensas), Credito (hipoteca, préstamos), Seguros, Servicios (luz, gas), Transporte, Otros",
                    },
                    "day_of_month": {
                        "type": "integer",
                        "description": "Día del mes en que vence (1-31).",
                    },
                    "installment_current": {
                        "type": "integer",
                        "description": "Cuota actual para créditos (ej: 12 si va por la cuota 12). Omitir si no aplica.",
                    },
                    "installment_total": {
                        "type": "integer",
                        "description": "Total de cuotas para créditos (ej: 48). Omitir si no aplica.",
                    },
                },
                "required": ["name", "emoji", "amount", "category", "day_of_month"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_commitments",
            "description": "Lista todos los compromisos de pago recurrentes del usuario con su estado del mes actual.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "mark_commitment_paid",
            "description": (
                "Registra un compromiso como pagado en el mes actual. "
                "Crea automáticamente la transacción de gasto correspondiente. "
                "IMPORTANTE: Si no tenés el ID, llamá list_commitments primero."
            ),
            "parameters": {
                "type": "object",
                "properties": {"commitment_id": {"type": "string"}},
                "required": ["commitment_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_commitment",
            "description": (
                "Elimina un compromiso recurrente. Pedí confirmación antes. "
                "IMPORTANTE: Si no tenés el ID, llamá list_commitments primero."
            ),
            "parameters": {
                "type": "object",
                "properties": {"commitment_id": {"type": "string"}},
                "required": ["commitment_id"],
            },
        },
    },
]

# ─── Executors ────────────────────────────────────────────────────────────────

async def create_commitment(user_id: str, args: dict) -> dict:
    return await api_post("/commitments", user_id, args)


async def list_commitments(user_id: str, args: dict) -> list:
    return await api_get("/commitments", user_id)


async def mark_commitment_paid(user_id: str, args: dict) -> dict:
    return await api_post(f"/commitments/{args['commitment_id']}/pay", user_id, {})


async def delete_commitment(user_id: str, args: dict) -> dict:
    return await api_delete(f"/commitments/{args['commitment_id']}", user_id)
