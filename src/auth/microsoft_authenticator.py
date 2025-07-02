"""
UI-based Microsoft authentication using Playwright.
Handles interactive login flows including MFA.
"""

import time
import re
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse, parse_qs
import os

from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page
from .session_manager import SessionManager


class MicrosoftAuthenticator:
    """Microsoft authentication using Playwright for UI automation."""
    
    def __init__(self, 
                 client_id: str,
                 tenant_id: str = "common",
                 redirect_uri: str = "https://login.microsoftonline.com/common/oauth2/nativeclient",
                 scopes: Optional[List[str]] = None,
                 headless: bool = False):
        """
        Initialize Microsoft authenticator.
        
        Args:
            client_id: Azure AD application client ID
            tenant_id: Azure AD tenant ID (default: "common")
            redirect_uri: OAuth redirect URI
            scopes: List of OAuth scopes to request
            headless: Whether to run browser in headless mode
        """
        self.client_id = client_id
        self.tenant_id = tenant_id
        self.redirect_uri = redirect_uri
        self.scopes = scopes or ["https://graph.microsoft.com/.default"]
        self.headless = headless
        self.session_manager = SessionManager()
        
        # OAuth URLs
        self.auth_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize"
        self.token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    
    def _build_auth_url(self, state: str) -> str:
        """Build OAuth authorization URL."""
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(self.scopes),
            "state": state,
            "response_mode": "query"
        }
        
        param_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{self.auth_url}?{param_string}"
    
    def authenticate(self, username: str, force_new: bool = False) -> Dict[str, Any]:
        """
        Authenticate user interactively using Playwright.
        
        Args:
            username: Username/email to authenticate
            force_new: Force new authentication even if session exists
            
        Returns:
            Authentication result with tokens and session info
        """
        # Check for existing valid session
        if not force_new:
            existing_session = self.session_manager.load_session(username)
            if existing_session:
                print(f"Using existing session for {username}")
                return {
                    "success": True,
                    "username": username,
                    "cookies": existing_session["cookies"],
                    "tokens": existing_session.get("tokens", {}),
                    "from_cache": True
                }
        
        print(f"Starting interactive authentication for {username}")
        
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(headless=self.headless)
            context = browser.new_context()
            page = context.new_page()
            
            try:
                result = self._perform_authentication(page, username)
                
                if result["success"]:
                    # Save session
                    self.session_manager.save_session(
                        username,
                        result["cookies"],
                        result.get("tokens", {})
                    )
                
                return result
            
            finally:
                browser.close()
    
    def _perform_authentication(self, page: Page, username: str) -> Dict[str, Any]:
        """Perform the actual authentication flow."""
        state = f"state_{int(time.time())}"
        auth_url = self._build_auth_url(state)
        
        try:
            # Navigate to Microsoft login
            print("Navigating to Microsoft login page...")
            page.goto(auth_url, timeout=30000)
            
            # Wait for login page to load
            page.wait_for_selector("input[type='email'], input[name='loginfmt']", timeout=10000)
            
            # Enter username/email
            print(f"Entering username: {username}")
            email_input = page.locator("input[type='email'], input[name='loginfmt']").first
            email_input.fill(username)
            
            # Click Next button
            page.locator("input[type='submit'], button[type='submit']").first.click()
            
            # Wait for password page or redirect
            try:
                # Wait for password field or MFA prompt
                page.wait_for_selector("input[type='password'], input[name='passwd'], div[data-testid='forceSigninHelpLink']", timeout=15000)
                
                if page.locator("input[type='password'], input[name='passwd']").count() > 0:
                    print("Password required - waiting for user input...")
                    return self._handle_password_flow(page, username, state)
                else:
                    print("Redirected to MFA or other flow...")
                    return self._handle_mfa_flow(page, username, state)
                    
            except Exception as e:
                # Check if we're already authenticated (redirect happened)
                current_url = page.url
                if self.redirect_uri in current_url or "access_token" in current_url or "code=" in current_url:
                    return self._extract_auth_result(page, username)
                else:
                    raise Exception(f"Authentication flow error: {str(e)}")
                    
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "username": username
            }
    
    def _handle_password_flow(self, page: Page, username: str, state: str) -> Dict[str, Any]:
        """Handle password entry flow."""
        print("Waiting for password entry (manual input required)...")
        
        # Wait for user to enter password and submit
        # Monitor for redirect or next step
        max_wait_time = 300  # 5 minutes
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            current_url = page.url
            
            # Check if we got redirected to success page
            if self.redirect_uri in current_url or "access_token" in current_url or "code=" in current_url:
                return self._extract_auth_result(page, username)
            
            # Check for MFA challenge
            if page.locator("div[data-testid='proofConfirmationText'], input[name='otc'], div[class*='mfa']").count() > 0:
                return self._handle_mfa_flow(page, username, state)
            
            # Check for errors
            error_elements = page.locator("div[class*='error'], div[id*='error'], .error-message")
            if error_elements.count() > 0:
                error_text = error_elements.first.text_content()
                return {
                    "success": False,
                    "error": f"Authentication error: {error_text}",
                    "username": username
                }
            
            time.sleep(1)
        
        return {
            "success": False,
            "error": "Timeout waiting for password authentication",
            "username": username
        }
    
    def _handle_mfa_flow(self, page: Page, username: str, state: str) -> Dict[str, Any]:
        """Handle MFA authentication flow."""
        print("MFA challenge detected - waiting for user to complete...")
        
        max_wait_time = 300  # 5 minutes
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            current_url = page.url
            
            # Check if we got redirected to success page
            if self.redirect_uri in current_url or "access_token" in current_url or "code=" in current_url:
                return self._extract_auth_result(page, username)
            
            # Check for successful MFA completion (redirect or success message)
            if "login.microsoftonline.com" not in current_url:
                return self._extract_auth_result(page, username)
            
            # Check for errors
            error_elements = page.locator("div[class*='error'], div[id*='error'], .error-message")
            if error_elements.count() > 0:
                error_text = error_elements.first.text_content()
                return {
                    "success": False,
                    "error": f"MFA error: {error_text}",
                    "username": username
                }
            
            time.sleep(1)
        
        return {
            "success": False,
            "error": "Timeout waiting for MFA completion",
            "username": username
        }
    
    def _extract_auth_result(self, page: Page, username: str) -> Dict[str, Any]:
        """Extract authentication result from final page."""
        current_url = page.url
        
        # Get all cookies
        cookies = page.context.cookies()
        
        # Try to extract tokens from URL (if using implicit flow)
        tokens = {}
        if "access_token" in current_url:
            # Parse fragment for tokens
            fragment = urlparse(current_url).fragment
            if fragment:
                params = parse_qs(fragment)
                if "access_token" in params:
                    tokens["access_token"] = params["access_token"][0]
                if "refresh_token" in params:
                    tokens["refresh_token"] = params["refresh_token"][0]
        
        # Extract authorization code if present
        elif "code=" in current_url:
            parsed_url = urlparse(current_url)
            params = parse_qs(parsed_url.query)
            if "code" in params:
                tokens["authorization_code"] = params["code"][0]
        
        print(f"Authentication successful for {username}")
        return {
            "success": True,
            "username": username,
            "cookies": cookies,
            "tokens": tokens,
            "from_cache": False
        }
    
    def logout(self, username: str) -> None:
        """
        Logout user and clear session.
        
        Args:
            username: Username to logout
        """
        self.session_manager.clear_session(username)
        print(f"Logged out {username}")
    
    def clear_all_sessions(self) -> None:
        """Clear all stored sessions."""
        self.session_manager.clear_all_sessions()
        print("All sessions cleared")