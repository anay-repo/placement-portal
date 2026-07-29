import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    """
    This class stores all configuration settings for the Flask application.
    Sensitive values are read from environment variables — set these in a
    local .env file (not committed) or in your host's environment settings.
    """
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-me")

    DB_NAME = "placement.db"
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, DB_NAME)}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = os.path.join(BASE_DIR, "app", "uploads")

    ALLOWED_EXTENSIONS = {"pdf", "docx"}

    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

    CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", REDIS_URL)
    CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", REDIS_URL)

    CELERY_TIMEZONE = "Asia/Kolkata"

    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")

    MAIL_DEFAULT_SENDER = os.environ.get(
        "MAIL_DEFAULT_SENDER", f"Placement Portal <{MAIL_USERNAME}>"
    )