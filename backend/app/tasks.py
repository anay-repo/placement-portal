from celery import Celery
from celery.schedules import crontab
from config import Config
import csv, io, os
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# CREATE CELERY INSTANCE

celery_app = Celery(
    "placement_tasks",
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer   = "json",
    result_serializer = "json",
    accept_content    = ["json"],
    timezone          = Config.CELERY_TIMEZONE,
    enable_utc        = False
)


def _scheduler_log_path():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(backend_dir, "scheduler_debug.log")


def _append_scheduler_log(task_name, message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(_scheduler_log_path(), "a", encoding="utf-8") as log_file:
        log_file.write(f"[{timestamp}] {task_name}: {message}\n")


def _send_email(recipient_email, subject, html_body):
    """Send email using SMTP"""
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = Config.MAIL_DEFAULT_SENDER
        msg["To"] = recipient_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        server = smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT)
        server.starttls()
        server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        _append_scheduler_log("_send_email", f"Failed to {recipient_email}: {str(e)}")
        return False


def get_flask_app():
    from app import create_app
    return create_app()


# TASK 1: DAILY REMINDERS

@celery_app.task(name="placement_tasks.send_daily_reminders")
def send_daily_reminders():
    _append_scheduler_log("send_daily_reminders", "started")
    app = get_flask_app()
    with app.app_context():
        from app.models import Student, PlacementDrive, Application

        now        = datetime.utcnow()
        three_days = now + timedelta(days=3)

        upcoming = PlacementDrive.query.filter(
            PlacementDrive.status == "approved",
            PlacementDrive.application_deadline >= now,
            PlacementDrive.application_deadline <= three_days
        ).all()

        students = Student.query.all()
        count    = 0

        for student in students:
            if not student.user.is_active:
                continue

            applied_ids = [a.drive_id for a in student.applications]

            for drive in upcoming:
                if drive.id not in applied_ids:
                    html = f"""
                    <html>
                        <body style="font-family: Arial, sans-serif; color: #333;">
                            <h2>Application Deadline Reminder</h2>
                            <p>Dear {student.full_name},</p>
                            <p>This is a reminder that the application deadline for the following placement drive is approaching:</p>
                            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                                <p><strong>Drive:</strong> {drive.drive_name}</p>
                                <p><strong>Job Title:</strong> {drive.job_title}</p>
                                <p><strong>Company:</strong> {drive.company.company_name}</p>
                                <p><strong>Deadline:</strong> {drive.application_deadline.strftime('%Y-%m-%d %H:%M:%S') if drive.application_deadline else 'N/A'}</p>
                            </div>
                            <p>Don't miss this opportunity! Apply now through the Placement Portal.</p>
                            <p>Best regards,<br> Placement Portal Team</p>
                        </body>
                    </html>
                    """
                    subject = f"Reminder: Apply for {drive.drive_name} before deadline"
                    if _send_email(student.user.email, subject, html):
                        count += 1
                        _append_scheduler_log("send_daily_reminders", f"email sent to {student.user.email}")

        result = f"Sent {count} reminders"
        _append_scheduler_log("send_daily_reminders", result)
        return result


# TASK 2: MONTHLY REPORT

@celery_app.task(name="placement_tasks.send_monthly_report")
def send_monthly_report():
    _append_scheduler_log("send_monthly_report", "started")
    app = get_flask_app()
    with app.app_context():
        from app.models import Student, Company, PlacementDrive, Application, User

        now        = datetime.utcnow()
        month_name = now.strftime("%B %Y")

        total_students     = Student.query.count()
        total_companies    = Company.query.count()
        total_drives       = PlacementDrive.query.count()
        approved_drives    = PlacementDrive.query.filter_by(status="approved").count()
        closed_drives      = PlacementDrive.query.filter_by(status="closed").count()
        total_applications = Application.query.count()
        selected_students  = Application.query.filter_by(status="Selected").count()

        admin = User.query.filter_by(role="admin").first()
        admin_email = admin.email if admin else None

        if admin_email:
            html = f"""
            <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Monthly Placement Activity Report — {month_name}</h2>
                    <p>Dear Administrator,</p>
                    <p>Please find the monthly placement statistics below:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background-color: #007bff; color: white;">
                            <th style="padding: 10px; text-align: left;">Metric</th>
                            <th style="padding: 10px; text-align: right;">Count</th>
                        </tr>
                        <tr style="background-color: #f5f5f5;">
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">Total Students</td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;"><strong>{total_students}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">Total Companies</td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;"><strong>{total_companies}</strong></td>
                        </tr>
                        <tr style="background-color: #f5f5f5;">
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">Total Placement Drives</td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;"><strong>{total_drives}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">Approved Drives</td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;"><strong>{approved_drives}</strong></td>
                        </tr>
                        <tr style="background-color: #f5f5f5;">
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">Closed Drives</td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;"><strong>{closed_drives}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">Total Applications</td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;"><strong>{total_applications}</strong></td>
                        </tr>
                        <tr style="background-color: #e8f5e9;">
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Students Selected</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;"><strong style="color: #28a745; font-size: 18px;">{selected_students}</strong></td>
                        </tr>
                    </table>
                    <p>For more details, please log in to the Placement Portal Admin Dashboard.</p>
                    <p>Best regards,<br> Placement Portal Scheduler</p>
                </body>
            </html>
            """
            subject = f"Monthly Placement Report — {month_name}"
            _send_email(admin_email, subject, html)
            _append_scheduler_log("send_monthly_report", f"email sent to {admin_email}")

        result = {"month": month_name, "total_students": total_students,
                  "total_drives": total_drives, "placed": selected_students}
        _append_scheduler_log("send_monthly_report", f"completed for {month_name}")
        return result


# TASK 3: EXPORT CSV

@celery_app.task(name="placement_tasks.export_applications_csv")
def export_applications_csv(student_id):
    app = get_flask_app()
    with app.app_context():
        from app.models import Student, Application

        student      = Student.query.get(student_id)
        applications = Application.query.filter_by(student_id=student_id).all()

        output = io.StringIO()
        writer = csv.writer(output)

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

        csv_filename = f"student_{student_id}_applications.csv"
        upload_folder = app.config["UPLOAD_FOLDER"]
        os.makedirs(upload_folder, exist_ok=True)
        csv_path     = os.path.join(upload_folder, csv_filename)

        with open(csv_path, "w", newline="") as f:
            f.write(output.getvalue())

        print(f"CSV exported for student {student_id}: {csv_filename}")
        return {"status": "done", "filename": csv_filename}


@celery_app.task(name="placement_tasks.scheduler_heartbeat")
def scheduler_heartbeat():
    _append_scheduler_log("scheduler_heartbeat", "beat is running")
    return {"status": "ok"}

# HEARTBEAT TASK (DEBUGGING)

celery_app.conf.beat_schedule = {
    "scheduler-heartbeat-every-minute": {
        "task"    : "placement_tasks.scheduler_heartbeat",
        "schedule": crontab()
    },
    "daily-reminders": {
        "task"    : "placement_tasks.send_daily_reminders",
        "schedule": crontab(hour=8, minute=0)
    },
    "monthly-report": {
        "task"    : "placement_tasks.send_monthly_report",
        "schedule": crontab(day_of_month=1, hour=9, minute=0)
    }
}