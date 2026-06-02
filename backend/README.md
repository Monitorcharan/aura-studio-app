# Backend

This folder contains a lightweight entrypoint to run the existing Flask backend from a dedicated `backend/` folder.

It intentionally reuses the Flask application code located at the project root (so files are not duplicated or moved).

Run from this folder (recommended):

```bash
cd appointment-booking/backend
python run.py
```

Notes:
- The real application modules remain in the project root (`app.py`, `config.py`, `controllers/`, `routes/`, etc.).
- This folder provides a clear `backend/` entry so you can treat backend and frontend as separate units.
