# Authentication Module Documentation

## Overview

The MS Purview Migrator authentication module provides a comprehensive solution for Microsoft OAuth authentication using Playwright for UI automation. It supports interactive login flows, multi-factor authentication (MFA), and secure session management.

## Architecture

### Core Components

1. **MSPurviewAuth** - Main authentication interface
2. **MicrosoftAuthenticator** - Playwright-based authentication engine
3. **SessionManager** - Session persistence and management
4. **AuthConfig** - Configuration management

### Component Interaction

```
MSPurviewAuth
    ├── AuthConfig (configuration)
    ├── MicrosoftAuthenticator
    │   ├── Playwright browser automation
    │   ├── Microsoft OAuth flow handling
    │   └── MFA support
    └── SessionManager
        ├── Session storage
        ├── Cookie persistence
        └── Expiration management
```

## Authentication Flow

### 1. Session Check
- Check for existing valid session
- Load cached cookies and tokens
- Validate session expiration

### 2. Interactive Login (if needed)
- Launch Playwright browser (headless or visible)
- Navigate to Microsoft OAuth endpoint
- Handle username entry
- Wait for password entry (manual)
- Detect and handle MFA challenges
- Extract authentication tokens

### 3. Session Persistence
- Save cookies securely
- Store authentication tokens
- Set expiration timestamps
- Apply secure file permissions

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AZURE_CLIENT_ID` | Azure AD application client ID | - | Yes |
| `AZURE_TENANT_ID` | Azure AD tenant ID | `common` | No |
| `AZURE_REDIRECT_URI` | OAuth redirect URI | `https://login.microsoftonline.com/common/oauth2/nativeclient` | No |
| `AZURE_SCOPES` | OAuth scopes (comma-separated) | `https://graph.microsoft.com/.default` | No |
| `BROWSER_HEADLESS` | Run browser in headless mode | `false` | No |
| `SESSION_DIR` | Session storage directory | `.sessions` | No |

### Configuration File

Create a `.env` file in your project root:

```bash
AZURE_CLIENT_ID=your-application-client-id
AZURE_TENANT_ID=your-tenant-id-or-common
AZURE_SCOPES=https://graph.microsoft.com/.default,https://purview.microsoft.com/.default
BROWSER_HEADLESS=false
SESSION_DIR=.sessions
```

## API Reference

### MSPurviewAuth

Main authentication class providing a simple interface.

```python
class MSPurviewAuth:
    def __init__(self, config_file: Optional[str] = None, headless: bool = False)
    def login(self, username: str, force_new: bool = False) -> Dict[str, Any]
    def logout(self, username: str) -> None
    def clear_all_sessions(self) -> None
    def is_authenticated(self, username: str) -> bool
```

#### Methods

**`login(username, force_new=False)`**
- Authenticate user with Microsoft
- Returns: `{"success": bool, "username": str, "cookies": list, "tokens": dict, "from_cache": bool}`
- Raises: Various exceptions for authentication failures

**`logout(username)`**
- Clear session for specific user
- Removes stored cookies and tokens

**`is_authenticated(username)`**
- Check if user has valid session
- Returns: `bool`

### MicrosoftAuthenticator

Low-level Playwright-based authenticator.

```python
class MicrosoftAuthenticator:
    def __init__(self, client_id: str, tenant_id: str = "common", 
                 redirect_uri: str = None, scopes: List[str] = None, 
                 headless: bool = False)
    def authenticate(self, username: str, force_new: bool = False) -> Dict[str, Any]
    def logout(self, username: str) -> None
    def clear_all_sessions(self) -> None
```

### SessionManager

Session persistence and management.

```python
class SessionManager:
    def __init__(self, session_dir: str = ".sessions")
    def save_session(self, username: str, cookies: list, tokens: Dict = None) -> None
    def load_session(self, username: str) -> Optional[Dict[str, Any]]
    def clear_session(self, username: str) -> None
    def clear_all_sessions(self) -> None
    def is_session_valid(self, username: str) -> bool
```

## Usage Examples

### Basic Authentication

```python
from src.auth import MSPurviewAuth

# Initialize with default config
auth = MSPurviewAuth()

# Authenticate user
result = auth.login("user@example.com")

if result["success"]:
    print(f"Authenticated successfully!")
    print(f"Cached: {result['from_cache']}")
    
    # Use the session...
    
    # Logout when done
    auth.logout("user@example.com")
else:
    print(f"Authentication failed: {result['error']}")
```

### Advanced Usage

```python
from src.auth import MicrosoftAuthenticator, SessionManager

# Custom authenticator
auth = MicrosoftAuthenticator(
    client_id="your-client-id",
    tenant_id="your-tenant-id",
    scopes=["https://graph.microsoft.com/.default"],
    headless=True  # Run without browser window
)

# Authenticate with force new session
result = auth.authenticate("user@example.com", force_new=True)

# Manual session management
session_mgr = SessionManager()
if session_mgr.is_session_valid("user@example.com"):
    session_data = session_mgr.load_session("user@example.com")
    cookies = session_data["cookies"]
    tokens = session_data["tokens"]
```

### Error Handling

```python
from src.auth import MSPurviewAuth

auth = MSPurviewAuth()

try:
    result = auth.login("user@example.com")
    
    if not result["success"]:
        error = result.get("error", "Unknown error")
        print(f"Authentication failed: {error}")
        
        # Handle specific error cases
        if "timeout" in error.lower():
            print("Authentication timed out - please try again")
        elif "mfa" in error.lower():
            print("MFA challenge failed - check your authenticator")
        
except Exception as e:
    print(f"Unexpected error: {e}")
```

## Security Considerations

### Session Storage

- Sessions are stored in pickle format with restricted permissions (600)
- Session directory permissions are set to 700 (owner only)
- Sessions automatically expire after 8 hours
- No passwords are stored, only session cookies and tokens

### File Security

```python
# Session files are created with secure permissions
os.chmod(session_file, 0o600)  # Read/write for owner only

# Session directory is secured
os.makedirs(session_dir, mode=0o700)  # Owner access only
```

### Token Handling

- Access tokens are stored encrypted in session files
- Tokens are automatically refreshed when possible
- Sessions are invalidated on logout
- All sessions can be cleared for security

## Browser Automation

### Playwright Configuration

The module uses Playwright for browser automation:

- **Chromium browser** - Primary browser for authentication
- **Headless mode** - Optional headless operation
- **User interaction** - Manual password/MFA entry
- **Timeout handling** - Configurable timeouts for each step

### Browser Flow

1. **Launch browser** - Chromium instance with appropriate settings
2. **Navigate to login** - Microsoft OAuth endpoint
3. **Username entry** - Automated form filling
4. **Password waiting** - Manual user interaction required
5. **MFA detection** - Automatic detection and waiting
6. **Token extraction** - Parse response for tokens
7. **Session save** - Store cookies and tokens

## Error Handling

### Common Error Scenarios

| Error Type | Cause | Resolution |
|------------|-------|------------|
| `ModuleNotFoundError: 'playwright'` | Playwright not installed | `pip install playwright && playwright install chromium` |
| `ValueError: AZURE_CLIENT_ID environment variable is required` | Missing configuration | Set `AZURE_CLIENT_ID` in `.env` file |
| `Timeout waiting for password authentication` | User didn't enter password | Complete authentication within timeout |
| `MFA error: timeout` | MFA not completed | Complete MFA challenge within 5 minutes |
| `Session expired` | Session older than 8 hours | Re-authenticate with `force_new=True` |

### Error Response Format

```python
{
    "success": False,
    "error": "Error description",
    "username": "user@example.com"
}
```

## Performance Considerations

### Session Caching

- Valid sessions are reused automatically
- No browser launch needed for cached sessions
- Session validation is fast (file system check)

### Browser Optimization

- Browser instances are properly closed after use
- Headless mode reduces resource usage
- Timeouts prevent hanging operations

## Testing

### Unit Tests

Run the included test suite:

```bash
python test_auth.py
```

### Manual Testing

Use the example script for interactive testing:

```bash
python example_auth.py
```

### Integration Testing

```python
# Test with your application
from src.auth import MSPurviewAuth

def test_integration():
    auth = MSPurviewAuth()
    
    # Test authentication
    result = auth.login("test@example.com")
    assert result["success"]
    
    # Test session reuse
    result2 = auth.login("test@example.com")
    assert result2["from_cache"]
    
    # Test logout
    auth.logout("test@example.com")
    assert not auth.is_authenticated("test@example.com")
```

## Troubleshooting

### Common Issues

1. **Browser not launching**
   ```bash
   playwright install chromium
   ```

2. **Session directory permissions**
   ```bash
   chmod 700 .sessions/
   ```

3. **Environment variables not loading**
   ```bash
   # Check .env file exists and has correct variables
   cat .env
   ```

4. **MFA timeout**
   - Complete MFA within 5 minutes
   - Check network connectivity
   - Verify MFA device is working

### Debug Mode

Enable verbose logging:

```python
# Run with visible browser for debugging
auth = MSPurviewAuth(headless=False)

# Check session status
print(f"Session valid: {auth.is_authenticated(username)}")

# View session data
session_mgr = SessionManager()
session_data = session_mgr.load_session(username)
if session_data:
    print(f"Session expires: {session_data['expires_at']}")
```

## Migration from Other Auth Methods

### From MSAL

```python
# Old MSAL code
from msal import PublicClientApplication

app = PublicClientApplication(client_id, authority=authority)
result = app.acquire_token_interactive(scopes)

# New Playwright-based code
from src.auth import MSPurviewAuth

auth = MSPurviewAuth()
result = auth.login(username)
```

### From Azure CLI

```python
# Old Azure CLI dependency
import subprocess
result = subprocess.run(["az", "login"], capture_output=True)

# New integrated authentication
from src.auth import MSPurviewAuth

auth = MSPurviewAuth()
result = auth.login(username)
```

## Best Practices

1. **Environment Management**
   - Use `.env` files for configuration
   - Never commit credentials to source control
   - Use different configurations for dev/prod

2. **Session Management**
   - Check session validity before operations
   - Handle session expiration gracefully
   - Clear sessions on logout

3. **Error Handling**
   - Always check authentication result
   - Handle timeouts appropriately
   - Provide user-friendly error messages

4. **Security**
   - Use headless mode in production
   - Secure session storage directory
   - Regularly clear old sessions