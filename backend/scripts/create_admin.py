import asyncio
import os
import sys

# Ensure backend root and project root are on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.core.config import settings
from app.db.database import AsyncSessionLocal
from app.models.all_models import User
from app.core.security import get_password_hash
from sqlalchemy import select

async def main():
    email = settings.INITIAL_ADMIN_EMAIL
    password = settings.INITIAL_ADMIN_PASSWORD

    if not email or not password:
        print("INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD environment variables missing.")
        return

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalars().first()

        if existing:
            print(f"Admin user '{email}' already exists in PostgreSQL.")
            return

        admin_user = User(
            name="System Admin",
            email=email,
            password_hash=get_password_hash(password),
            role="ADMIN"
        )
        session.add(admin_user)
        await session.commit()
        print(f"Successfully created initial admin user in PostgreSQL: {email}")

if __name__ == '__main__':
    asyncio.run(main())
