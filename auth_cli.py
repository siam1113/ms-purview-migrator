#!/usr/bin/env python3
"""
Command-line interface for MS Purview Migrator authentication.
"""

import argparse
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.auth import MSPurviewAuth


def main():
    """Main CLI function."""
    parser = argparse.ArgumentParser(
        description='MS Purview Migrator Authentication CLI',
        epilog='Examples:\n'
               '  %(prog)s login user@example.com\n'
               '  %(prog)s login user@example.com --force-new\n'
               '  %(prog)s logout user@example.com\n'
               '  %(prog)s status user@example.com\n'
               '  %(prog)s clear-all',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument('command', choices=['login', 'logout', 'status', 'clear-all'],
                       help='Command to execute')
    parser.add_argument('username', nargs='?',
                       help='Username/email (required for login, logout, status)')
    parser.add_argument('--force-new', action='store_true',
                       help='Force new authentication (ignore cached sessions)')
    parser.add_argument('--headless', action='store_true',
                       help='Run browser in headless mode')
    parser.add_argument('--config', type=str,
                       help='Path to configuration file (.env)')
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.command in ['login', 'logout', 'status'] and not args.username:
        print(f"Error: {args.command} command requires a username")
        sys.exit(1)
    
    try:
        # Initialize authentication
        auth = MSPurviewAuth(config_file=args.config, headless=args.headless)
        
        if args.command == 'login':
            print(f"Authenticating {args.username}...")
            
            # Check existing session first
            if not args.force_new and auth.is_authenticated(args.username):
                print(f"✓ {args.username} is already authenticated (using cached session)")
                print("  Use --force-new to force re-authentication")
                return
            
            result = auth.login(args.username, force_new=args.force_new)
            
            if result["success"]:
                print(f"✓ Authentication successful for {args.username}")
                if result.get("from_cache"):
                    print("  Used cached session")
                else:
                    print("  New session created")
                print(f"  Cookies saved: {len(result.get('cookies', []))}")
                
                if result.get("tokens"):
                    print(f"  Tokens received: {len(result['tokens'])}")
                    for token_type in result["tokens"].keys():
                        print(f"    - {token_type}")
            else:
                print(f"✗ Authentication failed: {result.get('error', 'Unknown error')}")
                sys.exit(1)
                
        elif args.command == 'logout':
            if auth.is_authenticated(args.username):
                auth.logout(args.username)
                print(f"✓ Logged out {args.username}")
            else:
                print(f"ℹ {args.username} was not authenticated")
                
        elif args.command == 'status':
            if auth.is_authenticated(args.username):
                print(f"✓ {args.username} is authenticated")
                
                # Get session details
                session_data = auth.authenticator.session_manager.load_session(args.username)
                if session_data:
                    print(f"  Session created: {session_data.get('timestamp', 'Unknown')}")
                    print(f"  Session expires: {session_data.get('expires_at', 'Unknown')}")
                    print(f"  Cookies: {len(session_data.get('cookies', []))}")
                    if session_data.get('tokens'):
                        print(f"  Tokens: {len(session_data['tokens'])}")
            else:
                print(f"✗ {args.username} is not authenticated")
                sys.exit(1)
                
        elif args.command == 'clear-all':
            confirm = input("This will clear all stored sessions. Continue? (y/N): ").strip().lower()
            if confirm in ['y', 'yes']:
                auth.clear_all_sessions()
                print("✓ All sessions cleared")
            else:
                print("Operation cancelled")
                
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()