/**
 * Frontend Security Utilities for SecureVault
 * Provides comprehensive security functions for client-side protection
 */

// Content Security Policy configuration
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: unsafe-inline/eval should be removed in production
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", "https://9yhyi3cqpp0l.manus.space"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};

// Input validation and sanitization
export class InputValidator {
  // Regex patterns for validation
  static EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  static USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,80}$/;
  static PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{12,}$/;
  
  // XSS patterns to detect
  static XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi
  ];

  /**
   * Sanitize string input to prevent XSS attacks
   */
  static sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    if (input.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength}`);
    }

    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');

    // Check for XSS patterns
    for (const pattern of this.XSS_PATTERNS) {
      if (pattern.test(sanitized)) {
        throw new Error('Potentially dangerous content detected');
      }
    }

    // HTML encode special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized.trim();
  }

  /**
   * Validate email address
   */
  static validateEmail(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    const sanitized = this.sanitizeString(email, 254);
    
    if (!this.EMAIL_PATTERN.test(sanitized)) {
      throw new Error('Invalid email format');
    }

    return sanitized;
  }

  /**
   * Validate username
   */
  static validateUsername(username) {
    if (!username) {
      throw new Error('Username is required');
    }

    const sanitized = this.sanitizeString(username, 80);
    
    if (!this.USERNAME_PATTERN.test(sanitized)) {
      throw new Error('Username must be 3-80 characters long and contain only letters, numbers, and underscores');
    }

    // Check for reserved usernames
    const reserved = ['admin', 'administrator', 'root', 'system', 'api', 'www', 'mail', 'ftp', 'test', 'guest'];
    if (reserved.includes(sanitized.toLowerCase())) {
      throw new Error('Username is reserved and cannot be used');
    }

    return sanitized;
  }

  /**
   * Validate password strength
   */
  static validatePassword(password) {
    if (!password) {
      throw new Error('Password is required');
    }

    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters long');
    }

    if (password.length > 128) {
      throw new Error('Password must not exceed 128 characters');
    }

    if (!this.PASSWORD_PATTERN.test(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }

    // Check for common patterns
    const commonPatterns = ['password', '123456', 'qwerty', 'abc123', 'letmein'];
    const lowerPassword = password.toLowerCase();
    for (const pattern of commonPatterns) {
      if (lowerPassword.includes(pattern)) {
        throw new Error('Password contains common patterns and is not secure');
      }
    }

    return password;
  }

  /**
   * Validate and sanitize form data
   */
  static validateFormData(data, rules) {
    const validated = {};
    const errors = {};

    for (const [field, rule] of Object.entries(rules)) {
      try {
        const value = data[field];
        
        if (rule.required && (!value || value.trim() === '')) {
          errors[field] = `${field} is required`;
          continue;
        }

        if (!value || value.trim() === '') {
          continue; // Skip validation for optional empty fields
        }

        switch (rule.type) {
          case 'email':
            validated[field] = this.validateEmail(value);
            break;
          case 'username':
            validated[field] = this.validateUsername(value);
            break;
          case 'password':
            validated[field] = this.validatePassword(value);
            break;
          case 'string':
            validated[field] = this.sanitizeString(value, rule.maxLength || 1000);
            break;
          default:
            validated[field] = this.sanitizeString(value);
        }
      } catch (error) {
        errors[field] = error.message;
      }
    }

    return { validated, errors, isValid: Object.keys(errors).length === 0 };
  }
}

// CSRF Protection
export class CSRFProtection {
  static TOKEN_KEY = 'csrf_token';

  /**
   * Get CSRF token from storage
   */
  static getToken() {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Set CSRF token in storage
   */
  static setToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid CSRF token');
    }
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Remove CSRF token from storage
   */
  static removeToken() {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Add CSRF token to request headers
   */
  static addToHeaders(headers = {}) {
    const token = this.getToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
    return headers;
  }
}

// Secure HTTP Client
export class SecureHTTPClient {
  static BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://9yhyi3cqpp0l.manus.space/api';

  /**
   * Make a secure HTTP request
   */
  static async request(endpoint, options = {}) {
    const url = `${this.BASE_URL}${endpoint}`;
    
    // Default headers with security measures
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      ...options.headers
    };

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
      CSRFProtection.addToHeaders(headers);
    }

    // Add authorization token if available
    const token = SecureStorage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
      credentials: 'include', // Include cookies for CSRF protection
    };

    try {
      const response = await fetch(url, config);
      
      // Check for security headers in response
      this.validateSecurityHeaders(response);
      
      // Handle different response types
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Update CSRF token if provided
      const newCSRFToken = response.headers.get('X-CSRF-Token');
      if (newCSRFToken) {
        CSRFProtection.setToken(newCSRFToken);
      }

      return await response.json();
    } catch (error) {
      console.error('Secure HTTP request failed:', error);
      throw error;
    }
  }

  /**
   * Validate security headers in response
   */
  static validateSecurityHeaders(response) {
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection'
    ];

    for (const header of requiredHeaders) {
      if (!response.headers.get(header)) {
        console.warn(`Missing security header: ${header}`);
      }
    }
  }

  // Convenience methods
  static get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  static post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Secure Storage
export class SecureStorage {
  static TOKEN_KEY = 'auth_token';
  static USER_KEY = 'user_data';

  /**
   * Store authentication token securely
   */
  static setToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token');
    }
    
    // Use sessionStorage for better security (cleared when tab closes)
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get authentication token
   */
  static getToken() {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Remove authentication token
   */
  static removeToken() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    CSRFProtection.removeToken();
  }

  /**
   * Store user data securely
   */
  static setUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      throw new Error('Invalid user data');
    }
    
    // Remove sensitive data before storing
    const safeUserData = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      is_verified: userData.is_verified,
      is_admin: userData.is_admin,
      mfa_enabled: userData.mfa_enabled
    };
    
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(safeUserData));
  }

  /**
   * Get user data
   */
  static getUserData() {
    const data = sessionStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Clear all stored data
   */
  static clear() {
    sessionStorage.clear();
  }
}

// Security Event Logger
export class SecurityLogger {
  /**
   * Log security events to console and potentially to server
   */
  static log(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.warn('Security Event:', logEntry);
    }

    // In production, you might want to send this to your logging service
    // SecureHTTPClient.post('/security-log', logEntry).catch(() => {});
  }

  static logValidationError(field, error) {
    this.log('validation_error', { field, error });
  }

  static logAuthenticationAttempt(success, error = null) {
    this.log('authentication_attempt', { success, error });
  }

  static logSuspiciousActivity(activity, details = {}) {
    this.log('suspicious_activity', { activity, ...details });
  }
}

// Password Strength Checker
export class PasswordStrength {
  /**
   * Check password strength and provide feedback
   */
  static analyze(password) {
    const analysis = {
      score: 0,
      strength: 'Very Weak',
      feedback: [],
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        numbers: false,
        special: false
      }
    };

    if (!password) {
      analysis.feedback.push('Password is required');
      return analysis;
    }

    // Check length
    if (password.length >= 12) {
      analysis.score += 2;
      analysis.requirements.length = true;
    } else if (password.length >= 8) {
      analysis.score += 1;
      analysis.feedback.push('Password should be at least 12 characters long');
    } else {
      analysis.feedback.push('Password is too short (minimum 8 characters)');
    }

    // Check for uppercase letters
    if (/[A-Z]/.test(password)) {
      analysis.score += 1;
      analysis.requirements.uppercase = true;
    } else {
      analysis.feedback.push('Add uppercase letters');
    }

    // Check for lowercase letters
    if (/[a-z]/.test(password)) {
      analysis.score += 1;
      analysis.requirements.lowercase = true;
    } else {
      analysis.feedback.push('Add lowercase letters');
    }

    // Check for numbers
    if (/\d/.test(password)) {
      analysis.score += 1;
      analysis.requirements.numbers = true;
    } else {
      analysis.feedback.push('Add numbers');
    }

    // Check for special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      analysis.score += 1;
      analysis.requirements.special = true;
    } else {
      analysis.feedback.push('Add special characters');
    }

    // Check for common patterns
    const commonPatterns = ['123', 'abc', 'password', 'qwerty'];
    for (const pattern of commonPatterns) {
      if (password.toLowerCase().includes(pattern)) {
        analysis.score -= 1;
        analysis.feedback.push('Avoid common patterns');
        break;
      }
    }

    // Determine strength
    if (analysis.score >= 6) {
      analysis.strength = 'Very Strong';
    } else if (analysis.score >= 5) {
      analysis.strength = 'Strong';
    } else if (analysis.score >= 3) {
      analysis.strength = 'Moderate';
    } else if (analysis.score >= 2) {
      analysis.strength = 'Weak';
    }

    return analysis;
  }
}

// Security utilities initialization
export const initializeSecurity = () => {
  // Set up CSP if supported
  if (typeof document !== 'undefined') {
    // Create CSP meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    
    const cspValue = Object.entries(CSP_CONFIG)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
    
    cspMeta.content = cspValue;
    document.head.appendChild(cspMeta);

    // Disable right-click context menu in production
    if (!import.meta.env.DEV) {
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        SecurityLogger.logSuspiciousActivity('context_menu_attempt');
      });

      // Disable F12 and other developer shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 'U')) {
          e.preventDefault();
          SecurityLogger.logSuspiciousActivity('developer_tools_attempt');
        }
      });
    }
  }
};

export default {
  InputValidator,
  CSRFProtection,
  SecureHTTPClient,
  SecureStorage,
  SecurityLogger,
  PasswordStrength,
  initializeSecurity
};

