import os
import sys

# Ensure the appointment-booking root is on sys.path so existing modules resolve
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app import app, ensure_admin_exists

if __name__ == '__main__':
    try:
        ensure_admin_exists()
    except Exception as e:
        print('Warning: ensure_admin_exists failed:', e)
    app.run(debug=True)
