from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from .models import db, Student, Company, PlacementDrive, Application

admin_bp = Blueprint("admin", __name__)

def admin_required():
    if not current_user.is_authenticated or current_user.role != "admin":
        return False
    return True


# ADMIN DASHBOARD

@admin_bp.route("/dashboard", methods=["GET"])
@login_required
def dashboard():
    if not admin_required():
        return jsonify({"error": "Admin access only"}), 403

    total_students     = Student.query.count()
    total_companies    = Company.query.count()
    total_drives       = PlacementDrive.query.count()
    pending_companies  = Company.query.filter_by(approval_status="pending").count()
    pending_drives     = PlacementDrive.query.filter_by(status="pending").count()
    total_applications = Application.query.count()
    placed_students    = Application.query.filter_by(status="Selected").count()

    data = {
        "total_students"    : total_students,
        "total_companies"   : total_companies,
        "total_drives"      : total_drives,
        "pending_companies" : pending_companies,
        "pending_drives"    : pending_drives,
        "total_applications": total_applications,
        "placed_students"   : placed_students
    }

    return jsonify(data), 200


# GET ALL COMPANIES

@admin_bp.route("/companies", methods=["GET"])
@login_required
def get_companies():
    if not admin_required():
        return jsonify({"error": "Admin access only"}), 403

    companies = Company.query.all()
    result = []

    for c in companies:
        result.append({
            "company_id"     : c.id,
            "company_name"   : c.company_name,
            "hr_contact"     : c.hr_contact,
            "website"        : c.website,
            "approval_status": c.approval_status,
            "email"          : c.user.email,
            "is_active"      : c.user.is_active,
            "total_drives"   : len(c.drives)
        })

    return jsonify(result), 200


# UPDATE COMPANY STATUS

@admin_bp.route("/companies/<int:company_id>/status", methods=["PUT"])
@login_required
def update_company_status(company_id):
    if not admin_required():
        return jsonify({"error": "Admin access only"}), 403

    company = Company.query.get(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["approved", "rejected", "pending"]:
        return jsonify({"error": "Invalid status"}), 400

    company.approval_status = new_status
    db.session.commit()

    from .cache import delete_cached
    delete_cached("admin:dashboard")

    return jsonify({"message": f"Company status updated to {new_status}"}), 200


# BLACKLIST / ACTIVATE COMPANY

@admin_bp.route("/companies/<int:company_id>/blacklist", methods=["PUT"])
@login_required
def blacklist_company(company_id):
    if not admin_required():
        return jsonify({"error": "Admin access only"}), 403

    company = Company.query.get(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    data = request.get_json()
    company.user.is_active = data.get("is_active", False)

    if not company.user.is_active:
        for drive in company.drives:
            if drive.status != "closed":
                drive.status = "closed"

    db.session.commit()
    status_word = "activated" if company.user.is_active else "blacklisted"
    return jsonify({"message": f"Company {status_word} successfully"}), 200


# GET ALL STUDENTS

@admin_bp.route("/students", methods=["GET"])
@login_required
def get_students():
    if not admin_required():
        return jsonify({"error": "Admin access only"}), 403

    students = Student.query.all()
    result = []

    for s in students:
        result.append({
            "student_id": s.id,
            "full_name" : s.full_name,
            "email"     : s.user.email,
            "branch"    : s.branch,
            "cgpa"      : s.cgpa,
            "year"      : s.year,
            "is_active" : s.user.is_active,
            "total_applications": len(s.applications)
        })

    return jsonify(result), 200


# BLACKLIST / ACTIVATE STUDENT

@admin_bp.route("/students/<int:student_id>/blacklist", methods=["PUT"])
@login_required
def blacklist_student(student_id):
    if not admin_required():
        return jsonify({"error": "Admin access only"}), 403

    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    data = request.get_json()
    student.user.is_active = data.get("is_active", False)
    db.session.commit()

    status_word = "activated" if student.user.is_active else "blacklisted"
    return jsonify({"message": f"Student {status_word} successfully"}), 200


# GET ALL DRIVES

@admin_bp.route("/drives", methods=["GET"])
@login_required
def get_drives():
    if not admin_required():
        return jsonify({"error": "Admin access only"}), 403

    from .cache import get_cached, set_cached
    cached = get_cached("admin:drives")
    if cached:
        return jsonify(cached), 200

    drives = PlacementDrive.query.all()
    result = []
    for d in drives:
        result.append({
            "drive_id"           : d.id,
            "drive_name"         : d.drive_name,
            "job_title"          : d.job_title,
            "company_name"       : d.company.company_name,
            "company_id"         : d.company_id,
            "status"             : d.status,
            "application_deadline": str(d.application_deadline) if d.application_deadline else None,
            "total_applications" : len(d.applications)
        })

    set_cached("admin:drives", result, expire_seconds=180)
    return jsonify(result), 200


# UPDATE DRIVE STATUS

@admin_bp.route("/drives/<int:drive_id>/status", methods=["PUT"])
@login_required
def update_drive_status(drive_id):
    if not admin_required():
        return jsonify({"error": "Admin access only"}), 403

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({"error": "Drive not found"}), 404

    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["approved", "rejected", "pending", "closed"]:
        return jsonify({"error": "Invalid status"}), 400

    drive.status = new_status
    db.session.commit()

    from .cache import delete_cached
    delete_cached("admin:drives")
    delete_cached("admin:dashboard")

    return jsonify({"message": f"Drive status updated to {new_status}"}), 200


# GET ALL APPLICATIONS

@admin_bp.route("/applications", methods=["GET"])
@login_required
def get_applications():
    if not admin_required():
        return jsonify({"error": "Admin access only"}), 403

    applications = Application.query.all()
    result = []

    for a in applications:
        result.append({
            "application_id": a.id,
            "student_name"  : a.student.full_name,
            "student_id"    : a.student_id,
            "drive_name"    : a.drive.drive_name,
            "drive_id"      : a.drive_id,
            "company_name"  : a.drive.company.company_name,
            "applied_date"  : str(a.applied_date),
            "status"        : a.status
        })

    return jsonify(result), 200


# SEARCH FUNCTION

@admin_bp.route("/search", methods=["GET"])
@login_required
def search(  ):
    if not admin_required():
        return jsonify({"error": "Admin access only"}), 403

    query     = request.args.get("q", "").strip()
    search_type = request.args.get("type", "all")

    result = {}

    if search_type in ["student", "all"]:
        students = Student.query.filter(
            Student.full_name.ilike(f"%{query}%") | 
            Student.branch.ilike(f"%{query}%")
        ).all()

        result["students"] = [{
            "student_id": s.id,
            "full_name" : s.full_name,
            "email"     : s.user.email,
            "branch"    : s.branch,
            "cgpa"      : s.cgpa,
            "is_active" : s.user.is_active
        } for s in students]

    if search_type in ["company", "all"]:
        companies = Company.query.filter(
            Company.company_name.ilike(f"%{query}%")
        ).all()

        result["companies"] = [{
            "company_id"     : c.id,
            "company_name"   : c.company_name,
            "email"          : c.user.email,
            "approval_status": c.approval_status,
            "is_active"      : c.user.is_active
        } for c in companies]

    if search_type in ["drive", "all"]:
        drives = PlacementDrive.query.filter(
            PlacementDrive.drive_name.ilike(f"%{query}%") |
            PlacementDrive.job_title.ilike(f"%{query}%")
        ).all()

        result["drives"] = [{
            "drive_id"           : d.id,
            "drive_name"         : d.drive_name,
            "job_title"          : d.job_title,
            "company_name"       : d.company.company_name,
            "status"             : d.status,
            "application_deadline": str(d.application_deadline) if d.application_deadline else None
        } for d in drives]

    return jsonify(result), 200