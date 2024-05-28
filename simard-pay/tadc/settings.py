import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_DATABASE_URI = os.getenv('MONGO_URI')
