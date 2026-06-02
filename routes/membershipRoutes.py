from flask import Blueprint
from controllers.membershipController import simulate_membership_purchase
from middlewares.authMiddleware import token_required

membership_bp = Blueprint('membership', __name__)

@membership_bp.route('/membership/simulate-purchase', methods=['POST'])
@token_required
def simulate_purchase():
    return simulate_membership_purchase()
