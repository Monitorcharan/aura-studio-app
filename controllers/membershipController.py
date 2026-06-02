from flask import request, jsonify
from config import db
from bson import ObjectId
from datetime import datetime, timedelta
import os

users = db["users"]

def simulate_membership_purchase():
    user_id = getattr(request, 'user_id', None)
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    # 30 days of Elite access
    expires_at = datetime.utcnow() + timedelta(days=30)

    users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "membership_tier": "elite",
            "membership_expires_at": expires_at.isoformat()
        }}
    )

    return jsonify({
        "message": "Welcome to Aura Elite!",
        "membership_tier": "elite",
        "expires_at": expires_at.isoformat()
    }), 200
