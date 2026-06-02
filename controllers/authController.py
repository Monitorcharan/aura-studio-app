from flask import request, jsonify
from config import db
import bcrypt
from utils.jwtHelper import generate_token
from bson import ObjectId

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

    user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "phone": phone,
        "role": "user"
    }

    result = users.insert_one(user)

    return jsonify({
        "message": "User registered successfully",
        "user_id": str(result.inserted_id)
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
        "role": "user"
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
        "role": user.get("role", "user")
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
        "role": user.get("role", "user")
    }), 200
