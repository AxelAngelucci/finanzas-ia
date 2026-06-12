from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import agent, transcribe, parser, advisor

app = FastAPI(title="Finanzas IA — AI Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# v2 — comprehensive agent with tools
app.include_router(agent.router)
app.include_router(transcribe.router)

# v1 — kept for backward compatibility
app.include_router(parser.router)
app.include_router(advisor.router)


@app.get("/health")
def health():
    return {"ok": True}
