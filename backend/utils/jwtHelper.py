import jwt
import datetime
import os

SECRET_KEY = os.getenv("JWT_SECRET")


def generate_token(user_id, role="user"):
    payload = {
        "user_id": str(user_id),
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    return token


def verify_token(token):
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return data
    except:
        return None
