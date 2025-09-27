import firebase_admin
from firebase_admin import credentials, firestore, auth
from core.config import settings

# Initialize Firebase Admin SDK
# Ensure the path to your service account key is correct
cred = credentials.Certificate(settings.google_application_credentials)
firebase_admin.initialize_app(cred)

# Firestore, Auth clients
db = firestore.client()
auth_client = auth
