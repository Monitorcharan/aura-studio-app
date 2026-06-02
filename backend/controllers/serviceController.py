from flask import request, jsonify
from config import db
from bson import ObjectId

services = db["services"]


def create_service():
    """Create a new service"""
    data = request.json

    name = data.get("name")
    description = data.get("description", "")
    duration_minutes = data.get("duration_minutes", 30)
    price = data.get("price", 0)

    if not name:
        return jsonify({
            "message": "Service name is required"
        }), 400

    service = {
        "name": name,
        "description": description,
        "duration_minutes": duration_minutes,
        "price": price
    }

    result = services.insert_one(service)

    return jsonify({
        "message": "Service created successfully",
        "service_id": str(result.inserted_id)
    }), 201


def get_all_services():
    """Get all available services"""
    all_services = list(services.find())
    for service in all_services:
        service["_id"] = str(service["_id"])

    return jsonify({
        "services": all_services
    }), 200


def get_service_details(service_id):
    """Get specific service details"""
    try:
        service = services.find_one({"_id": ObjectId(service_id)})
        if not service:
            return jsonify({
                "message": "Service not found"
            }), 404

        service["_id"] = str(service["_id"])
        return jsonify(service), 200
    except:
        return jsonify({
            "message": "Invalid service ID"
        }), 400


def update_service(service_id):
    """Update service details"""
    data = request.json

    try:
        service = services.find_one({"_id": ObjectId(service_id)})
        if not service:
            return jsonify({
                "message": "Service not found"
            }), 404

        update_data = {}
        if "name" in data:
            update_data["name"] = data["name"]
        if "description" in data:
            update_data["description"] = data["description"]
        if "duration_minutes" in data:
            update_data["duration_minutes"] = data["duration_minutes"]
        if "price" in data:
            update_data["price"] = data["price"]

        services.update_one(
            {"_id": ObjectId(service_id)},
            {"$set": update_data}
        )

        return jsonify({
            "message": "Service updated successfully"
        }), 200
    except:
        return jsonify({
            "message": "Invalid service ID"
        }), 400


def delete_service(service_id):
    """Delete a service"""
    try:
        result = services.delete_one({"_id": ObjectId(service_id)})
        if result.deleted_count == 0:
            return jsonify({
                "message": "Service not found"
            }), 404

        return jsonify({
            "message": "Service deleted successfully"
        }), 200
    except:
        return jsonify({
            "message": "Invalid service ID"
        }), 400
