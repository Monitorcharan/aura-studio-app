from flask import Flask, send_from_directory
import os
from config import db
from routes.authRoutes import auth_bp
from routes.appointmentRoutes import appointment_bp
from routes.serviceRoutes import service_bp
from routes.paymentRoutes import payment_bp
from routes.adminRoutes import admin_bp
from routes.virtualMirrorRoutes import virtual_mirror_bp
from routes.chatRoutes import chat_bp
from routes.membershipRoutes import membership_bp
import bcrypt

app = Flask(__name__)

app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(appointment_bp, url_prefix='/api')
app.register_blueprint(service_bp, url_prefix='/api')
app.register_blueprint(payment_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(virtual_mirror_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(membership_bp, url_prefix='/api')


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

def ensure_stylists_exist():
    users = db['users']
    stylists = ['marcus', 'elena', 'sophia']
    hashed = bcrypt.hashpw('stylist@123'.encode('utf-8'), bcrypt.gensalt())
    
    for stylist_username in stylists:
        existing = users.find_one({'username': stylist_username})
        if not existing:
            user = {
                'name': stylist_username.capitalize(),
                'email': f"{stylist_username}@aurastudio.com",
                'username': stylist_username,
                'password': hashed,
                'phone': '',
                'role': 'stylist'
            }
            users.insert_one(user)
            print(f"Created stylist user '{stylist_username}'")

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'dist')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    file_path = os.path.join(STATIC_DIR, path)
    if path != '' and os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(STATIC_DIR, path)
    else:
        return send_from_directory(STATIC_DIR, 'index.html')

# create admin user before starting the server or when imported by gunicorn
try:
    ensure_admin_exists()
    ensure_stylists_exist()
except Exception as e:
    print('Warning: ensure_admin/stylist failed:', e)

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true')
