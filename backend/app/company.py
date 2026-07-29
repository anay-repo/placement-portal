from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from .models import db, User, Student, Company, PlacementDrive, Application
from datetime import datetime

company_bp = Blueprint("company", __name__)

def company_required():
    if not current_user.is_authenticated or current_user.role != "company":
        return False
    return True


# COMPANY DASHBOARD

@company_bp.route("/dashboard", methods=["GET"])
@login_required
def dashboard():
    if not company_required():
        return jsonify({"error": "Company access only"}), 403

    company = current_user.company_profile

    if not company:
        return jsonify({"error": "Company profile not found"}), 404

    drives_data = []
    for drive in company.drives:
        drives_data.append({
            "drive_id"           : drive.id,
            "drive_name"         : drive.drive_name,
            "job_title"          : drive.job_title,
            "status"             : drive.status,
            "application_deadline": str(drive.application_deadline) if drive.application_deadline else None,
            "total_applicants"   : len(drive.applications)
        })

    return jsonify({
        "company_id"     : company.id,
        "company_name"   : company.company_name,
        "hr_contact"     : company.hr_contact,
        "website"        : company.website,
        "description"    : company.description,
        "approval_status": company.approval_status,
        "drives"         : drives_data
    }), 200


# CREATE NEW DRIVE

@company_bp.route("/drives", methods=["POST"])
@login_required
def create_drive():
    if not company_required():
        return jsonify({"error": "Company access only"}), 403

    company = current_user.company_profile

    if company.approval_status != "approved":
        return jsonify({"error": "Your company is not approved yet. Wait for admin approval."}), 403

    data = request.get_json()

    if not data.get("drive_name") or not data.get("job_title"):
        return jsonify({"error": "Drive name and job title are required"}), 400

    deadline = None
    if data.get("application_deadline"):
        try:
            deadline = datetime.strptime(data["application_deadline"], "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    new_drive = PlacementDrive(
        company_id           = company.id,
        drive_name           = data["drive_name"],
        job_title            = data["job_title"],
        job_description      = data.get("job_description", ""),
        salary               = data.get("salary", ""),
        location             = data.get("location", ""),
        min_cgpa             = data.get("min_cgpa", 0.0),
        eligible_branches    = data.get("eligible_branches", ""),  
        eligible_year        = data.get("eligible_year", None),
        application_deadline = deadline,
        status               = "pending"
    )

    db.session.add(new_drive)
    db.session.commit()

    return jsonify({"message": "Drive created successfully. Waiting for admin approval.", "drive_id": new_drive.id}), 201


# GET ALL COMPANY DRIVES

@company_bp.route("/drives", methods=["GET"])
@login_required
def get_my_drives():
    if not company_required():
        return jsonify({"error": "Company access only"}), 403

    company = current_user.company_profile
    result  = []

    for drive in company.drives:
        result.append({
            "drive_id"           : drive.id,
            "drive_name"         : drive.drive_name,
            "job_title"          : drive.job_title,
            "job_description"    : drive.job_description,
            "salary"             : drive.salary,
            "location"           : drive.location,
            "min_cgpa"           : drive.min_cgpa,
            "eligible_branches"  : drive.eligible_branches,
            "eligible_year"      : drive.eligible_year,
            "status"             : drive.status,
            "application_deadline": str(drive.application_deadline) if drive.application_deadline else None,
            "total_applicants"   : len(drive.applications)
        })

    return jsonify(result), 200


# GET APPLICATIONS FOR A DRIVE

@company_bp.route("/drives/<int:drive_id>/applications", methods=["GET"])
@login_required
def get_drive_applications(drive_id):
    if not company_required():
        return jsonify({"error": "Company access only"}), 403

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({"error": "Drive not found"}), 404

    if drive.company_id != current_user.company_profile.id:
        return jsonify({"error": "This drive does not belong to your company"}), 403

    result = []
    for app in drive.applications:
        s = app.student
        result.append({
            "application_id": app.id,
            "student_id"    : s.id,
            "full_name"     : s.full_name,
            "branch"        : s.branch,
            "cgpa"          : s.cgpa,
            "year"          : s.year,
            "email"         : s.user.email,
            "phone"         : s.phone,
            "resume"        : s.resume_filename,
            "applied_date"  : str(app.applied_date),
            "status"        : app.status,
            "interview_type": app.interview_type,
            "remarks"       : app.remarks
        })

    return jsonify(result), 200


# UPDATE APPLICATION STATUS

@company_bp.route("/applications/<int:application_id>/status", methods=["PUT"])
@login_required
def update_application_status(application_id):
    if not company_required():
        return jsonify({"error": "Company access only"}), 403

    application = Application.query.get(application_id)
    if not application:
        return jsonify({"error": "Application not found"}), 404

    if application.drive.company_id != current_user.company_profile.id:
        return jsonify({"error": "Access denied"}), 403

    data       = request.get_json()
    new_status = data.get("status")

    if new_status not in ["Applied", "Shortlisted", "Selected", "Rejected", "Waiting"]:
        return jsonify({"error": "Invalid status"}), 400

    # Update fields
    application.status         = new_status
    application.interview_type = data.get("interview_type", application.interview_type)
    application.remarks        = data.get("remarks", application.remarks)

    db.session.commit()

    return jsonify({"message": f"Application status updated to {new_status}"}), 200


# SET INTERVIEW DATE

@company_bp.route("/drives/<int:drive_id>/interview", methods=["PUT"])
@login_required
def set_interview_date(drive_id):
    if not company_required():
        return jsonify({"error": "Company access only"}), 403

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({"error": "Drive not found"}), 404

    if drive.company_id != current_user.company_profile.id:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()
    try:
        drive.interview_date = datetime.strptime(data["interview_date"], "%Y-%m-%d")
    except (ValueError, KeyError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    db.session.commit()
    return jsonify({"message": "Interview date set successfully"}), 200


# CLOSE DRIVE

@company_bp.route("/drives/<int:drive_id>/close", methods=["PUT"])
@login_required
def close_drive(drive_id):
    if not company_required():
        return jsonify({"error": "Company access only"}), 403

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({"error": "Drive not found"}), 404

    if drive.company_id != current_user.company_profile.id:
        return jsonify({"error": "Access denied"}), 403

    drive.status = "closed"
    db.session.commit()

    return jsonify({"message": "Drive marked as closed"}), 200


# GET SINGLE DRIVE DETAILS

@company_bp.route("/drives/<int:drive_id>", methods=["GET"])
@login_required
def get_drive_detail(drive_id):
    if not company_required():
        return jsonify({"error": "Company access only"}), 403

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({"error": "Drive not found"}), 404

    if drive.company_id != current_user.company_profile.id:
        return jsonify({"error": "Access denied"}), 403

    return jsonify({
        "drive_id"           : drive.id,
        "drive_name"         : drive.drive_name,
        "job_title"          : drive.job_title,
        "job_description"    : drive.job_description,
        "salary"             : drive.salary,
        "location"           : drive.location,
        "min_cgpa"           : drive.min_cgpa,
        "eligible_branches"  : drive.eligible_branches,
        "eligible_year"      : drive.eligible_year,
        "status"             : drive.status,
        "application_deadline": str(drive.application_deadline) if drive.application_deadline else None,
        "interview_date"     : str(drive.interview_date) if drive.interview_date else None,
        "total_applicants"   : len(drive.applications)
    }), 200