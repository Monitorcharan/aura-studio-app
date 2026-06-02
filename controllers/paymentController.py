from flask import request, jsonify
from config import db
from bson import ObjectId
from datetime import datetime
import secrets
import os
import razorpay

appointments = db["appointments"]
services = db["services"]
users = db["users"]
payments = db["payments"]


def create_razorpay_order():
    data = request.json or {}
    appointment_id = data.get("appointment_id")

    if not appointment_id:
        return jsonify({"message": "Appointment ID is required"}), 400

    try:
        appointment = appointments.find_one({"_id": ObjectId(appointment_id)})
    except:
        appointment = None

    if not appointment:
        return jsonify({"message": "Appointment not found"}), 404

    if appointment.get("status") == "cancelled":
        return jsonify({"message": "Cannot pay for a cancelled appointment"}), 400

    if appointment.get("payment_id"):
        return jsonify({"message": "Payment has already been processed"}), 400

    service = services.find_one({"_id": ObjectId(appointment["service_id"])})
    if not service:
        return jsonify({"message": "Linked service is invalid"}), 400

    amount = service.get("price", 0)
    try:
        amount = float(amount)
    except (ValueError, TypeError):
        amount = 0.0

    # Initialize Razorpay Client
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    if not key_id or not key_secret:
        return jsonify({"message": "Razorpay keys not configured on server"}), 500

    client = razorpay.Client(auth=(key_id, key_secret))
    
    # Amount is in paise
    order_amount = int(amount * 100)
    order_currency = "USD" # Assuming USD based on the rest of the app, change to INR if needed
    order_receipt = f"rcpt_{appointment_id[:8]}"

    try:
        razorpay_order = client.order.create({
            "amount": order_amount,
            "currency": order_currency,
            "receipt": order_receipt,
            "notes": {
                "appointment_id": appointment_id
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


def verify_razorpay_payment():
    data = request.json or {}
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_signature = data.get("razorpay_signature")
    appointment_id = data.get("appointment_id")
    
    if not razorpay_payment_id or not razorpay_order_id or not razorpay_signature or not appointment_id:
        return jsonify({"message": "Missing payment verification parameters"}), 400

    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    client = razorpay.Client(auth=(key_id, key_secret))

    try:
        # This will throw a SignatureVerificationError if invalid
        client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
    except Exception as e:
        return jsonify({"message": "Payment verification failed", "error": str(e)}), 400

    # Payment is valid, save to DB
    appointment = appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        return jsonify({"message": "Appointment not found"}), 404
        
    service = services.find_one({"_id": ObjectId(appointment["service_id"])})
    amount = float(service.get("price", 0)) if service else 0.0
    
    invoice_number = f"INV-{secrets.token_hex(4).upper()}"
    qr_payload = f"AURA|{razorpay_payment_id}|{appointment_id}|{str(appointment['user_id'])}"

    payment = {
        "payment_id": razorpay_payment_id,
        "order_id": razorpay_order_id,
        "appointment_id": appointment["_id"],
        "user_id": appointment["user_id"],
        "service_id": appointment["service_id"],
        "amount": amount,
        "payment_method": "razorpay",
        "status": "paid",
        "invoice_number": invoice_number,
        "created_at": datetime.utcnow(),
        "qr_payload": qr_payload
    }
    payments.insert_one(payment)

    appointments.update_one(
        {"_id": appointment["_id"]},
        {"$set": {
            "payment_id": razorpay_payment_id,
            "payment_status": "paid",
            "status": "confirmed",
            "updated_at": datetime.utcnow()
        }}
    )

    return jsonify({
        "message": "Payment verified successfully",
        "payment_id": razorpay_payment_id,
        "invoice_number": invoice_number
    }), 200


def get_payment_invoice(payment_id):
    payment = payments.find_one({"payment_id": payment_id})
    if not payment:
        return jsonify({"message": "Payment record not found"}), 404

    if hasattr(request, "user_id") and request.user_id:
        if str(payment["user_id"]) != request.user_id:
            return jsonify({"message": "Unauthorized access"}), 403

    appointment = appointments.find_one({"_id": payment["appointment_id"]})
    service = services.find_one({"_id": payment["service_id"]})
    user = users.find_one({"_id": payment["user_id"]})

    invoice = {
        "payment_id": payment["payment_id"],
        "invoice_number": payment.get("invoice_number"),
        "appointment_id": str(payment["appointment_id"]),
        "appointment_token": appointment.get("appointment_token") if appointment else None,
        "user_name": user.get("name") if user else "Unknown",
        "user_email": user.get("email") if user else "",
        "service_name": service.get("name") if service else "",
        "service_price": float(payment.get("amount", 0)),
        "payment_method": payment.get("payment_method", "card"),
        "payment_status": payment.get("status", "paid"),
        "cardholder_name": payment.get("cardholder_name", ""),
        "appointment_date": appointment.get("appointment_date") if appointment else None,
        "appointment_time": appointment.get("appointment_time") if appointment else None,
        "invoice_date": payment.get("created_at").isoformat() if payment.get("created_at") else None,
        "qr_payload": payment.get("qr_payload")
    }

    return jsonify(invoice), 200


def get_payment_history():
    user_id = getattr(request, 'user_id', None)
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    try:
        payments_list = list(payments.find({"user_id": ObjectId(user_id)}))
    except:
        return jsonify({"message": "Invalid user reference"}), 400

    history = []
    for payment in payments_list:
        service = services.find_one({"_id": ObjectId(payment["service_id"])}) if payment.get("service_id") else None
        history.append({
            "payment_id": payment.get("payment_id"),
            "appointment_id": str(payment.get("appointment_id")),
            "service_name": service.get("name") if service else "Unknown",
            "amount": float(payment.get("amount", 0)),
            "payment_method": payment.get("payment_method", "card"),
            "status": payment.get("status", "paid"),
            "invoice_number": payment.get("invoice_number"),
            "created_at": payment.get("created_at").isoformat() if payment.get("created_at") else None,
            "qr_payload": payment.get("qr_payload")
        })

    return jsonify({"payments": history}), 200
