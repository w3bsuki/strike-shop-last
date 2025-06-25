from fastapi import APIRouter

from app.api.v1.endpoints import auth, tasks, websocket, teams, analytics, notifications
# from app.api.v1.endpoints import files  # Temporarily disabled due to dependencies

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
# api_router.include_router(files.router, prefix="/files", tags=["files"])  # Temporarily disabled
api_router.include_router(websocket.router, tags=["websocket"])