from flask import Blueprint, request
from controllers.appointmentController import (
    book_appointment,
    get_appointments,
    get_appointment_details,
    update_appointment,
    cancel_appointment,
    get_available_slots,
    get_all_appointments,
    get_stylist_appointments
)
from middlewares.authMiddleware import token_required, admin_required, stylist_required

appointment_bp = Blueprint('appointment', __name__)

@appointment_bp.route('/appointments/book', methods=['POST'])
@token_required
def book_appt():
    return book_appointment()

@appointment_bp.route('/appointments', methods=['GET'])
@token_required
def get_user_appointments():
    return get_appointments()

@appointment_bp.route('/appointments/<appointment_id>', methods=['GET'])
@token_required
def get_appt_details(appointment_id):
    return get_appointment_details(appointment_id)

@appointment_bp.route('/appointments/<appointment_id>', methods=['PUT'])
@token_required
def update_appt(appointment_id):
    return update_appointment(appointment_id)

@appointment_bp.route('/appointments/<appointment_id>/cancel', methods=['POST'])
@token_required
def cancel_appt(appointment_id):
    return cancel_appointment(appointment_id)

@appointment_bp.route('/appointments/available-slots', methods=['GET'])
def available_slots():
    return get_available_slots()

@appointment_bp.route('/appointments-all', methods=['GET'])
@admin_required
def get_all_appts():
    return get_all_appointments()

@appointment_bp.route('/appointments/stylist', methods=['GET'])
@stylist_required
def get_stylist_appts():
    return get_stylist_appointments()
