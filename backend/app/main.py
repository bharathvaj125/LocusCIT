from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .api import router
from .api_repair import router as repair_router

app = FastAPI(title="LocusCIT API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
app.include_router(router)
app.include_router(repair_router)
