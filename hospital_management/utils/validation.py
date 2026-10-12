import re

def clean_phone(phone):
    return phone.replace(" ", "").replace("-", "")

def is_valid_phone(phone):
    return re.fullmatch(r"\+?[0-9]{10,13}", phone) is not None

def is_valid_email(email):
    return re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email) is not None

def to_money(value):
    try:
        amount = float(value)
    except (ValueError, TypeError):
        return None

    if amount < 0:
        return None

    return amount
