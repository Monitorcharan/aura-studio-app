"""
Create or promote an admin user for the appointment-booking app.
Usage:
  python scripts/create_admin.py --email admin@example.com --password S3cureP@ss --name Admin

If the email exists, the script will promote that user to role 'admin' and optionally update the password.
"""
import argparse
from config import db
import bcrypt
from bson import ObjectId

users = db["users"]


def create_or_promote_admin(email, password, name=None, force_password=False):
    existing = users.find_one({"email": email})

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    if existing:
        update = {"role": "admin"}
        if force_password:
            update["password"] = hashed
        if name:
            update["name"] = name
        # set username when promoting
        update["username"] = email if email and "@" not in email else (name or email.split("@")[0])
        users.update_one({"_id": existing["_id"]}, {"$set": update})
        print(f"User {email} promoted to admin (id={existing['_id']}).")
        if force_password:
            print("Password updated.")
        return str(existing["_id"])

    user = {
        "name": name or "Administrator",
        "email": email,
        "username": email if email and "@" not in email else (name or email.split("@")[0]),
        "password": hashed,
        "phone": "",
        "role": "admin"
    }

    result = users.insert_one(user)
    print(f"Admin user created: {email} (id={result.inserted_id})")
    return str(result.inserted_id)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--email', required=True, help='Admin email')
    parser.add_argument('--password', required=True, help='Admin password')
    parser.add_argument('--name', help='Display name for admin')
    parser.add_argument('--force-password', action='store_true', help='Force update password if user exists')

    args = parser.parse_args()

    create_or_promote_admin(args.email, args.password, args.name, args.force_password)
