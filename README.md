# MS Purview Migrator

A Python tool for Microsoft Purview data migration with interactive authentication using Playwright.

## Features

- **Interactive Microsoft Authentication**: UI-based authentication using Playwright to handle complex login flows
- **Session Management**: Automatic session persistence and reuse to avoid repeated logins
- **MFA Support**: Built-in support for Multi-Factor Authentication flows
- **Secure Storage**: Encrypted session storage with automatic expiration
- **Error Handling**: Comprehensive error handling for various authentication scenarios

## Installation

1. Clone the repository:
```bash
git clone https://github.com/siam1113/ms-purview-migrator.git
cd ms-purview-migrator
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Install Playwright browsers:
```bash
playwright install chromium
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file with your Azure AD application details:
```bash
# Required: Your Azure AD application client ID
AZURE_CLIENT_ID=your-client-id-here

# Optional: Azure AD tenant ID (defaults to "common")
AZURE_TENANT_ID=common

# Optional: OAuth redirect URI
AZURE_REDIRECT_URI=https://login.microsoftonline.com/common/oauth2/nativeclient

# Optional: OAuth scopes (comma-separated)
AZURE_SCOPES=https://graph.microsoft.com/.default

# Optional: Browser settings
BROWSER_HEADLESS=false

# Optional: Session storage directory
SESSION_DIR=.sessions
```

### Azure AD Application Setup

To use this tool, you need to register an application in Azure AD:

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Click "New registration"
3. Enter a name for your application
4. Select "Accounts in any organizational directory and personal Microsoft accounts"
5. Add redirect URI: `https://login.microsoftonline.com/common/oauth2/nativeclient`
6. After creation, copy the "Application (client) ID" to your `.env` file

## Usage

### Basic Authentication

```python
from src.auth import MSPurviewAuth

# Initialize authentication
auth = MSPurviewAuth(headless=False)  # Set to True for headless mode

# Authenticate user
username = "user@example.com"
result = auth.login(username)

if result["success"]:
    print("Authentication successful!")
    print(f"Cookies: {len(result['cookies'])}")
    print(f"From cache: {result.get('from_cache', False)}")
else:
    print(f"Authentication failed: {result['error']}")

# Check if user is authenticated
if auth.is_authenticated(username):
    print("User has valid session")

# Logout user
auth.logout(username)
```

### Example Script

Run the included example script:

```bash
python example_auth.py
```

This will guide you through the authentication process interactively.

### Advanced Usage

```python
from src.auth import MicrosoftAuthenticator, SessionManager, AuthConfig

# Custom configuration
config = AuthConfig()
authenticator = MicrosoftAuthenticator(
    client_id=config.client_id,
    tenant_id=config.tenant_id,
    headless=True  # Run in headless mode
)

# Authenticate with force new session
result = authenticator.authenticate("user@example.com", force_new=True)

# Manual session management
session_manager = SessionManager()
if session_manager.is_session_valid("user@example.com"):
    session_data = session_manager.load_session("user@example.com")
    print(f"Session expires at: {session_data['expires_at']}")
```

## Authentication Flow

1. **Session Check**: First checks if a valid session exists for the user
2. **Browser Launch**: If no valid session, launches Playwright browser
3. **Microsoft Login**: Navigates to Microsoft login page
4. **User Interaction**: User enters credentials (password entry is manual)
5. **MFA Handling**: Automatically detects and waits for MFA completion
6. **Session Storage**: Saves cookies and tokens securely for future use
7. **Session Reuse**: Subsequent logins use stored session if valid

## Security Features

- **Secure Storage**: Session files are stored with restrictive permissions (600)
- **Automatic Expiration**: Sessions expire after 8 hours by default
- **Encrypted Sessions**: Session data is pickled and stored securely
- **No Credential Storage**: Passwords are never stored, only session cookies

## Error Handling

The tool handles various authentication scenarios:

- **Invalid Credentials**: Clear error messages for login failures
- **MFA Timeout**: Configurable timeout for MFA completion (5 minutes default)
- **Network Issues**: Retry logic for network-related failures
- **Session Corruption**: Automatic cleanup of corrupted session files

## Session Management

Sessions are automatically managed:

- **Location**: Stored in `.sessions/` directory by default
- **Format**: Pickled Python objects with metadata
- **Expiration**: 8 hours from creation (configurable)
- **Cleanup**: Automatic cleanup of expired sessions

### Manual Session Management

```python
from src.auth import SessionManager

session_manager = SessionManager()

# Clear specific user session
session_manager.clear_session("user@example.com")

# Clear all sessions
session_manager.clear_all_sessions()

# Check session validity
is_valid = session_manager.is_session_valid("user@example.com")
```

## Troubleshooting

### Common Issues

1. **Browser not found**: Install Playwright browsers with `playwright install chromium`
2. **Permission denied**: Check file permissions on `.sessions/` directory
3. **Session expired**: Sessions expire after 8 hours, re-authenticate
4. **MFA timeout**: Complete MFA within 5 minutes of prompt

### Debug Mode

Run with verbose output:

```python
auth = MSPurviewAuth(headless=False)  # Shows browser window
```

### Logs

The tool provides detailed console output for troubleshooting:
- Authentication progress
- Error messages
- Session status
- MFA prompts

## Dependencies

- `playwright>=1.40.0`: Browser automation
- `requests>=2.31.0`: HTTP requests
- `python-dotenv>=1.0.0`: Environment variable management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review error messages carefully
3. Open an issue on GitHub with detailed information