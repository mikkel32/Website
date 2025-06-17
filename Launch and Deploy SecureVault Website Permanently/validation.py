"""
Enhanced input validation and sanitization utilities for SecureVault.
This module provides comprehensive validation functions to prevent injection attacks
and ensure data integrity across all API endpoints.
"""

import re
import html
import bleach
from email_validator import validate_email, EmailNotValidError
from urllib.parse import urlparse
import ipaddress
from typing import Union, List, Dict, Any, Optional


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


class InputValidator:
    """Comprehensive input validation and sanitization class."""
    
    # Regex patterns for common validations
    USERNAME_PATTERN = re.compile(r'^[a-zA-Z0-9_]{3,80}$')
    PASSWORD_PATTERN = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{12,}$')
    PHONE_PATTERN = re.compile(r'^\+?1?[0-9]{10,15}$')
    
    # Allowed HTML tags for rich text (if needed)
    ALLOWED_HTML_TAGS = ['b', 'i', 'u', 'em', 'strong', 'p', 'br']
    ALLOWED_HTML_ATTRIBUTES = {}
    
    # Common dangerous patterns
    SQL_INJECTION_PATTERNS = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)",
        r"(--|#|/\*|\*/)",
        r"(\bOR\b.*=.*\bOR\b)",
        r"(\bAND\b.*=.*\bAND\b)",
        r"(';|'|\")",
    ]
    
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe[^>]*>.*?</iframe>",
        r"<object[^>]*>.*?</object>",
        r"<embed[^>]*>.*?</embed>",
    ]
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000, allow_html: bool = False) -> str:
        """
        Sanitize a string input by removing dangerous characters and patterns.
        
        Args:
            value: The string to sanitize
            max_length: Maximum allowed length
            allow_html: Whether to allow safe HTML tags
            
        Returns:
            Sanitized string
            
        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(value, str):
            raise ValidationError("Input must be a string")
        
        # Check length
        if len(value) > max_length:
            raise ValidationError(f"Input exceeds maximum length of {max_length}")
        
        # Remove null bytes and control characters
        value = ''.join(char for char in value if ord(char) >= 32 or char in '\t\n\r')
        
        # Check for SQL injection patterns
        for pattern in InputValidator.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValidationError("Potentially dangerous SQL pattern detected")
        
        # Check for XSS patterns
        for pattern in InputValidator.XSS_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValidationError("Potentially dangerous XSS pattern detected")
        
        if allow_html:
            # Use bleach to sanitize HTML
            value = bleach.clean(
                value,
                tags=InputValidator.ALLOWED_HTML_TAGS,
                attributes=InputValidator.ALLOWED_HTML_ATTRIBUTES,
                strip=True
            )
        else:
            # Escape HTML entities
            value = html.escape(value)
        
        return value.strip()
    
    @staticmethod
    def validate_username(username: str) -> str:
        """
        Validate and sanitize username.
        
        Args:
            username: The username to validate
            
        Returns:
            Validated username
            
        Raises:
            ValidationError: If validation fails
        """
        if not username:
            raise ValidationError("Username is required")
        
        username = InputValidator.sanitize_string(username, max_length=80)
        
        if not InputValidator.USERNAME_PATTERN.match(username):
            raise ValidationError(
                "Username must be 3-80 characters long and contain only letters, numbers, and underscores"
            )
        
        # Check for reserved usernames
        reserved_usernames = [
            'admin', 'administrator', 'root', 'system', 'api', 'www', 'mail',
            'ftp', 'test', 'guest', 'anonymous', 'null', 'undefined'
        ]
        
        if username.lower() in reserved_usernames:
            raise ValidationError("Username is reserved and cannot be used")
        
        return username
    
    @staticmethod
    def validate_email(email: str) -> str:
        """
        Validate and sanitize email address.
        
        Args:
            email: The email to validate
            
        Returns:
            Validated email
            
        Raises:
            ValidationError: If validation fails
        """
        if not email:
            raise ValidationError("Email is required")
        
        email = InputValidator.sanitize_string(email, max_length=254)
        
        try:
            # Use email-validator library for comprehensive validation
            valid = validate_email(email)
            return valid.email
        except EmailNotValidError as e:
            raise ValidationError(f"Invalid email address: {str(e)}")
    
    @staticmethod
    def validate_password(password: str) -> str:
        """
        Validate password strength.
        
        Args:
            password: The password to validate
            
        Returns:
            Validated password
            
        Raises:
            ValidationError: If validation fails
        """
        if not password:
            raise ValidationError("Password is required")
        
        if len(password) < 12:
            raise ValidationError("Password must be at least 12 characters long")
        
        if len(password) > 128:
            raise ValidationError("Password must not exceed 128 characters")
        
        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain at least one lowercase letter")
        
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter")
        
        if not re.search(r'\d', password):
            raise ValidationError("Password must contain at least one number")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("Password must contain at least one special character")
        
        # Check for common patterns
        common_patterns = [
            'password', '123456', 'qwerty', 'abc123', 'letmein', 'welcome',
            'monkey', 'dragon', 'master', 'shadow', 'superman', 'michael'
        ]
        
        password_lower = password.lower()
        for pattern in common_patterns:
            if pattern in password_lower:
                raise ValidationError("Password contains common patterns and is not secure")
        
        # Check for repeated characters
        if re.search(r'(.)\1{3,}', password):
            raise ValidationError("Password contains too many repeated characters")
        
        return password
    
    @staticmethod
    def validate_integer(value: Union[str, int], min_val: int = None, max_val: int = None) -> int:
        """
        Validate and convert integer input.
        
        Args:
            value: The value to validate
            min_val: Minimum allowed value
            max_val: Maximum allowed value
            
        Returns:
            Validated integer
            
        Raises:
            ValidationError: If validation fails
        """
        try:
            if isinstance(value, str):
                # Remove any non-digit characters except minus sign
                value = re.sub(r'[^\d-]', '', value)
                if not value or value == '-':
                    raise ValueError("Invalid integer")
                
            int_value = int(value)
            
            if min_val is not None and int_value < min_val:
                raise ValidationError(f"Value must be at least {min_val}")
            
            if max_val is not None and int_value > max_val:
                raise ValidationError(f"Value must not exceed {max_val}")
            
            return int_value
            
        except (ValueError, TypeError):
            raise ValidationError("Invalid integer value")
    
    @staticmethod
    def validate_url(url: str, allowed_schemes: List[str] = None) -> str:
        """
        Validate URL to prevent SSRF attacks.
        
        Args:
            url: The URL to validate
            allowed_schemes: List of allowed URL schemes
            
        Returns:
            Validated URL
            
        Raises:
            ValidationError: If validation fails
        """
        if not url:
            raise ValidationError("URL is required")
        
        if allowed_schemes is None:
            allowed_schemes = ['http', 'https']
        
        url = InputValidator.sanitize_string(url, max_length=2048)
        
        try:
            parsed = urlparse(url)
            
            if parsed.scheme not in allowed_schemes:
                raise ValidationError(f"URL scheme must be one of: {', '.join(allowed_schemes)}")
            
            if not parsed.netloc:
                raise ValidationError("URL must have a valid domain")
            
            # Check for private/local IP addresses to prevent SSRF
            try:
                ip = ipaddress.ip_address(parsed.hostname)
                if ip.is_private or ip.is_loopback or ip.is_link_local:
                    raise ValidationError("URLs pointing to private/local addresses are not allowed")
            except (ValueError, TypeError):
                # Not an IP address, which is fine
                pass
            
            # Check for dangerous domains
            dangerous_domains = ['localhost', '127.0.0.1', '0.0.0.0', '::1']
            if parsed.hostname and parsed.hostname.lower() in dangerous_domains:
                raise ValidationError("URLs pointing to local addresses are not allowed")
            
            return url
            
        except Exception as e:
            if isinstance(e, ValidationError):
                raise
            raise ValidationError("Invalid URL format")
    
    @staticmethod
    def validate_json_data(data: Dict[str, Any], required_fields: List[str] = None) -> Dict[str, Any]:
        """
        Validate JSON data structure.
        
        Args:
            data: The JSON data to validate
            required_fields: List of required field names
            
        Returns:
            Validated data
            
        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(data, dict):
            raise ValidationError("Data must be a JSON object")
        
        if required_fields:
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")
        
        # Limit the number of fields to prevent DoS
        if len(data) > 50:
            raise ValidationError("Too many fields in request")
        
        # Validate each field
        validated_data = {}
        for key, value in data.items():
            # Validate key
            if not isinstance(key, str):
                raise ValidationError("All keys must be strings")
            
            if len(key) > 100:
                raise ValidationError("Field names must not exceed 100 characters")
            
            validated_key = InputValidator.sanitize_string(key, max_length=100)
            
            # Validate value based on type
            if isinstance(value, str):
                validated_value = InputValidator.sanitize_string(value, max_length=10000)
            elif isinstance(value, (int, float, bool)):
                validated_value = value
            elif isinstance(value, list):
                if len(value) > 100:
                    raise ValidationError("Arrays must not exceed 100 elements")
                validated_value = [
                    InputValidator.sanitize_string(item, max_length=1000) if isinstance(item, str) else item
                    for item in value
                ]
            elif isinstance(value, dict):
                validated_value = InputValidator.validate_json_data(value)
            elif value is None:
                validated_value = None
            else:
                raise ValidationError(f"Unsupported data type for field '{key}'")
            
            validated_data[validated_key] = validated_value
        
        return validated_data


def validate_request_data(data: Dict[str, Any], validation_rules: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validate request data against a set of validation rules.
    
    Args:
        data: The data to validate
        validation_rules: Dictionary of field names and their validation rules
        
    Returns:
        Validated data
        
    Raises:
        ValidationError: If validation fails
    """
    validated_data = {}
    
    for field_name, rules in validation_rules.items():
        value = data.get(field_name)
        
        # Check if field is required
        if rules.get('required', False) and (value is None or value == ''):
            raise ValidationError(f"Field '{field_name}' is required")
        
        # Skip validation if field is not present and not required
        if value is None or value == '':
            continue
        
        # Apply validation based on field type
        field_type = rules.get('type', 'string')
        
        if field_type == 'string':
            validated_data[field_name] = InputValidator.sanitize_string(
                value,
                max_length=rules.get('max_length', 1000),
                allow_html=rules.get('allow_html', False)
            )
        elif field_type == 'username':
            validated_data[field_name] = InputValidator.validate_username(value)
        elif field_type == 'email':
            validated_data[field_name] = InputValidator.validate_email(value)
        elif field_type == 'password':
            validated_data[field_name] = InputValidator.validate_password(value)
        elif field_type == 'integer':
            validated_data[field_name] = InputValidator.validate_integer(
                value,
                min_val=rules.get('min_val'),
                max_val=rules.get('max_val')
            )
        elif field_type == 'url':
            validated_data[field_name] = InputValidator.validate_url(
                value,
                allowed_schemes=rules.get('allowed_schemes')
            )
        else:
            raise ValidationError(f"Unknown validation type '{field_type}' for field '{field_name}'")
    
    return validated_data

