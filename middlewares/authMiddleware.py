from flask import request, jsonify
from functools import wraps
from utils.jwtHelper import verify_token


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({
                "message": "Token missing"
            }), 401

        try:
            token = auth_header.split(" ")[1]
        except:
            return jsonify({
                "message": "Invalid token format"
            }), 401

        data = verify_token(token)

        if not data:
            return jsonify({
                "message": "Invalid or expired token"
            }), 401

        request.user_id = data.get("user_id")
        request.user_role = data.get("role", "user")
        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({
                "message": "Token missing"
            }), 401

        try:
            token = auth_header.split(" ")[1]
        except:
            return jsonify({
                "message": "Invalid token format"
            }), 401

        data = verify_token(token)

        if not data or data.get("role") != "admin":
            return jsonify({
                "message": "Admin credentials required"
            }), 403

        request.user_id = data.get("user_id")
        request.user_role = data.get("role", "admin")
        return f(*args, **kwargs)

    return decorated

def stylist_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({
                "message": "Token missing"
            }), 401

        try:
            token = auth_header.split(" ")[1]
        except:
            return jsonify({
                "message": "Invalid token format"
            }), 401

        data = verify_token(token)

        if not data or data.get("role") != "stylist":
            return jsonify({
                "message": "Stylist credentials required"
            }), 403

        request.user_id = data.get("user_id")
        request.user_role = data.get("role", "stylist")
        return f(*args, **kwargs)

    return decorated
