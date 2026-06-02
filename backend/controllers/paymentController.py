from flask import request, jsonify
from config import db
from bson import ObjectId
from datetime import datetime
import secrets

appointments = db["appointments"]
services = db["services"]
users = db["users"]
payments = db["payments"]


def process_payment():
    data = request.json or {}
    appointment_id = data.get("appointment_id")
    payment_method = data.get("payment_method", "card")
    amount = data.get("amount")
    cardholder_name = data.get("cardholder_name", "Card Holder")

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
        return jsonify({"message": "Payment has already been processed for this appointment"}), 400

    service = services.find_one({"_id": ObjectId(appointment["service_id"])})
    user = users.find_one({"_id": ObjectId(appointment["user_id"])})

    if not service or not user:
        return jsonify({"message": "Linked appointment record is invalid"}), 400

    if amount is None:
        amount = service.get("price", 0)

    try:
        amount = float(amount)
    except (ValueError, TypeError):
        amount = float(service.get("price", 0))

    payment_id = secrets.token_hex(10).upper()
    invoice_number = f"INV-{secrets.token_hex(4).upper()}"
    qr_payload = f"AURA|{payment_id}|{appointment_id}|{str(user['_id'])}"

    payment = {
        "payment_id": payment_id,
        "appointment_id": appointment["_id"],
        "user_id": appointment["user_id"],
        "service_id": appointment["service_id"],
        "amount": amount,
        "payment_method": payment_method,
        "cardholder_name": cardholder_name,
        "status": "paid",
        "invoice_number": invoice_number,
        "created_at": datetime.utcnow(),
        "qr_payload": qr_payload
    }

    payments.insert_one(payment)

    appointments.update_one(
        {"_id": appointment["_id"]},
        {"$set": {
            "payment_id": payment_id,
            "payment_status": "paid",
            "status": "confirmed",
            "updated_at": datetime.utcnow()
        }}
    )

    return jsonify({
        "message": "Payment processed successfully",
        "payment_id": payment_id,
        "invoice_number": invoice_number,
        "qr_payload": qr_payload
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
        "appointment_id": str(payment.get("appointment_id")),
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
