from flask import Blueprint
from controllers.paymentController import process_payment, get_payment_invoice, get_payment_history
from middlewares.authMiddleware import token_required

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/payments/process', methods=['POST'])
@token_required
def pay():
    return process_payment()

@payment_bp.route('/payments/<payment_id>/invoice', methods=['GET'])
@token_required
def get_invoice(payment_id):
    return get_payment_invoice(payment_id)

@payment_bp.route('/payments/history', methods=['GET'])
@token_required
def payment_history():
    return get_payment_history()
