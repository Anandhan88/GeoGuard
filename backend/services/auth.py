import os
import time
import requests
from dotenv import load_dotenv

# Load env variables from backend/.env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path=env_path)

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"

class CopernicusAuthService:
    def __init__(self):
        self._access_token = None
        self._expires_at = 0
        self._refresh_token = None
        self.username = os.getenv("COPERNICUS_USERNAME")
        self.password = os.getenv("COPERNICUS_PASSWORD")

    def has_credentials(self) -> bool:
        """Check if username and password are set."""
        return bool(self.username and self.password)

    def get_token(self) -> str:
        """
        Get the current access token.
        Fetches a new one if it is missing or expired.
        """
        if not self.has_credentials():
            print("Copernicus Authentication: No credentials configured. Running in Fallback/Simulation Mode.")
            return None

        # Check if token is expired or expires in the next 30 seconds
        if not self._access_token or time.time() >= (self._expires_at - 30):
            self.refresh_token()

        return self._access_token

    def refresh_token(self):
        """Request a new access token from the CDSE OAuth2 endpoint."""
        if not self.has_credentials():
            return

        payload = {
            "client_id": "cdse-public",
            "username": self.username,
            "password": self.password,
            "grant_type": "password"
        }

        try:
            print("Copernicus Authentication: Authenticating with CDSE portal...")
            response = requests.post(TOKEN_URL, data=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            self._access_token = data.get("access_token")
            self._refresh_token = data.get("refresh_token")
            expires_in = data.get("expires_in", 600)  # default to 10 min
            self._expires_at = time.time() + expires_in
            print(f"Copernicus Authentication: Token acquired successfully. Expires in {expires_in}s.")
        except Exception as e:
            print(f"Copernicus Authentication: Failed to retrieve access token: {e}")
            self._access_token = None
            self._expires_at = 0

# Singleton instance
auth_service = CopernicusAuthService()
