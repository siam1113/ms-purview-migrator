#!/usr/bin/env python3
"""
Setup script for MS Purview Migrator authentication.
"""

import os
import sys
import subprocess


def check_python_version():
    """Check if Python version is supported."""
    if sys.version_info < (3, 7):
        print("Error: Python 3.7+ is required")
        return False
    print(f"✓ Python {sys.version.split()[0]} is supported")
    return True


def install_dependencies():
    """Install required dependencies."""
    print("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install dependencies: {e}")
        return False


def install_playwright_browsers():
    """Install Playwright browsers."""
    print("Installing Playwright browsers...")
    try:
        subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
        print("✓ Playwright browsers installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install Playwright browsers: {e}")
        print("You can try installing manually with: playwright install chromium")
        return False


def create_env_file():
    """Create .env file if it doesn't exist."""
    if os.path.exists(".env"):
        print("ℹ .env file already exists")
        return True
    
    print("Creating .env configuration file...")
    
    client_id = input("Enter your Azure AD Client ID: ").strip()
    if not client_id:
        print("✗ Client ID is required")
        return False
    
    tenant_id = input("Enter your Azure AD Tenant ID (or press Enter for 'common'): ").strip()
    if not tenant_id:
        tenant_id = "common"
    
    scopes = input("Enter OAuth scopes (or press Enter for default): ").strip()
    if not scopes:
        scopes = "https://graph.microsoft.com/.default"
    
    headless = input("Run browser in headless mode? (y/N): ").strip().lower()
    headless_val = "true" if headless in ['y', 'yes'] else "false"
    
    env_content = f"""# Microsoft Azure AD Configuration
AZURE_CLIENT_ID={client_id}
AZURE_TENANT_ID={tenant_id}
AZURE_REDIRECT_URI=https://login.microsoftonline.com/common/oauth2/nativeclient
AZURE_SCOPES={scopes}
BROWSER_HEADLESS={headless_val}
SESSION_DIR=.sessions
"""
    
    try:
        with open(".env", "w") as f:
            f.write(env_content)
        print("✓ .env file created successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to create .env file: {e}")
        return False


def test_installation():
    """Test the installation."""
    print("Testing installation...")
    try:
        # Test imports
        sys.path.insert(0, 'src')
        from src.auth import MSPurviewAuth
        print("✓ Modules import successfully")
        
        # Test configuration
        from src.auth.config import AuthConfig
        config = AuthConfig()
        client_id = config.client_id
        print("✓ Configuration loads successfully")
        
        print("✓ Installation test passed")
        return True
    except Exception as e:
        print(f"✗ Installation test failed: {e}")
        return False


def main():
    """Main setup function."""
    print("MS Purview Migrator Authentication Setup")
    print("=" * 45)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("\nWarning: Dependency installation failed. You may need to install manually:")
        print("pip install -r requirements.txt")
    
    # Install Playwright browsers (optional, may fail in CI)
    install_playwright_browsers()
    
    # Create .env file
    print("\n" + "=" * 45)
    print("Configuration Setup")
    print("=" * 45)
    
    if not create_env_file():
        print("\nYou can create the .env file manually using .env.example as a template")
    
    # Test installation
    print("\n" + "=" * 45)
    print("Installation Test")
    print("=" * 45)
    
    if test_installation():
        print("\n✓ Setup completed successfully!")
        print("\nNext steps:")
        print("1. Run: python example_auth.py")
        print("2. Or use CLI: python auth_cli.py login your-email@example.com")
        print("3. Check documentation: docs/authentication.md")
    else:
        print("\n✗ Setup completed with errors")
        print("Please check the error messages above and try again")
        sys.exit(1)


if __name__ == "__main__":
    main()