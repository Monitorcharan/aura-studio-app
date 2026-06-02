from flask import request, jsonify
from config import db
from bson import ObjectId
from datetime import datetime
import secrets

appointments = db["appointments"]
services = db["services"]
users = db["users"]


def book_appointment():
    """Book a new appointment"""
    data = request.json

    user_id = getattr(request, 'user_id', None)
    service_id = data.get("service_id")
    appointment_date = data.get("appointment_date")
    appointment_time = data.get("appointment_time")
    notes = data.get("notes", "")

    if not user_id or not service_id or not appointment_date or not appointment_time:
        return jsonify({
            "message": "User ID, Service ID, appointment date and time are required"
        }), 400

    # Check if service exists
    service = services.find_one({"_id": ObjectId(service_id)})
    if not service:
        return jsonify({
            "message": "Service not found"
        }), 404

    # Check for conflicting appointments
    existing = appointments.find_one({
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "status": {"$in": ["pending", "confirmed"]}
    })

    if existing:
        return jsonify({
            "message": "Time slot already booked"
        }), 409

    appointment_token = secrets.token_hex(10).upper()

    appointment = {
        "user_id": ObjectId(user_id),
        "service_id": ObjectId(service_id),
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "notes": notes,
        "status": "pending",
        "appointment_token": appointment_token,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = appointments.insert_one(appointment)

    return jsonify({
        "message": "Appointment booked successfully",
        "appointment_id": str(result.inserted_id),
        "appointment_token": appointment_token
    }), 201


def get_appointments():
    """Get all appointments for a user"""
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return jsonify({
            "message": "User ID is required"
        }), 400

    try:
        appts = list(appointments.find({"user_id": ObjectId(user_id)}))
        for appt in appts:
            appt["_id"] = str(appt["_id"])
            appt["user_id"] = str(appt["user_id"])
            appt["service_id"] = str(appt["service_id"])

        return jsonify({
            "appointments": appts
        }), 200
    except:
        return jsonify({
            "message": "Invalid user ID"
        }), 400


def get_appointment_details(appointment_id):
    """Get specific appointment details"""
    try:
        appt = appointments.find_one({"_id": ObjectId(appointment_id)})
        if not appt:
            return jsonify({
                "message": "Appointment not found"
            }), 404

        appt["_id"] = str(appt["_id"])
        appt["user_id"] = str(appt["user_id"])
        appt["service_id"] = str(appt["service_id"])

        service = services.find_one({"_id": ObjectId(appt["service_id"])})
        if service:
            service["_id"] = str(service["_id"])
            appt["service"] = service

        return jsonify(appt), 200
    except:
        return jsonify({
            "message": "Invalid appointment ID"
        }), 400


def update_appointment(appointment_id):
    """Update appointment details"""
    data = request.json

    try:
        appointment = appointments.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            return jsonify({
                "message": "Appointment not found"
            }), 404

        user_id = getattr(request, 'user_id', None)
        user_role = getattr(request, 'user_role', 'user')
        if str(appointment["user_id"]) != str(user_id) and user_role != "admin":
            return jsonify({"message": "Unauthorized access to modify this appointment"}), 403

        update_data = {
            "updated_at": datetime.utcnow()
        }

        if "appointment_date" in data:
            update_data["appointment_date"] = data["appointment_date"]
        if "appointment_time" in data:
            update_data["appointment_time"] = data["appointment_time"]
        if "notes" in data:
            update_data["notes"] = data["notes"]
        if "status" in data:
            update_data["status"] = data["status"]

        appointments.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": update_data}
        )

        return jsonify({
            "message": "Appointment updated successfully"
        }), 200
    except:
        return jsonify({
            "message": "Invalid appointment ID"
        }), 400


def cancel_appointment(appointment_id):
    """Cancel an appointment"""
    try:
        appointment = appointments.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            return jsonify({
                "message": "Appointment not found"
            }), 404

        user_id = getattr(request, 'user_id', None)
        user_role = getattr(request, 'user_role', 'user')
        if str(appointment["user_id"]) != str(user_id) and user_role != "admin":
            return jsonify({"message": "Unauthorized access to cancel this appointment"}), 403

        appointments.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": {
                "status": "cancelled",
                "updated_at": datetime.utcnow()
            }}
        )

        return jsonify({
            "message": "Appointment cancelled successfully"
        }), 200
    except:
        return jsonify({
            "message": "Invalid appointment ID"
        }), 400


def get_available_slots():
    """Get available time slots for a specific date"""
    appointment_date = request.args.get("date")

    if not appointment_date:
        return jsonify({
            "message": "Date is required"
        }), 400

    # Define available time slots
    all_slots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
    ]

    # Get booked slots
    booked = appointments.find({
        "appointment_date": appointment_date,
        "status": {"$in": ["pending", "confirmed"]}
    })

    booked_slots = [appt["appointment_time"] for appt in booked]
    available_slots = [slot for slot in all_slots if slot not in booked_slots]

    return jsonify({
        "date": appointment_date,
        "available_slots": available_slots
    }), 200


def get_all_appointments():
    """Get all appointments for admin"""
    try:
        appts = list(appointments.find())
        
        # Enrich with user and service details
        for appt in appts:
            appt["_id"] = str(appt["_id"])
            appt["user_id"] = str(appt["user_id"])
            appt["service_id"] = str(appt["service_id"])
            
            # Get user details
            user = users.find_one({"_id": ObjectId(appt["user_id"])})
            if user:
                appt["user_name"] = user.get("name", "Unknown")
                appt["user_email"] = user.get("email", "")
            
            # Get service details
            service = services.find_one({"_id": ObjectId(appt["service_id"])})
            if service:
                appt["service_name"] = service.get("name", "Unknown")
        
        return jsonify({"appointments": appts}), 200
    except:
        return jsonify({"message": "Error loading appointments"}), 400
