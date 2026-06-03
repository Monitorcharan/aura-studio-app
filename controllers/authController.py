from flask import request, jsonify
from config import db
import bcrypt
from utils.jwtHelper import generate_token
from bson import ObjectId
import secrets
from datetime import datetime, timedelta, timezone
from utils.emailHelper import send_otp_email

users = db["users"]


def register():
    data = request.json

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    phone = data.get("phone", "")

    if not name or not email or not password:
        return jsonify({
            "message": "Name, email, and password are required"
        }), 400

    existing_user = users.find_one({
        "email": email
    })

    if existing_user:
        return jsonify({
            "message": "Email already exists"
        }), 400

    hashed_password = bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt()
    )

    otp = str(secrets.randbelow(900000) + 100000)
    print(f"[OTP LOG] Generated OTP Code for {email} is: {otp}")
    otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "phone": phone,
        "role": "user",
        "membership_tier": "standard",
        "is_verified": False,
        "otp": otp,
        "otp_expires_at": otp_expires_at
    }

    result = users.insert_one(user)
    
    # Send verification email asynchronously
    send_otp_email(email, otp)

    return jsonify({
        "message": "Registration successful. Please verify your email with the OTP sent.",
        "email": email,
        "needs_verification": True
    }), 201


def login():
    data = request.json

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    user = users.find_one({
        "email": email
    })

    if not user:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user["password"]):
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    # Block login for unverified standard users
    if user.get("role") == "user" and not user.get("is_verified", False):
        return jsonify({
            "message": "Please verify your email address before signing in."
        }), 403

    if user.get("role") == "admin":
        return jsonify({
            "message": "Admin users must use the admin portal to sign in"
        }), 403

    token = generate_token(user["_id"], role="user")

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user_id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": "user",
        "membership_tier": user.get("membership_tier", "standard")
    }), 200


def admin_login():
    data = request.json or {}

    # Accept either `username` or `email` from the admin portal
    username = data.get("username") or data.get("email")
    password = data.get("password")

    if not username or not password:
        return jsonify({
            "message": "Username and password are required"
        }), 400

    # Try matching against username, email, or name fields so the admin can sign in
    user = users.find_one({
        "$or": [
            {"username": username},
            {"email": username},
            {"name": username}
        ]
    })

    if not user:
        return jsonify({
            "message": "Invalid admin credentials"
        }), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user["password"]):
        return jsonify({
            "message": "Invalid admin credentials"
        }), 401

    if user.get("role") not in ["admin", "stylist"]:
        return jsonify({
            "message": "Staff access denied"
        }), 403

    role = user.get("role")
    token = generate_token(user["_id"], role=role)

    return jsonify({
        "message": f"{role.capitalize()} login successful",
        "token": token,
        "user_id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": role
    }), 200


def profile():
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return jsonify({
            "message": "User ID is required"
        }), 400

    user = users.find_one({
        "_id": ObjectId(user_id)
    })

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    return jsonify({
        "user_id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone", ""),
        "role": user.get("role", "user"),
        "membership_tier": user.get("membership_tier", "standard"),
        "membership_expires_at": user.get("membership_expires_at")
    }), 200


def update_profile():
    user_id = getattr(request, 'user_id', None)
    if not user_id:
        return jsonify({
            "message": "User ID is required"
        }), 400

    data = request.json or {}
    update_data = {}
    if "name" in data:
        update_data["name"] = data["name"]
    if "phone" in data:
        update_data["phone"] = data["phone"]

    if not update_data:
        return jsonify({
            "message": "No profile fields provided"
        }), 400

    users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )

    user = users.find_one({"_id": ObjectId(user_id)})
    return jsonify({
        "message": "Profile updated successfully",
        "user_id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone", ""),
        "role": user.get("role", "user"),
        "membership_tier": user.get("membership_tier", "standard")
    }), 200


def verify_otp():
    data = request.json or {}
    email = data.get("email")
    otp = data.get("otp")

    if not email or not otp:
        return jsonify({"message": "Email and OTP are required"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.get("is_verified", False):
        return jsonify({"message": "User is already verified"}), 200

    db_otp = user.get("otp")
    otp_expires_at = user.get("otp_expires_at")

    if not db_otp or not otp_expires_at:
        return jsonify({"message": "No OTP verification request active"}), 400

    now = datetime.now(timezone.utc)
    # If the expiration timestamp in DB is naive, make now a naive UTC datetime for comparison
    if otp_expires_at.tzinfo is None:
        now = now.replace(tzinfo=None)

    if now > otp_expires_at:
        return jsonify({"message": "OTP has expired. Please request a new one."}), 400

    if db_otp != str(otp).strip():
        return jsonify({"message": "Invalid OTP code"}), 400

    # Verify user and clear OTP fields
    users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"is_verified": True},
            "$unset": {"otp": "", "otp_expires_at": ""}
        }
    )

    return jsonify({"message": "Email verified successfully. You can now login."}), 200


def resend_otp():
    data = request.json or {}
    email = data.get("email")

    if not email:
        return jsonify({"message": "Email is required"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.get("is_verified", False):
        return jsonify({"message": "User is already verified"}), 200

    otp = str(secrets.randbelow(900000) + 100000)
    print(f"[OTP LOG] Regenerated OTP Code for {email} is: {otp}")
    otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "otp": otp,
                "otp_expires_at": otp_expires_at
            }
        }
    )

    send_otp_email(email, otp)

    return jsonify({"message": "A new OTP has been sent to your email address."}), 200
