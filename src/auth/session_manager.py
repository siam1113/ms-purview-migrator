"""
Session management module for Microsoft authentication.
Handles cookie/session persistence and reuse.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
import pickle


class SessionManager:
    """Manages authentication sessions and cookies for Microsoft authentication."""
    
    def __init__(self, session_dir: str = ".sessions"):
        """
        Initialize session manager.
        
        Args:
            session_dir: Directory to store session files
        """
        self.session_dir = session_dir
        self._ensure_session_dir()
    
    def _ensure_session_dir(self) -> None:
        """Ensure session directory exists."""
        if not os.path.exists(self.session_dir):
            os.makedirs(self.session_dir, mode=0o700)  # Secure permissions
    
    def _get_session_file(self, username: str) -> str:
        """Get session file path for a user."""
        safe_username = "".join(c for c in username if c.isalnum() or c in "._-")
        return os.path.join(self.session_dir, f"{safe_username}_session.pkl")
    
    def save_session(self, username: str, cookies: list, tokens: Optional[Dict[str, Any]] = None) -> None:
        """
        Save session data for a user.
        
        Args:
            username: Username to save session for
            cookies: List of cookies from browser
            tokens: Optional token data
        """
        session_data = {
            "username": username,
            "cookies": cookies,
            "tokens": tokens or {},
            "timestamp": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(hours=8)).isoformat()  # 8 hour expiry
        }
        
        session_file = self._get_session_file(username)
        with open(session_file, "wb") as f:
            pickle.dump(session_data, f)
        
        # Set secure file permissions
        os.chmod(session_file, 0o600)
    
    def load_session(self, username: str) -> Optional[Dict[str, Any]]:
        """
        Load session data for a user.
        
        Args:
            username: Username to load session for
            
        Returns:
            Session data if valid, None otherwise
        """
        session_file = self._get_session_file(username)
        if not os.path.exists(session_file):
            return None
        
        try:
            with open(session_file, "rb") as f:
                session_data = pickle.load(f)
            
            # Check if session is expired
            expires_at = datetime.fromisoformat(session_data.get("expires_at", ""))
            if datetime.now() > expires_at:
                self.clear_session(username)
                return None
            
            return session_data
        except (EOFError, ValueError, KeyError) as e:
            # Corrupted session file, remove it
            self.clear_session(username)
            return None
    
    def clear_session(self, username: str) -> None:
        """
        Clear session data for a user.
        
        Args:
            username: Username to clear session for
        """
        session_file = self._get_session_file(username)
        if os.path.exists(session_file):
            os.remove(session_file)
    
    def clear_all_sessions(self) -> None:
        """Clear all stored sessions."""
        if os.path.exists(self.session_dir):
            for file in os.listdir(self.session_dir):
                if file.endswith("_session.pkl"):
                    os.remove(os.path.join(self.session_dir, file))
    
    def is_session_valid(self, username: str) -> bool:
        """
        Check if a session is valid for a user.
        
        Args:
            username: Username to check
            
        Returns:
            True if session is valid, False otherwise
        """
        session_data = self.load_session(username)
        return session_data is not None