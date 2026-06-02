from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os

env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

client = MongoClient(os.getenv("MONGO_URI"))

db = client[os.getenv('MONGO_DB', 'appointment_booking')]
