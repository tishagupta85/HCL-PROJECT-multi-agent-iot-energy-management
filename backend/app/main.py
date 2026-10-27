import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.seed_data import seed_database
from app.simulator import simulator

# Import all models so metadata is complete
import models

# Import all routers
from routers import (
    devices,
    readings,
    simulator as sim_router,
    agents,
    analytics,
    forecasts,
    anomalies,
    optimizations,
    reports,
)

async def background_simulation_loop():
    """Background task that runs the IoT simulator every interval."""
    print("[SIMULATOR] Starting background IoT simulation loop...")
    while True:
        try:
            if settings.SIMULATOR_ENABLED and simulator.is_running:
                db = SessionLocal()
                try:
                    simulator.tick(db)
                finally:
                    db.close()
            sleep_duration = max(0.5, settings.SIMULATOR_INTERVAL_SECONDS / max(simulator.tick_speed_multiplier, 0.1))
            await asyncio.sleep(sleep_duration)
        except asyncio.CancelledError:
            print("[SIMULATOR] Simulation loop cancelled.")
            break
        except Exception as e:
            print(f"[SIMULATOR ERROR] {e}")
            await asyncio.sleep(2.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and seed baseline data
    print("[STARTUP] Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Start background simulator task
    sim_task = asyncio.create_task(background_simulation_loop())
    yield
    # Shutdown
    sim_task.cancel()
    try:
        await sim_task
    except asyncio.CancelledError:
        pass
    print("[SHUTDOWN] Backend stopped cleanly.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Multi-Agent AI System for IoT Energy Management - Production API",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(devices.router)
app.include_router(readings.router)
app.include_router(sim_router.router)
app.include_router(agents.router)
app.include_router(analytics.router)
app.include_router(forecasts.router)
app.include_router(anomalies.router)
app.include_router(optimizations.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs_url": "/docs",
    }
