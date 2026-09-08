from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_async_db
from app.core.config import settings

router = APIRouter(prefix="", tags=["Health"])

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_async_db)):
    try:
        # Test real PostgreSQL query
        res = await db.execute(text("SELECT 1"))
        res.scalar()
        return {
            "status": "healthy",
            "database": "connected",
            "system": settings.PROJECT_NAME,
            "ai_provider": settings.AI_PROVIDER,
            "gemini_api_configured": bool(settings.GEMINI_API_KEY)
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection unavailable: {str(e)}"
        )
