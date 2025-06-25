import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.config import settings
from app.core.security import get_password_hash


async def init_db() -> None:
    async with AsyncSessionLocal() as db:
        # Check if superuser exists
        result = await db.execute(
            select(User).where(User.email == settings.FIRST_SUPERUSER_EMAIL)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            # Create superuser
            user = User(
                email=settings.FIRST_SUPERUSER_EMAIL,
                username="admin",
                full_name="Admin User",
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                is_active=True,
                is_superuser=True,
                is_verified=True
            )
            db.add(user)
            await db.commit()
            print(f"Superuser created: {settings.FIRST_SUPERUSER_EMAIL}")
        else:
            print(f"Superuser already exists: {settings.FIRST_SUPERUSER_EMAIL}")


if __name__ == "__main__":
    asyncio.run(init_db())