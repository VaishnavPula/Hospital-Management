import sqlite3
from flask import Blueprint, jsonify, request
from config import GENDERS, BLOOD_GROUPS
from database.db import get_db, next_id
from utils.validation import clean_phone, is_valid_phone, is_valid_email

patients_bp = Blueprint("patients", __name__)

def patient_data(row):
    return dict(row)

def validate_patient(name, age, gender, phone, email, blood_group):
    errors = []

    try:
        age = int(age)
        if age <= 0 or age > 150:
            errors.append("Enter a valid age.")
    except (ValueError, TypeError):
        errors.append("Age must be a number.")

    if not name:
        errors.append("Name is required.")
    if gender not in GENDERS:
        errors.append("Select a valid gender.")
    if not is_valid_phone(phone):
        errors.append("Enter a valid phone number.")
    if email and not is_valid_email(email):
        errors.append("Enter a valid email.")
    if blood_group not in BLOOD_GROUPS:
        errors.append("Select a valid blood group.")

    return errors

@patients_bp.route("/api/patients")
def patients():
    db = get_db()
    search = request.args.get("search", "").strip()

    if search:
        rows = db.execute("""
            SELECT * FROM patients
            WHERE patient_id LIKE ? OR name LIKE ? OR phone LIKE ?
            ORDER BY id DESC
        """, (f"%{search}%", f"%{search}%", f"%{search}%")).fetchall()
    else:
        rows = db.execute("SELECT * FROM patients ORDER BY id DESC").fetchall()

    return jsonify([patient_data(row) for row in rows])

@patients_bp.route("/api/patients/<int:id>")
def get_patient(id):
    row = get_db().execute("SELECT * FROM patients WHERE id=?", (id,)).fetchone()

    if row is None:
        return jsonify({"error": "Patient not found."}), 404

    return jsonify(patient_data(row))

@patients_bp.route("/api/patients", methods=["POST"])
def add_patient():
    data = request.get_json() or {}

    name = str(data.get("name", "")).strip()
    age = str(data.get("age", "")).strip()
    gender = data.get("gender", "")
    phone = clean_phone(str(data.get("phone", "")).strip())
    email = str(data.get("email", "")).strip()
    address = str(data.get("address", "")).strip()
    blood_group = data.get("blood_group", "")

    errors = validate_patient(name, age, gender, phone, email, blood_group)

    if errors:
        return jsonify({"errors": errors}), 400

    db = get_db()
    patient_id = next_id("patients", "patient_id", "P")

    try:
        db.execute("""
            INSERT INTO patients
            (patient_id, name, age, gender, phone, email, address, blood_group)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (patient_id, name, int(age), gender, phone, email, address, blood_group))
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"errors": ["Could not create patient."]}), 400

    return jsonify({"message": "Patient added successfully."}), 201

@patients_bp.route("/api/patients/<int:id>", methods=["PUT"])
def edit_patient(id):
    db = get_db()
    if db.execute("SELECT id FROM patients WHERE id=?", (id,)).fetchone() is None:
        return jsonify({"error": "Patient not found."}), 404

    data = request.get_json() or {}
    name = str(data.get("name", "")).strip()
    age = str(data.get("age", "")).strip()
    gender = data.get("gender", "")
    phone = clean_phone(str(data.get("phone", "")).strip())
    email = str(data.get("email", "")).strip()
    address = str(data.get("address", "")).strip()
    blood_group = data.get("blood_group", "")

    errors = validate_patient(name, age, gender, phone, email, blood_group)

    if errors:
        return jsonify({"errors": errors}), 400

    db.execute("""
        UPDATE patients
        SET name=?, age=?, gender=?, phone=?, email=?, address=?, blood_group=?
        WHERE id=?
    """, (name, int(age), gender, phone, email, address, blood_group, id))
    db.commit()

    return jsonify({"message": "Patient updated successfully."})

@patients_bp.route("/api/patients/<int:id>", methods=["DELETE"])
def delete_patient(id):
    db = get_db()
    db.execute("DELETE FROM patients WHERE id=?", (id,))
    db.commit()
    return jsonify({"message": "Patient deleted successfully."})

@patients_bp.route("/api/patient-options")
def patient_options():
    rows = get_db().execute(
        "SELECT id, patient_id, name FROM patients ORDER BY name"
    ).fetchall()
    return jsonify([dict(row) for row in rows])
