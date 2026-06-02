from flask import Blueprint
from controllers.serviceController import (
    create_service,
    get_all_services,
    get_service_details,
    update_service,
    delete_service
)
from middlewares.authMiddleware import admin_required

service_bp = Blueprint('service', __name__)

@service_bp.route('/services', methods=['POST'])
@admin_required
def create_srv():
    return create_service()

@service_bp.route('/services', methods=['GET'])
def get_services():
    return get_all_services()

@service_bp.route('/services/<service_id>', methods=['GET'])
def get_srv_details(service_id):
    return get_service_details(service_id)

@service_bp.route('/services/<service_id>', methods=['PUT'])
@admin_required
def update_srv(service_id):
    return update_service(service_id)

@service_bp.route('/services/<service_id>', methods=['DELETE'])
@admin_required
def delete_srv(service_id):
    return delete_service(service_id)
