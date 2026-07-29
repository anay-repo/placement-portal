from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from .models import db, User, Student, Company
from .cache import delete_cached

auth_bp = Blueprint("auth", __name__)


# REGISTER STUDENT

@auth_bp.route("/register/student", methods=["POST"])
def register_student():
    data = request.get_json()  
    if not data.get("email") or not data.get("password") or not data.get("full_name"):
        return jsonify({"error": "Email, password and full name are required"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 400

    new_user = User(
        email    = data["email"],
        password = generate_password_hash(data["password"]),
        role     = "student"
    )
    db.session.add(new_user)
    db.session.flush()  
    new_student = Student(
        user_id   = new_user.id,
        full_name = data["full_name"],
        branch    = data.get("branch", ""),
        cgpa      = data.get("cgpa", 0.0),
        year      = data.get("year", 1),
        phone     = data.get("phone", "")
    )
    db.session.add(new_student)
    db.session.commit()  

    delete_cached("admin:dashboard")

    return jsonify({"message": "Student registered successfully"}), 201


# REGISTER COMPANY

@auth_bp.route("/register/company", methods=["POST"])
def register_company():
    data = request.get_json()

    if not data.get("email") or not data.get("password") or not data.get("company_name"):
        return jsonify({"error": "Email, password and company name are required"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 400

    
    new_user = User(
        email    = data["email"],
        password = generate_password_hash(data["password"]),
        role     = "company"
    )
    db.session.add(new_user)
    db.session.flush()

    new_company = Company(
        user_id      = new_user.id,
        company_name = data["company_name"],
        hr_contact   = data.get("hr_contact", ""),
        website      = data.get("website", ""),
        description  = data.get("description", "")
    )
    db.session.add(new_company)
    db.session.commit()

    
    delete_cached("admin:dashboard")

    return jsonify({"message": "Company registered. Waiting for admin approval."}), 201


# LOGIN

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not check_password_hash(user.password, data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Your account has been deactivated"}), 403

    login_user(user)

    return jsonify({
        "message": "Login successful",
        "role"   : user.role,
        "user_id": user.id
    }), 200


# LOGOUT

@auth_bp.route("/logout", methods=["POST"])
@login_required  
def logout():
    logout_user()  
    return jsonify({"message": "Logged out successfully"}), 200


# CURRENT USER

@auth_bp.route("/me", methods=["GET"])
def me():
    if not current_user.is_authenticated:
        return jsonify({"error": "Not logged in"}), 401

    response = {
        "user_id": current_user.id,
        "email"  : current_user.email,
        "role"   : current_user.role
    }

    if current_user.role == "student" and current_user.student_profile:
        s = current_user.student_profile
        response["full_name"] = s.full_name
        response["branch"]    = s.branch
        response["cgpa"]      = s.cgpa
        response["year"]      = s.year
        response["student_id"] = s.id

    elif current_user.role == "company" and current_user.company_profile:
        c = current_user.company_profile # c= company
        response["company_name"]    = c.company_name
        response["approval_status"] = c.approval_status
        response["company_id"]      = c.id

    return jsonify(response), 200