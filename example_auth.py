"""
Example usage of MS Purview Migrator authentication.
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.auth import MSPurviewAuth


def main():
    """Example authentication flow."""
    
    # Initialize authentication (will read from .env file if present)
    auth = MSPurviewAuth(headless=False)  # Set to True for headless mode
    
    # Get username from user
    username = input("Enter your Microsoft username/email: ").strip()
    
    if not username:
        print("Username is required")
        return
    
    try:
        # Check if user is already authenticated
        if auth.is_authenticated(username):
            print(f"User {username} is already authenticated!")
            use_existing = input("Use existing session? (y/n): ").lower().strip()
            
            if use_existing == 'y':
                result = auth.login(username, force_new=False)
            else:
                result = auth.login(username, force_new=True)
        else:
            # Perform authentication
            print(f"Authenticating {username}...")
            result = auth.login(username)
        
        if result["success"]:
            print(f"Authentication successful for {username}!")
            print(f"From cache: {result.get('from_cache', False)}")
            print(f"Cookies saved: {len(result.get('cookies', []))}")
            
            if result.get("tokens"):
                print("Tokens received:")
                for token_type, token_value in result["tokens"].items():
                    # Don't print full tokens for security
                    print(f"  {token_type}: {token_value[:20]}...")
            
            # Ask if user wants to logout
            logout_choice = input("Do you want to logout? (y/n): ").lower().strip()
            if logout_choice == 'y':
                auth.logout(username)
                print(f"Logged out {username}")
        else:
            print(f"Authentication failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"Error during authentication: {str(e)}")


if __name__ == "__main__":
    main()