"""
Test script to validate the authentication module components.
"""

import sys
import os
import tempfile

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_session_manager():
    """Test session manager functionality."""
    print("Testing SessionManager...")
    
    from src.auth.session_manager import SessionManager
    
    # Use temporary directory for testing
    with tempfile.TemporaryDirectory() as temp_dir:
        session_manager = SessionManager(temp_dir)
        
        # Test saving and loading session
        test_username = "test@example.com"
        test_cookies = [{"name": "test", "value": "value"}]
        test_tokens = {"access_token": "test_token"}
        
        # Save session
        session_manager.save_session(test_username, test_cookies, test_tokens)
        print("✓ Session saved successfully")
        
        # Load session
        loaded_session = session_manager.load_session(test_username)
        assert loaded_session is not None
        assert loaded_session["username"] == test_username
        assert loaded_session["cookies"] == test_cookies
        assert loaded_session["tokens"] == test_tokens
        print("✓ Session loaded successfully")
        
        # Test session validity
        assert session_manager.is_session_valid(test_username)
        print("✓ Session validity check successful")
        
        # Clear session
        session_manager.clear_session(test_username)
        assert not session_manager.is_session_valid(test_username)
        print("✓ Session clearing successful")


def test_config():
    """Test configuration management."""
    print("\nTesting AuthConfig...")
    
    from src.auth.config import AuthConfig
    
    # Set test environment variables
    os.environ["AZURE_CLIENT_ID"] = "test-client-id"
    os.environ["AZURE_TENANT_ID"] = "test-tenant"
    
    config = AuthConfig()
    
    # Test required config
    assert config.client_id == "test-client-id"
    assert config.tenant_id == "test-tenant"
    print("✓ Configuration loading successful")
    
    # Test defaults
    assert config.redirect_uri == "https://login.microsoftonline.com/common/oauth2/nativeclient"
    assert config.scopes == ["https://graph.microsoft.com/.default"]
    assert config.headless == False
    print("✓ Default configuration values correct")
    
    # Clean up
    del os.environ["AZURE_CLIENT_ID"]
    del os.environ["AZURE_TENANT_ID"]


def test_imports():
    """Test all module imports."""
    print("\nTesting imports...")
    
    try:
        # Test individual module imports
        from src.auth.config import AuthConfig
        from src.auth.session_manager import SessionManager
        print("✓ Individual module imports successful")
        
        # Test package import
        from src.auth import MSPurviewAuth, MicrosoftAuthenticator, SessionManager, AuthConfig
        print("✓ Package imports successful")
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    
    return True


def main():
    """Run all tests."""
    print("MS Purview Migrator Authentication Module Tests")
    print("=" * 50)
    
    try:
        test_imports()
        test_config()
        test_session_manager()
        
        print("\n" + "=" * 50)
        print("✓ All tests passed!")
        print("\nThe authentication module is ready for use.")
        print("To use it:")
        print("1. Set up your .env file with AZURE_CLIENT_ID")
        print("2. Run: python example_auth.py")
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()