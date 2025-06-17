from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from email_validator import validate_email, EmailNotValidError
from src.models.user import db, User, LoginAttempt, Session
from datetime import datetime, timezone, timedelta
import secrets
import re

auth_bp = Blueprint('auth', __name__)

# Password strength validation
def validate_password_strength(password):
    """Validate password meets security requirements."""
    if len(password) < 12:
        return False, "Password must be at least 12 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    # Check for common patterns
    common_patterns = ['123456', 'password', 'qwerty', 'abc123']
    if any(pattern in password.lower() for pattern in common_patterns):
        return False, "Password contains common patterns and is not secure"
    
    return True, "Password is strong"

def log_login_attempt(username, success, user_id=None):
    """Log login attempt for security monitoring."""
    attempt = LoginAttempt(
        ip_address=request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr),
        user_agent=request.headers.get('User-Agent', ''),
        username_attempted=username,
        success=success,
        user_id=user_id
    )
    db.session.add(attempt)
    db.session.commit()

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user with comprehensive validation."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Validation
        if not username or not email or not password:
            return jsonify({"error": "Username, email, and password are required"}), 400
        
        if len(username) < 3 or len(username) > 80:
            return jsonify({"error": "Username must be between 3 and 80 characters"}), 400
        
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return jsonify({"error": "Username can only contain letters, numbers, and underscores"}), 400
        
        # Email validation
        try:
            valid = validate_email(email)
            email = valid.email
        except EmailNotValidError:
            return jsonify({"error": "Invalid email address"}), 400
        
        # Password strength validation
        is_strong, message = validate_password_strength(password)
        if not is_strong:
            return jsonify({"error": message}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists"}), 409
        
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already registered"}), 409
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        user.generate_verification_token()
        
        db.session.add(user)
        db.session.commit()
        
        log_login_attempt(username, True, user.id)
        
        return jsonify({
            "message": "User registered successfully",
            "user": user.to_dict(),
            "verification_required": True
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Registration failed", "details": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user with comprehensive security checks."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user:
            log_login_attempt(username, False)
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Check if account is locked
        if user.is_account_locked():
            log_login_attempt(username, False, user.id)
            return jsonify({
                "error": "Account temporarily locked due to multiple failed login attempts",
                "locked_until": user.locked_until.isoformat()
            }), 423
        
        # Check if account is active
        if not user.is_active:
            log_login_attempt(username, False, user.id)
            return jsonify({"error": "Account is deactivated"}), 403
        
        # Verify password
        if not user.check_password(password):
            user.increment_failed_login()
            db.session.commit()
            log_login_attempt(username, False, user.id)
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Successful login
        user.reset_failed_login()
        user.last_login = datetime.now(timezone.utc)
        
        # Create session
        session_token = secrets.token_urlsafe(32)
        session = Session(
            user_id=user.id,
            session_token=session_token,
            ip_address=request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr),
            user_agent=request.headers.get('User-Agent', ''),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
        )
        
        db.session.add(session)
        db.session.commit()
        
        # Create JWT token
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'username': user.username,
                'session_token': session_token
            }
        )
        
        log_login_attempt(username, True, user.id)
        
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": user.to_dict(),
            "session_expires": session.expires_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Login failed", "details": str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user and invalidate session."""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        session_token = claims.get('session_token')
        
        if session_token:
            session = Session.query.filter_by(
                user_id=user_id,
                session_token=session_token,
                is_active=True
            ).first()
            
            if session:
                session.is_active = False
                db.session.commit()
        
        return jsonify({"message": "Logout successful"}), 200
        
    except Exception as e:
        return jsonify({"error": "Logout failed", "details": str(e)}), 500

@auth_bp.route('/verify-token', methods=['POST'])
@jwt_required()
def verify_token():
    """Verify if the current token is valid and session is active."""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        session_token = claims.get('session_token')
        
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return jsonify({"error": "User not found or inactive"}), 404
        
        if session_token:
            session = Session.query.filter_by(
                user_id=user_id,
                session_token=session_token,
                is_active=True
            ).first()
            
            if not session or session.is_expired():
                return jsonify({"error": "Session expired"}), 401
            
            # Update session activity
            session.update_activity()
            db.session.commit()
        
        return jsonify({
            "message": "Token is valid",
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Token verification failed", "details": str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password with security validation."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        if not current_password or not new_password:
            return jsonify({"error": "Current password and new password are required"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Verify current password
        if not user.check_password(current_password):
            return jsonify({"error": "Current password is incorrect"}), 401
        
        # Validate new password strength
        is_strong, message = validate_password_strength(new_password)
        if not is_strong:
            return jsonify({"error": message}), 400
        
        # Check if new password is different from current
        if user.check_password(new_password):
            return jsonify({"error": "New password must be different from current password"}), 400
        
        # Update password
        user.set_password(new_password)
        user.updated_at = datetime.now(timezone.utc)
        
        # Invalidate all other sessions for security
        Session.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})
        
        db.session.commit()
        
        return jsonify({"message": "Password changed successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Password change failed", "details": str(e)}), 500

