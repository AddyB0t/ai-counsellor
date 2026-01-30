from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import traceback

load_dotenv()

from app.core.logging import setup_logging, get_logger
from app.api import profile, universities, tasks, counsellor, conversations, sop, tts, stt

# Initialize logging
setup_logging()
logger = get_logger("main")

app = FastAPI(
    title="AI Counsellor API",
    description="Backend API for AI Study Abroad Counsellor",
    version="1.0.0"
)

# CORS middleware - allow your frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Add your production frontend URL here
        "*"  # For development - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions."""
    error_id = id(exc)
    logger.error(
        f"Unhandled exception [{error_id}] on {request.method} {request.url.path}: "
        f"{type(exc).__name__}: {str(exc)}"
    )
    logger.error(f"Traceback [{error_id}]:\n{traceback.format_exc()}")

    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred. Please try again.",
            "error_id": str(error_id)
        }
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors."""
    logger.warning(f"404 Not Found: {request.method} {request.url.path}")
    return JSONResponse(
        status_code=404,
        content={
            "error": "not_found",
            "message": f"The requested resource was not found: {request.url.path}"
        }
    )


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests."""
    logger.info(f"→ {request.method} {request.url.path}")

    try:
        response = await call_next(request)
        logger.info(f"← {request.method} {request.url.path} [{response.status_code}]")
        return response
    except Exception as exc:
        logger.error(f"✗ {request.method} {request.url.path} - Error: {str(exc)}")
        raise


# Include routers
app.include_router(profile.router)
app.include_router(universities.router)
app.include_router(tasks.router)
app.include_router(counsellor.router)
app.include_router(conversations.router)
app.include_router(sop.router)
app.include_router(tts.router)
app.include_router(stt.router)

logger.info("API routers registered successfully")


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "AI Counsellor API", "status": "running"}


@app.get("/health")
async def health():
    """Health check endpoint for Render and monitoring."""
    logger.debug("Health check called")
    return {"status": "healthy", "service": "ai-counsellor-api"}


@app.on_event("startup")
async def startup_event():
    """Log application startup."""
    logger.info("=" * 50)
    logger.info("AI Counsellor API starting up...")
    logger.info("=" * 50)


@app.on_event("shutdown")
async def shutdown_event():
    """Log application shutdown."""
    logger.info("AI Counsellor API shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
