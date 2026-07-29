from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()


# USER TABLE
class User(UserMixin, db.Model):
    """
    This table stores all users (admin, student, company)
    Role field decides the type of user
    """
    __tablename__ = "user"

    id         = db.Column(db.Integer, primary_key=True)
    email      = db.Column(db.String(120), unique=True, nullable=False)
    password   = db.Column(db.String(200), nullable=False)  # always stored hashed
    role       = db.Column(db.String(20),  nullable=False)  # "admin" / "company" / "student"
    is_active  = db.Column(db.Boolean, default=True)        # False = blacklisted
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    student_profile = db.relationship("Student", backref="user", uselist=False)
    company_profile = db.relationship("Company", backref="user", uselist=False)


# STUDENT TABLE
class Student(db.Model):
    """
    Stores extra details of student users
    """
    __tablename__ = "student"

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    full_name       = db.Column(db.String(100), nullable=False)
    branch          = db.Column(db.String(100))   
    cgpa            = db.Column(db.Float)          
    year            = db.Column(db.Integer)        
    phone           = db.Column(db.String(20))
    resume_filename = db.Column(db.String(200)) 
    applications = db.relationship("Application", backref="student", lazy=True)


# COMPANY TABLE
class Company(db.Model):
    """
    Stores company details
    """
    __tablename__ = "company"

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    company_name    = db.Column(db.String(150), nullable=False)
    hr_contact      = db.Column(db.String(100))
    website         = db.Column(db.String(200))
    description     = db.Column(db.Text)
    approval_status = db.Column(db.String(20), default="pending")
    drives = db.relationship("PlacementDrive", backref="company", lazy=True)


# PLACEMENT DRIVE
class PlacementDrive(db.Model):
    """
    Job posting created by a company
    """
    __tablename__ = "placement_drive"

    id                   = db.Column(db.Integer, primary_key=True)
    company_id           = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)
    drive_name           = db.Column(db.String(150), nullable=False)
    job_title            = db.Column(db.String(100), nullable=False)
    job_description      = db.Column(db.Text)
    salary               = db.Column(db.Integer)    
    location             = db.Column(db.String(100))

    min_cgpa             = db.Column(db.Float, default=0.0)
    eligible_branches    = db.Column(db.String(300))   
    eligible_year        = db.Column(db.Integer)       

    application_deadline = db.Column(db.DateTime)
    interview_date       = db.Column(db.DateTime, nullable=True)
    status     = db.Column(db.String(20), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    applications = db.relationship("Application", backref="drive")


# APPLICATION TABLE
class Application(db.Model):
    """
    Stores which student applied to which job
    """
    __tablename__ = "application"

    id           = db.Column(db.Integer, primary_key=True)
    student_id   = db.Column(db.Integer, db.ForeignKey("student.id"), nullable=False)
    drive_id     = db.Column(db.Integer, db.ForeignKey("placement_drive.id"), nullable=False)
    applied_date = db.Column(db.DateTime, default=datetime.utcnow)
    status         = db.Column(db.String(20), default="Applied")
    interview_type = db.Column(db.String(50))   # "In-person" or "Online"
    remarks        = db.Column(db.String(300))  # notes from company

    
    __table_args__ = (
        db.UniqueConstraint("student_id", "drive_id", name="unique_application"),
    )