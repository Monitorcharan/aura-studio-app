from flask import Blueprint
from controllers.adminController import get_admin_metrics
from middlewares.authMiddleware import admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/metrics', methods=['GET'])
@admin_required
def admin_metrics():
    return get_admin_metrics()
