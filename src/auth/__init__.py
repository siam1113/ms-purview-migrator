"""
Microsoft authentication module for MS Purview Migrator.
Provides UI-based authentication using Playwright with session management.
"""

from .purview_auth import MSPurviewAuth
from .microsoft_authenticator import MicrosoftAuthenticator
from .session_manager import SessionManager
from .config import AuthConfig

__all__ = [
    "MSPurviewAuth",
    "MicrosoftAuthenticator", 
    "SessionManager",
    "AuthConfig"
]