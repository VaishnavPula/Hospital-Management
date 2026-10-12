import sqlite3
from flask import Blueprint, jsonify, request
from database.db import get_db, next_id
from utils.validation import clean_phone, is_valid_phone, is_valid_email

doctors_bp = Blueprint("doctors", __name__)

def validate_doctor(name, specialization, phone, email, available_time):
    errors = []

    if not name:
        errors.append("Name is required.")
    if not specialization:
        errors.append("Specialization is required.")
    if not is_valid_phone(phone):
        errors.append("Enter a valid phone number.")
    if email and not is_valid_email(email):
        errors.append("Enter a valid email.")
    if not available_time:
        errors.append("Available time is required.")

    return errors

@doctors_bp.route("/api/doctors")
def doctors():
    search = request.args.get("search", "").strip()
    db = get_db()

    if search:
        rows = db.execute("""
            SELECT * FROM doctors
            WHERE doctor_id LIKE ? OR name LIKE ? OR specialization LIKE ?
            ORDER BY id DESC
        """, (f"%{search}%", f"%{search}%", f"%{search}%")).fetchall()
    else:
        rows = db.execute("SELECT * FROM doctors ORDER BY id DESC").fetchall()

    return jsonify([dict(row) for row in rows])

@doctors_bp.route("/api/doctors/<int:id>")
def get_doctor(id):
    row = get_db().execute("SELECT * FROM doctors WHERE id=?", (id,)).fetchone()

    if row is None:
        return jsonify({"error": "Doctor not found."}), 404

    return jsonify(dict(row))

@doctors_bp.route("/api/doctors", methods=["POST"])
def add_doctor():
    data = request.get_json() or {}

    name = str(data.get("name", "")).strip()
    specialization = str(data.get("specialization", "")).strip()
    phone = clean_phone(str(data.get("phone", "")).strip())
    email = str(data.get("email", "")).strip()
    available_time = str(data.get("available_time", "")).strip()

    errors = validate_doctor(name, specialization, phone, email, available_time)

    if errors:
        return jsonify({"errors": errors}), 400

    db = get_db()
    doctor_id = next_id("doctors", "doctor_id", "D")

    try:
        db.execute("""
            INSERT INTO doctors
            (doctor_id, name, specialization, phone, email, available_time)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (doctor_id, name, specialization, phone, email, available_time))
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"errors": ["Could not create doctor."]}), 400

    return jsonify({"message": "Doctor added successfully."}), 201

@doctors_bp.route("/api/doctors/<int:id>", methods=["PUT"])
def edit_doctor(id):
    db = get_db()
    if db.execute("SELECT id FROM doctors WHERE id=?", (id,)).fetchone() is None:
        return jsonify({"error": "Doctor not found."}), 404

    data = request.get_json() or {}
    name = str(data.get("name", "")).strip()
    specialization = str(data.get("specialization", "")).strip()
    phone = clean_phone(str(data.get("phone", "")).strip())
    email = str(data.get("email", "")).strip()
    available_time = str(data.get("available_time", "")).strip()

    errors = validate_doctor(name, specialization, phone, email, available_time)

    if errors:
        return jsonify({"errors": errors}), 400

    db.execute("""
        UPDATE doctors
        SET name=?, specialization=?, phone=?, email=?, available_time=?
        WHERE id=?
    """, (name, specialization, phone, email, available_time, id))
    db.commit()

    return jsonify({"message": "Doctor updated successfully."})

@doctors_bp.route("/api/doctors/<int:id>", methods=["DELETE"])
def delete_doctor(id):
    db = get_db()
    db.execute("DELETE FROM doctors WHERE id=?", (id,))
    db.commit()
    return jsonify({"message": "Doctor deleted successfully."})

@doctors_bp.route("/api/doctor-options")
def doctor_options():
    rows = get_db().execute(
        "SELECT id, doctor_id, name, specialization FROM doctors ORDER BY name"
    ).fetchall()
    return jsonify([dict(row) for row in rows])
