"""
Configuration management for Microsoft authentication.
"""

import os
from typing import Optional, List
from dotenv import load_dotenv


class AuthConfig:
    """Configuration class for Microsoft authentication."""
    
    def __init__(self, env_file: Optional[str] = None):
        """
        Initialize configuration.
        
        Args:
            env_file: Path to .env file (optional)
        """
        if env_file:
            load_dotenv(env_file)
        else:
            load_dotenv()  # Load from default .env file
    
    @property
    def client_id(self) -> str:
        """Get Azure AD client ID."""
        client_id = os.getenv("AZURE_CLIENT_ID")
        if not client_id:
            raise ValueError("AZURE_CLIENT_ID environment variable is required")
        return client_id
    
    @property
    def tenant_id(self) -> str:
        """Get Azure AD tenant ID."""
        return os.getenv("AZURE_TENANT_ID", "common")
    
    @property
    def redirect_uri(self) -> str:
        """Get OAuth redirect URI."""
        return os.getenv("AZURE_REDIRECT_URI", "https://login.microsoftonline.com/common/oauth2/nativeclient")
    
    @property
    def scopes(self) -> List[str]:
        """Get OAuth scopes."""
        scopes_str = os.getenv("AZURE_SCOPES", "https://graph.microsoft.com/.default")
        return [scope.strip() for scope in scopes_str.split(",")]
    
    @property
    def headless(self) -> bool:
        """Get headless browser setting."""
        return os.getenv("BROWSER_HEADLESS", "false").lower() in ("true", "1", "yes")
    
    @property
    def session_dir(self) -> str:
        """Get session storage directory."""
        return os.getenv("SESSION_DIR", ".sessions")