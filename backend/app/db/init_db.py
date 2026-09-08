from sqlalchemy.orm import Session
from app.db.database import engine, Base
from app.models.all_models import User
from app.core.config import settings
from app.core.security import get_password_hash
from app.core.logging import logger

def init_db(db: Session):
    # Create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

    # Seed Admin User if not existing
    admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not admin:
        admin_user = User(
            name="System Admin",
            email=settings.ADMIN_EMAIL,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            role="ADMIN"
        )
        db.add(admin_user)
        db.commit()
        logger.info(f"Seeded default admin user: {settings.ADMIN_EMAIL}")

    # Seed Demo Investigator User
    demo_user = db.query(User).filter(User.email == "analyst@cybertrace.ai").first()
    if not demo_user:
        investigator = User(
            name="Rahul Sharma",
            email="analyst@cybertrace.ai",
            password_hash=get_password_hash("Investigator123!"),
            role="INVESTIGATOR"
        )
        db.add(investigator)
        db.commit()
        logger.info("Seeded default investigator user: analyst@cybertrace.ai")
