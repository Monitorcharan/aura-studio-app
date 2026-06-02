from flask import Blueprint
from controllers.membershipController import create_membership_order, verify_membership_payment
from middlewares.authMiddleware import token_required

membership_bp = Blueprint('membership', __name__)

@membership_bp.route('/membership/create-order', methods=['POST'])
@token_required
def create_order():
    return create_membership_order()

@membership_bp.route('/membership/verify-payment', methods=['POST'])
@token_required
def verify_payment():
    return verify_membership_payment()
