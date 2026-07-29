from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_login import login_required, current_user
from .models import db, Company, PlacementDrive, Application
from datetime import datetime
import os
import csv

student_bp = Blueprint("student", __name__)


def _generate_student_csv(student, folder):
    """Generate CSV file of applications"""
    filename = f"student_{student.id}_applications.csv"
    file_path = os.path.join(folder, filename)

    applications = Application.query.filter_by(student_id=student.id).all()

    with open(file_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Student ID", "Student Name", "Company Name",
            "Drive Title", "Job Title", "Status",
            "Applied Date", "Interview Type", "Remarks"
        ])
        for a in applications:
            writer.writerow([
                student.id,
                student.full_name,
                a.drive.company.company_name,
                a.drive.drive_name,
                a.drive.job_title,
                a.status,
                str(a.applied_date),
                a.interview_type or "",
                a.remarks or ""
            ])

    return filename


def student_required():
    if not current_user.is_authenticated or current_user.role != "student":
        return False
    return True


# GET ALL DRIVES

@student_bp.route("/drives", methods=["GET"])
@login_required
def get_drives():
    if not student_required():
        return jsonify({"error": "Student access only"}), 403

    search   = request.args.get("search", "").strip()
    # approved drives
    query = PlacementDrive.query.filter_by(status="approved")

    if search:
        query = query.join(Company).filter(
            PlacementDrive.drive_name.ilike(f"%{search}%") |
            PlacementDrive.job_title.ilike(f"%{search}%") |
            Company.company_name.ilike(f"%{search}%")
        )

    drives = query.all()
    student = current_user.student_profile
    result  = []

    for drive in drives:
        already_applied = Application.query.filter_by(
            student_id=student.id,
            drive_id=drive.id
        ).first() is not None

        eligible = True
        reasons  = []

        if drive.min_cgpa and student.cgpa and student.cgpa < drive.min_cgpa:
            eligible = False
            reasons.append(f"Minimum CGPA required: {drive.min_cgpa}")

        if drive.eligible_branches and student.branch:
            allowed = [b.strip() for b in drive.eligible_branches.split(",")]
            if student.branch not in allowed:
                eligible = False
                reasons.append(f"Eligible branches: {drive.eligible_branches}")

        if drive.eligible_year and student.year and student.year != drive.eligible_year:
            eligible = False
            reasons.append(f"Only year {drive.eligible_year} students can apply")

        result.append({
            "drive_id"           : drive.id,
            "drive_name"         : drive.drive_name,
            "job_title"          : drive.job_title,
            "job_description"    : drive.job_description,
            "salary"             : drive.salary,
            "location"           : drive.location,
            "company_name"       : drive.company.company_name,
            "company_description": drive.company.description,
            "min_cgpa"           : drive.min_cgpa,
            "eligible_branches"  : drive.eligible_branches,
            "eligible_year"      : drive.eligible_year,
            "application_deadline": str(drive.application_deadline) if drive.application_deadline else None,
            "already_applied"    : already_applied,
            "eligible"           : eligible,
            "ineligible_reasons" : reasons
        })

    return jsonify(result), 200


# APPLY TO DRIVE

@student_bp.route("/drives/<int:drive_id>/apply", methods=["POST"])
@login_required
def apply_drive(drive_id):
    if not student_required():
        return jsonify({"error": "Student access only"}), 403

    student = current_user.student_profile
    drive   = PlacementDrive.query.get(drive_id)

    if not drive:
        return jsonify({"error": "Drive not found"}), 404

    if drive.status != "approved":
        return jsonify({"error": "This drive is not open for applications"}), 400

    if drive.application_deadline and datetime.utcnow() > drive.application_deadline:
        return jsonify({"error": "Application deadline has passed"}), 400

    existing = Application.query.filter_by(
        student_id=student.id,
        drive_id=drive_id
    ).first()
    if existing:
        return jsonify({"error": "You have already applied to this drive"}), 400

    if drive.min_cgpa and student.cgpa and student.cgpa < drive.min_cgpa:
        return jsonify({"error": f"Your CGPA {student.cgpa} is below the minimum required {drive.min_cgpa}"}), 400

    if drive.eligible_branches and student.branch:
        allowed = [b.strip() for b in drive.eligible_branches.split(",")]
        if student.branch not in allowed:
            return jsonify({"error": f"Your branch {student.branch} is not eligible for this drive"}), 400

    if drive.eligible_year and student.year and student.year != drive.eligible_year:
        return jsonify({"error": f"Only year {drive.eligible_year} students can apply"}), 400

    new_application = Application(
        student_id=student.id,
        drive_id=drive_id,
        status="Applied"
    )
    db.session.add(new_application)
    db.session.commit()

    return jsonify({"message": "Application submitted successfully"}), 201


# VIEW APPLICATIONS

@student_bp.route("/applications", methods=["GET"])
@login_required
def my_applications():
    if not student_required():
        return jsonify({"error": "Student access only"}), 403

    student      = current_user.student_profile
    applications = Application.query.filter_by(student_id=student.id).all()
    result       = []

    for app in applications:
        result.append({
            "application_id": app.id,
            "drive_name"    : app.drive.drive_name,
            "job_title"     : app.drive.job_title,
            "company_name"  : app.drive.company.company_name,
            "applied_date"  : str(app.applied_date),
            "status"        : app.status,
            "interview_type": app.interview_type,
            "interview_date": str(app.drive.interview_date) if app.drive.interview_date else None,
            "remarks"       : app.remarks,
            "salary"        : app.drive.salary,
            "location"      : app.drive.location
        })

    return jsonify(result), 200


# GET PROFILE

@student_bp.route("/profile", methods=["GET"])
@login_required
def get_profile():
    if not student_required():
        return jsonify({"error": "Student access only"}), 403

    s = current_user.student_profile

    return jsonify({
        "student_id"     : s.id,
        "full_name"      : s.full_name,
        "email"          : current_user.email,
        "branch"         : s.branch,
        "cgpa"           : s.cgpa,
        "year"           : s.year,
        "phone"          : s.phone,
        "resume_filename": s.resume_filename
    }), 200


# UPDATE PROFILE


@student_bp.route("/profile", methods=["PUT"])
@login_required
def update_profile():
    if not student_required():
        return jsonify({"error": "Student access only"}), 403

    s    = current_user.student_profile
    data = request.get_json()

    s.full_name = data.get("full_name", s.full_name)
    s.branch    = data.get("branch",    s.branch)
    s.cgpa      = data.get("cgpa",      s.cgpa)
    s.year      = data.get("year",      s.year)
    s.phone     = data.get("phone",     s.phone)

    db.session.commit()
    return jsonify({"message": "Profile updated successfully"}), 200


# UPLOAD RESUME

@student_bp.route("/upload-resume", methods=["POST"])
@login_required
def upload_resume():
    if not student_required():
        return jsonify({"error": "Student access only"}), 403

    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["resume"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    allowed = current_app.config["ALLOWED_EXTENSIONS"]
    ext     = file.filename.rsplit(".", 1)[-1].lower()

    if ext not in allowed:
        return jsonify({"error": "Only PDF and DOCX files are allowed"}), 400

    student        = current_user.student_profile
    filename       = f"student_{student.id}_resume.{ext}"
    save_path      = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    file.save(save_path)

    student.resume_filename = filename
    db.session.commit()

    return jsonify({"message": "Resume uploaded successfully", "filename": filename}), 200


# DOWNLOAD RESUME

@student_bp.route("/resume/<filename>", methods=["GET"])
@login_required
def get_resume(filename):
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    return send_from_directory(upload_folder, filename)

# EXPORT CSV

@student_bp.route("/export-csv", methods=["POST"])
@login_required
def export_csv():
    if not student_required():
        return jsonify({"error": "Student access only"}), 403

    from .tasks import export_applications_csv
    student = current_user.student_profile
    task    = export_applications_csv.delay(student.id)

    return jsonify({
        "message": "Export started! File will be ready shortly.",
        "task_id": task.id
    }), 202

# EXPORT STATUS

@student_bp.route("/export-status/<task_id>", methods=["GET"])
@login_required
def export_status(task_id):
    from .tasks import celery_app
    task = celery_app.AsyncResult(task_id)
    return jsonify({
        "status": task.status,
        "result": task.result if task.status == "SUCCESS" else None
    }), 200


@student_bp.route("/download-csv", methods=["GET"])
@login_required
def download_csv():
    if not student_required():
        return jsonify({"error": "Student access only"}), 403

    student  = current_user.student_profile
    filename = f"student_{student.id}_applications.csv"
    folder   = current_app.config["UPLOAD_FOLDER"]

    file_path = os.path.join(folder, filename)

    if not os.path.exists(file_path):
        try:
            filename = _generate_student_csv(student, folder)
        except Exception:
            return jsonify({"error": "CSV generation failed. Please try again."}), 500

    return send_from_directory(folder, filename, as_attachment=True)