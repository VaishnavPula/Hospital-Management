from flask import Flask
from config import SECRET_KEY
from database.db import init_db, close_db
from routes.main import main_bp
from routes.patients import patients_bp
from routes.doctors import doctors_bp
from routes.appointments import appointments_bp
from routes.billing import billing_bp

app = Flask(__name__)
app.secret_key = SECRET_KEY

app.teardown_appcontext(close_db)

app.register_blueprint(main_bp)
app.register_blueprint(patients_bp)
app.register_blueprint(doctors_bp)
app.register_blueprint(appointments_bp)
app.register_blueprint(billing_bp)

init_db()

if __name__ == "__main__":
    app.run(debug=True)
