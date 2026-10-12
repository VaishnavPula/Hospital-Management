from datetime import datetime
from flask import Blueprint, jsonify, request
from config import APPOINTMENT_STATUSES
from database.db import get_db

appointments_bp = Blueprint("appointments", __name__)

def validate_appointment(patient_id, doctor_id, date_value, time_value, reason, status, appointment_id=None):
    errors = []

    try:
        patient_id = int(patient_id)
        doctor_id = int(doctor_id)
    except (ValueError, TypeError):
        errors.append("Select a valid patient and doctor.")

    try:
        selected = datetime.strptime(f"{date_value} {time_value}", "%Y-%m-%d %H:%M")
        if appointment_id is None and selected < datetime.now():
            errors.append("Appointment cannot be in the past.")
    except ValueError:
        errors.append("Enter a valid appointment date and time.")

    if not reason:
        errors.append("Reason is required.")

    if status not in APPOINTMENT_STATUSES:
        errors.append("Select a valid appointment status.")

    db = get_db()

    if not errors:
        if db.execute("SELECT id FROM patients WHERE id=?", (patient_id,)).fetchone() is None:
            errors.append("Select a valid patient.")

        if db.execute("SELECT id FROM doctors WHERE id=?", (doctor_id,)).fetchone() is None:
            errors.append("Select a valid doctor.")

    if not errors:
        query = """
            SELECT id FROM appointments
            WHERE doctor_id=? AND appointment_date=? AND appointment_time=?
            AND status != 'Cancelled'
        """
        values = [doctor_id, date_value, time_value]

        if appointment_id is not None:
            query += " AND id != ?"
            values.append(appointment_id)

        if db.execute(query, values).fetchone():
            errors.append("This doctor already has an appointment at that date and time.")

    return errors

@appointments_bp.route("/api/appointments")
def appointments():
    db = get_db()
    rows = db.execute("""
        SELECT a.*, p.name AS patient_name, p.patient_id,
               d.name AS doctor_name, d.doctor_id
        FROM appointments a
        JOIN patients p ON a.patient_id=p.id
        JOIN doctors d ON a.doctor_id=d.id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
    """).fetchall()

    return jsonify([dict(row) for row in rows])

@appointments_bp.route("/api/appointments/<int:id>")
def get_appointment(id):
    row = get_db().execute("SELECT * FROM appointments WHERE id=?", (id,)).fetchone()

    if row is None:
        return jsonify({"error": "Appointment not found."}), 404

    return jsonify(dict(row))

@appointments_bp.route("/api/appointments", methods=["POST"])
def add_appointment():
    data = request.get_json() or {}

    patient_id = data.get("patient_id", "")
    doctor_id = data.get("doctor_id", "")
    date_value = data.get("appointment_date", "")
    time_value = data.get("appointment_time", "")
    reason = str(data.get("reason", "")).strip()
    status = data.get("status", "Scheduled")

    errors = validate_appointment(
        patient_id, doctor_id, date_value, time_value, reason, status
    )

    if errors:
        return jsonify({"errors": errors}), 400

    db = get_db()
    db.execute("""
        INSERT INTO appointments
        (patient_id, doctor_id, appointment_date, appointment_time, reason, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (patient_id, doctor_id, date_value, time_value, reason, status))
    db.commit()

    return jsonify({"message": "Appointment added successfully."}), 201

@appointments_bp.route("/api/appointments/<int:id>", methods=["PUT"])
def edit_appointment(id):
    db = get_db()

    if db.execute("SELECT id FROM appointments WHERE id=?", (id,)).fetchone() is None:
        return jsonify({"error": "Appointment not found."}), 404

    data = request.get_json() or {}
    patient_id = data.get("patient_id", "")
    doctor_id = data.get("doctor_id", "")
    date_value = data.get("appointment_date", "")
    time_value = data.get("appointment_time", "")
    reason = str(data.get("reason", "")).strip()
    status = data.get("status", "Scheduled")

    errors = validate_appointment(
        patient_id, doctor_id, date_value, time_value, reason, status, id
    )

    if errors:
        return jsonify({"errors": errors}), 400

    db.execute("""
        UPDATE appointments
        SET patient_id=?, doctor_id=?, appointment_date=?,
            appointment_time=?, reason=?, status=?
        WHERE id=?
    """, (patient_id, doctor_id, date_value, time_value, reason, status, id))
    db.commit()

    return jsonify({"message": "Appointment updated successfully."})

@appointments_bp.route("/api/appointments/<int:id>", methods=["DELETE"])
def delete_appointment(id):
    db = get_db()
    db.execute("DELETE FROM appointments WHERE id=?", (id,))
    db.commit()
    return jsonify({"message": "Appointment deleted successfully."})

@appointments_bp.route("/api/appointment-options")
def appointment_options():
    db = get_db()
    patients = db.execute(
        "SELECT id, patient_id, name FROM patients ORDER BY name"
    ).fetchall()
    doctors = db.execute(
        "SELECT id, doctor_id, name, specialization FROM doctors ORDER BY name"
    ).fetchall()

    return jsonify({
        "patients": [dict(row) for row in patients],
        "doctors": [dict(row) for row in doctors],
        "statuses": APPOINTMENT_STATUSES
    })
