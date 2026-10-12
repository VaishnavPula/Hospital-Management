import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "database.db")

SECRET_KEY = os.getenv("SECRET_KEY", "")

GENDERS = ["Male", "Female", "Other"]

BLOOD_GROUPS = [
    "A+", "A-", "B+", "B-",
    "AB+", "AB-", "O+", "O-"
]

APPOINTMENT_STATUSES = [
    "Scheduled", "Completed", "Cancelled"
]

PAYMENT_STATUSES = [
    "Paid", "Pending"
]
