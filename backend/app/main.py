import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
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


_FIELD = {"title": "Title", "attendance": "People", "duration_periods": "Hours", "windows": "Time window",
          "from_period": "Start period", "to_period": "End period", "day": "Day", "start_period": "Start period",
          "end_period": "End period", "room_id": "Room", "text": "Text", "reason": "Reason", "action": "Action",
          "requested_room": "Room", "needs": "Needs", "room_types": "Room types"}


@app.exception_handler(RequestValidationError)
def invalid_input(request: Request, e: RequestValidationError):
    """Say what is wrong with the input in plain words instead of FastAPI's raw error list."""
    msgs = []
    for er in e.errors():
        loc = [x for x in er["loc"] if x not in ("body", "query", "path")]
        names = [x for x in loc if isinstance(x, str)]
        idx = next((x for x in loc if isinstance(x, int)), None)
        label = _FIELD.get(names[-1], str(names[-1]).replace("_", " ").capitalize()) if names else "Request"
        if idx is not None and names and names[-1] != "windows" and names[0] == "windows":
            label = f"Time window {idx + 1}, {label.lower()}"
        ctx, kind = er.get("ctx") or {}, er["type"]
        if kind == "missing":
            msg = f"{label} is required"
        elif kind in ("less_than_equal", "less_than"):
            msg = f"{label} must be at most {ctx.get('le', ctx.get('lt'))}"
        elif kind in ("greater_than_equal", "greater_than"):
            msg = f"{label} must be at least {ctx.get('ge', ctx.get('gt'))}"
        elif kind == "string_too_short":
            msg = f"{label} must have at least {ctx.get('min_length')} characters"
        elif kind == "string_too_long":
            msg = f"{label} must have at most {ctx.get('max_length')} characters"
        elif kind == "too_short":
            msg = f"{label}: add at least {ctx.get('min_length')}"
        elif kind == "too_long":
            msg = f"{label}: at most {ctx.get('max_length')} allowed"
        elif kind in ("int_parsing", "int_type", "float_parsing"):
            msg = f"{label} must be a whole number"
        else:
            msg = f"{label}: {er['msg']}"
        msgs.append(msg)
    msgs = list(dict.fromkeys(msgs))
    return JSONResponse(status_code=422, content={"success": False, "data": None, "errors": [{
        "code": "INVALID_INPUT", "message": "; ".join(msgs), "details": msgs, "rule_ids": [], "related_entity_ids": []}]})


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
