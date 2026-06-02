from flask import request, jsonify
from config import db
from bson import ObjectId
from datetime import datetime, timedelta
import os
import razorpay

users = db["users"]

def create_membership_order():
    user_id = getattr(request, 'user_id', None)
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    if not key_id or not key_secret:
        return jsonify({"message": "Razorpay keys not configured"}), 500

    client = razorpay.Client(auth=(key_id, key_secret))
    
    # Elite Membership is $49.00
    order_amount = 4900 
    order_currency = "USD"
    order_receipt = f"elite_{str(user_id)[:8]}"

    try:
        razorpay_order = client.order.create({
            "amount": order_amount,
            "currency": order_currency,
            "receipt": order_receipt,
            "notes": {
                "user_id": str(user_id),
                "type": "elite_membership"
            }
        })
        
        return jsonify({
            "order_id": razorpay_order["id"],
            "amount": order_amount,
            "currency": order_currency,
            "key_id": key_id
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500


def verify_membership_payment():
    data = request.json or {}
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_signature = data.get("razorpay_signature")
    
    user_id = getattr(request, 'user_id', None)
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    
    if not razorpay_payment_id or not razorpay_order_id or not razorpay_signature:
        return jsonify({"message": "Missing payment verification parameters"}), 400

    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    client = razorpay.Client(auth=(key_id, key_secret))

    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
    except Exception as e:
        return jsonify({"message": "Payment verification failed", "error": str(e)}), 400

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
