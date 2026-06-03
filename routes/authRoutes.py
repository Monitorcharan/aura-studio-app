from flask import Blueprint
from controllers.authController import register, login, admin_login, profile, update_profile, verify_otp, resend_otp
from middlewares.authMiddleware import token_required

auth_bp = Blueprint('auth', __name__)

auth_bp.route('/register', methods=['POST'])(register)
auth_bp.route('/verify-otp', methods=['POST'])(verify_otp)
auth_bp.route('/resend-otp', methods=['POST'])(resend_otp)
auth_bp.route('/login', methods=['POST'])(login)
auth_bp.route('/admin/login', methods=['POST'])(admin_login)
auth_bp.route('/profile', methods=['GET'])(token_required(profile))
auth_bp.route('/profile', methods=['PUT'])(token_required(update_profile))
