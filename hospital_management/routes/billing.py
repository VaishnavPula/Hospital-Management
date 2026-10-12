from datetime import date
from flask import Blueprint, jsonify, request
from config import PAYMENT_STATUSES
from database.db import get_db
from utils.validation import to_money

billing_bp = Blueprint("billing", __name__)

@billing_bp.route("/api/bills")
def billing():
    db = get_db()
    rows = db.execute("""
        SELECT b.*, p.name AS patient_name, p.patient_id
        FROM bills b
        JOIN patients p ON b.patient_id=p.id
        ORDER BY b.id DESC
    """).fetchall()

    return jsonify([dict(row) for row in rows])

@billing_bp.route("/api/bills/<int:id>")
def get_bill(id):
    row = get_db().execute("SELECT * FROM bills WHERE id=?", (id,)).fetchone()

    if row is None:
        return jsonify({"error": "Bill not found."}), 404

    return jsonify(dict(row))

@billing_bp.route("/api/bills", methods=["POST"])
def add_bill():
    data = request.get_json() or {}

    patient_id = data.get("patient_id", "")
    consultation = to_money(data.get("consultation_fee"))
    other = to_money(data.get("other_charges", 0))
    status = data.get("payment_status", "Pending")

    errors = []

    try:
        patient_id = int(patient_id)
    except (ValueError, TypeError):
        errors.append("Select a valid patient.")

    if consultation is None:
        errors.append("Enter a valid consultation fee.")

    if other is None:
        errors.append("Enter valid other charges.")

    if status not in PAYMENT_STATUSES:
        errors.append("Select a valid payment status.")

    if not errors:
        db = get_db()

        if db.execute("SELECT id FROM patients WHERE id=?", (patient_id,)).fetchone() is None:
            errors.append("Select a valid patient.")

    if errors:
        return jsonify({"errors": errors}), 400

    total = consultation + other
    db = get_db()

    db.execute("""
        INSERT INTO bills
        (patient_id, consultation_fee, other_charges,
         total_amount, payment_status, bill_date)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        patient_id, consultation, other, total,
        status, date.today().isoformat()
    ))

    db.commit()

    return jsonify({"message": "Bill added successfully."}), 201

@billing_bp.route("/api/bills/<int:id>/pay", methods=["PUT"])
def pay_bill(id):
    db = get_db()
    db.execute(
        "UPDATE bills SET payment_status='Paid' WHERE id=?", (id,)
    )
    db.commit()
    return jsonify({"message": "Bill marked as paid."})

@billing_bp.route("/api/bills/<int:id>", methods=["DELETE"])
def delete_bill(id):
    db = get_db()
    db.execute("DELETE FROM bills WHERE id=?", (id,))
    db.commit()
    return jsonify({"message": "Bill deleted successfully."})

@billing_bp.route("/api/bill-options")
def bill_options():
    rows = get_db().execute(
        "SELECT id, patient_id, name FROM patients ORDER BY name"
    ).fetchall()

    return jsonify({
        "patients": [dict(row) for row in rows],
        "statuses": PAYMENT_STATUSES
    })
