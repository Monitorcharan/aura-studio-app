from flask import Blueprint
from controllers.virtualMirrorController import get_virtual_mirror_recommendation, get_virtual_mirror_detection

virtual_mirror_bp = Blueprint('virtual_mirror_bp', __name__)

@virtual_mirror_bp.route('/virtual-mirror/recommendation', methods=['POST'])
def virtual_mirror_recommendation():
    return get_virtual_mirror_recommendation()

@virtual_mirror_bp.route('/virtual-mirror/detect', methods=['POST'])
def virtual_mirror_detect():
    return get_virtual_mirror_detection()
