from flask import Blueprint
from controllers.paymentController import create_razorpay_order, verify_razorpay_payment, get_payment_invoice, get_payment_history
from middlewares.authMiddleware import token_required

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/payments/create-razorpay-order', methods=['POST'])
@token_required
def create_order():
    return create_razorpay_order()

@payment_bp.route('/payments/verify-razorpay', methods=['POST'])
@token_required
def verify_payment():
    return verify_razorpay_payment()

@payment_bp.route('/payments/<payment_id>/invoice', methods=['GET'])
@token_required
def get_invoice(payment_id):
    return get_payment_invoice(payment_id)

@payment_bp.route('/payments/history', methods=['GET'])
@token_required
def payment_history():
    return get_payment_history()
