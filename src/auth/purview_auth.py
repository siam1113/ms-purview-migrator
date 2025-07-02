"""
Main authentication module that provides a simple interface for Microsoft authentication.
"""

from typing import Dict, Any, Optional
from .microsoft_authenticator import MicrosoftAuthenticator
from .config import AuthConfig


class MSPurviewAuth:
    """
    Main authentication class for MS Purview Migrator.
    Provides a simple interface for Microsoft authentication with session management.
    """
    
    def __init__(self, config_file: Optional[str] = None, headless: bool = False):
        """
        Initialize authentication.
        
        Args:
            config_file: Path to configuration file (.env)
            headless: Whether to run browser in headless mode
        """
        self.config = AuthConfig(config_file)
        self.headless = headless or self.config.headless
        self._authenticator = None
    
    @property
    def authenticator(self) -> MicrosoftAuthenticator:
        """Get authenticator instance (lazy loading)."""
        if self._authenticator is None:
            self._authenticator = MicrosoftAuthenticator(
                client_id=self.config.client_id,
                tenant_id=self.config.tenant_id,
                redirect_uri=self.config.redirect_uri,
                scopes=self.config.scopes,
                headless=self.headless
            )
        return self._authenticator
    
    def login(self, username: str, force_new: bool = False) -> Dict[str, Any]:
        """
        Authenticate user with Microsoft.
        
        Args:
            username: Username/email to authenticate
            force_new: Force new authentication even if session exists
            
        Returns:
            Authentication result
        """
        return self.authenticator.authenticate(username, force_new)
    
    def logout(self, username: str) -> None:
        """
        Logout user and clear session.
        
        Args:
            username: Username to logout
        """
        self.authenticator.logout(username)
    
    def clear_all_sessions(self) -> None:
        """Clear all stored sessions."""
        self.authenticator.clear_all_sessions()
    
    def is_authenticated(self, username: str) -> bool:
        """
        Check if user has a valid session.
        
        Args:
            username: Username to check
            
        Returns:
            True if user has valid session
        """
        return self.authenticator.session_manager.is_session_valid(username)