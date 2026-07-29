from flask import Flask, jsonify
from flask_login import LoginManager
from flask_cors import CORS
from .models import db, User
from config import Config
import os


def create_app():
    """
    This function creates and configures the Flask application
    """
    app = Flask(__name__)

    
    app.config.from_object(Config)

    frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:8080")
    CORS(app, supports_credentials=True, origins=[frontend_origin])

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"error": "Authentication required"}), 401

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from .auth    import auth_bp
    from .admin   import admin_bp
    from .company import company_bp
    from .student import student_bp

    app.register_blueprint(auth_bp,    url_prefix="/api/auth")
    app.register_blueprint(admin_bp,   url_prefix="/api/admin")
    app.register_blueprint(company_bp, url_prefix="/api/company")
    app.register_blueprint(student_bp, url_prefix="/api/student")

    with app.app_context():
        db.create_all()
        create_admin()

    return app


def create_admin():
    
    from werkzeug.security import generate_password_hash

    existing_admin = User.query.filter_by(role="admin").first()

    if existing_admin:
        return

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "changeme123")
    admin = User(
        email    = admin_email,
        password = generate_password_hash(admin_password),
        role     = "admin"
    )
    db.session.add(admin)
    db.session.commit()
    print("Default admin created")
