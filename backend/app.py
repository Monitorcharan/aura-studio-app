from flask import Flask, send_from_directory
import os
from config import db
from routes.authRoutes import auth_bp
from routes.appointmentRoutes import appointment_bp
from routes.serviceRoutes import service_bp
from routes.paymentRoutes import payment_bp
from routes.adminRoutes import admin_bp
from routes.virtualMirrorRoutes import virtual_mirror_bp
import bcrypt

app = Flask(__name__)

app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(appointment_bp, url_prefix='/api')
app.register_blueprint(service_bp, url_prefix='/api')
app.register_blueprint(payment_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(virtual_mirror_bp, url_prefix='/api')


# Ensure a single admin user exists at startup
def ensure_admin_exists():
    users = db['users']
    admin_email = 'admin'
    admin_password = 'admin@123'
    existing = users.find_one({'email': admin_email})
    hashed = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())

    if existing:
        # If user exists but isn't admin, promote and update password
        if existing.get('role') != 'admin':
            users.update_one({'_id': existing['_id']}, {'$set': {'role': 'admin', 'password': hashed, 'username': 'admin'}})
            print(f"Promoted existing user '{admin_email}' to admin and updated password.")
        else:
            # Optionally update password to the requested one
            users.update_one({'_id': existing['_id']}, {'$set': {'password': hashed, 'username': 'admin'}})
            print(f"Admin user '{admin_email}' already exists; password updated.")
    else:
        user = {
            'name': 'admin',
            'email': admin_email,
            'username': 'admin',
            'password': hashed,
            'phone': '',
            'role': 'admin'
        }
        result = users.insert_one(user)
        print(f"Created admin user 'admin' with id={result.inserted_id}")

# Serve frontend if available (optional)
PARENT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(PARENT, 'frontend', 'dist')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    file_path = os.path.join(STATIC_DIR, path)
    if path != '' and os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(STATIC_DIR, path)
    else:
        if os.path.exists(os.path.join(STATIC_DIR, 'index.html')):
            return send_from_directory(STATIC_DIR, 'index.html')
        return {'message': 'Welcome to the Appointment Booking API'}

if __name__ == '__main__':
    try:
        ensure_admin_exists()
    except Exception as e:
        print('Warning: ensure_admin_exists failed:', e)
    app.run(debug=True)
