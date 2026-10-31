import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import auth, db
from .api import router
from .api_admin import router as admin_router
from .api_bookings import router as bookings_router
from .api_negotiation import router as negotiation_router
from .api_explain import router as explain_router
from .api_faculty import router as faculty_router
from .api_repair import router as repair_router
from .state import WS


@asynccontextmanager
async def lifespan(app):
    db.init()
    auth.seed_users()
    WS.load()
    yield


app = FastAPI(title="LocusCIT API", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
def root():
    return {"service": "LocusCIT API", "status": "ok", "docs": "/docs", "health": "/api/health",
            "note": "This is the backend. Sign in through the web app, or use /docs to try the API."}


@app.exception_handler(auth.AuthError)
def auth_error(request: Request, e: auth.AuthError):
    return auth.err(e.status, e.code, e.message)


@app.middleware("http")
async def revision_and_persist(request: Request, call_next):
    """If-Match guards state-changing calls against stale clients; successful writes are persisted."""
    write = request.method in ("POST", "PUT", "PATCH", "DELETE") and not request.url.path.endswith("/auth/login")
    if write:
        im = request.headers.get("if-match")
        if im and im.strip('"').isdigit() and int(im.strip('"')) != WS.revision:
            return JSONResponse(status_code=409, content={"success": False, "data": None, "errors": [{
                "code": "STALE_REVISION",
                "message": "The workspace changed (for example after a reset). Refresh and retry.",
                "details": {"current_revision": WS.revision}, "rule_ids": [], "related_entity_ids": []}]})
    resp = await call_next(request)
    if write and resp.status_code < 400:
        WS.save()
    return resp


app.include_router(auth.router)
app.include_router(router)
app.include_router(admin_router)
app.include_router(repair_router)
app.include_router(bookings_router)
app.include_router(negotiation_router)
app.include_router(faculty_router)
app.include_router(explain_router)
