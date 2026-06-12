from lib.api_client import api_put

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "update_user_preferences",
            "description": (
                "Actualiza las preferencias del usuario: "
                "tono del agente, ingreso mensual, porcentaje de alerta de presupuesto, tema visual."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "agent_tone": {
                        "type": "string",
                        "enum": ["amigable", "formal", "estricto"],
                        "description": "Personalidad del asistente.",
                    },
                    "income_monthly_ars": {
                        "type": "number",
                        "description": "Ingreso mensual en ARS. Se usa para calcular el disponible diario.",
                    },
                    "budget_alert_pct": {
                        "type": "integer",
                        "minimum": 50,
                        "maximum": 95,
                        "description": "% de uso del presupuesto para disparar notificación push.",
                    },
                    "theme": {
                        "type": "string",
                        "enum": ["light", "dark", "system"],
                    },
                },
            },
        },
    },
]

# ─── Executors ────────────────────────────────────────────────────────────────

async def update_user_preferences(user_id: str, args: dict) -> dict:
    body: dict = {}
    if "agent_tone" in args:
        body["agent_tone"] = args["agent_tone"]
    if "income_monthly_ars" in args:
        body["income_monthly"] = round(args["income_monthly_ars"] * 100)
    if "budget_alert_pct" in args:
        body["budget_alert_pct"] = args["budget_alert_pct"]
    if "theme" in args:
        body["theme"] = args["theme"]
    return await api_put("/users/me", user_id, body)
