import os
from flask import Blueprint, jsonify, send_from_directory
from database.db import get_db

main_bp = Blueprint("main", __name__)
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")

@main_bp.route("/")
def dashboard_page():
    return send_from_directory(TEMPLATE_DIR, "index.html")

@main_bp.route("/<page>.html")
def page(page):
    allowed = {
        "index", "patients", "doctors", "appointments", "billing",
        "add_patient", "add_doctor", "add_appointment", "add_bill"
    }

    if page not in allowed:
        return "Page not found", 404

    return send_from_directory(TEMPLATE_DIR, page + ".html")

@main_bp.route("/api/dashboard")
def dashboard():
    db = get_db()

    return jsonify({
        "patients": db.execute("SELECT COUNT(*) FROM patients").fetchone()[0],
        "doctors": db.execute("SELECT COUNT(*) FROM doctors").fetchone()[0],
        "appointments": db.execute("SELECT COUNT(*) FROM appointments").fetchone()[0],
        "bills": db.execute("SELECT COUNT(*) FROM bills").fetchone()[0]
    })
