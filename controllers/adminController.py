from config import db
from bson import ObjectId

users = db["users"]
services = db["services"]
appointments = db["appointments"]
payments = db["payments"]


def get_admin_metrics():
    total_users = users.count_documents({})
    total_services = services.count_documents({})
    total_appointments = appointments.count_documents({})
    pending_appointments = appointments.count_documents({"status": "pending"})
    confirmed_appointments = appointments.count_documents({"status": "confirmed"})
    cancelled_appointments = appointments.count_documents({"status": "cancelled"})
    total_revenue = 0.0
    last_payments = []

    for payment in payments.find().sort([("created_at", -1)]).limit(5):
        total_revenue += float(payment.get("amount", 0))
        last_payments.append({
            "payment_id": payment.get("payment_id"),
            "appointment_id": str(payment.get("appointment_id")) if payment.get("appointment_id") else None,
            "amount": float(payment.get("amount", 0)),
            "status": payment.get("status", "paid"),
            "invoice_number": payment.get("invoice_number")
        })

    return {
        "total_users": total_users,
        "total_services": total_services,
        "total_appointments": total_appointments,
        "pending_appointments": pending_appointments,
        "confirmed_appointments": confirmed_appointments,
        "cancelled_appointments": cancelled_appointments,
        "total_revenue": round(total_revenue, 2),
        "recent_payments": last_payments
    }
