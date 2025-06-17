# SecureVault - Advanced User Management Platform

A state-of-the-art website featuring advanced user account management, exceptional security features, and impressive animations. Built with cutting-edge technology and designed for the modern web.

## 🚀 Features

### 🔒 Military-Grade Security
- **Advanced Encryption**: Argon2 password hashing with salt
- **Multi-Factor Authentication**: TOTP support (ready for implementation)
- **JWT Token Authentication**: Secure stateless authentication
- **Rate Limiting**: Protection against brute-force attacks
- **Session Management**: Secure session tracking and invalidation
- **Input Validation**: Comprehensive validation and sanitization
- **Account Lockout**: Automatic lockout after failed attempts

### ⚡ Lightning Fast Performance
- **React 19**: Latest React with concurrent features
- **Vite**: Ultra-fast build tool and dev server
- **Optimized Animations**: Hardware-accelerated animations
- **Lazy Loading**: Efficient resource loading
- **Code Splitting**: Optimized bundle sizes

### 🎨 Premium User Experience
- **Stunning Animations**: Framer Motion powered animations
- **Dark Theme**: Modern dark-first design
- **Responsive Design**: Perfect on all devices
- **Glassmorphism**: Modern UI effects
- **Micro-interactions**: Delightful user feedback
- **Password Strength Indicator**: Real-time password validation

### 🛡️ Advanced Security Features
- **Password Strength Validation**: Comprehensive password requirements
- **Email Validation**: RFC-compliant email validation
- **CORS Protection**: Configurable cross-origin requests
- **SQL Injection Protection**: SQLAlchemy ORM protection
- **XSS Protection**: Input sanitization and validation
- **CSRF Protection**: Token-based protection

## 🏗️ Architecture

### Frontend (React + Vite)
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx          # Animated login form
│   │   ├── RegisterForm.jsx       # Registration with password strength
│   │   └── UserDashboard.jsx      # User account management
│   ├── ui/                        # Reusable UI components (shadcn/ui)
│   └── LandingPage.jsx           # Stunning landing page
├── contexts/
│   └── AuthContext.jsx           # Authentication state management
├── App.jsx                       # Main application component
└── App.css                       # Custom styles and animations
```

### Backend (Flask + SQLAlchemy)
```
src/
├── models/
│   └── user.py                   # User, LoginAttempt, Session models
├── routes/
│   ├── auth.py                   # Authentication endpoints
│   └── user.py                   # User management endpoints
└── main.py                       # Flask application entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and pnpm
- Python 3.11+ and pip
- Git

### Frontend Setup
```bash
cd advanced-secure-website
pnpm install
pnpm run dev
```

### Backend Setup
```bash
cd secure-backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🔧 Configuration

### Environment Variables
Create `.env` files for production:

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

**Backend (.env)**
```
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
DATABASE_URL=sqlite:///app.db
FLASK_ENV=production
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-80 chars, alphanumeric + underscore)",
  "email": "string (valid email)",
  "password": "string (12+ chars, mixed case, numbers, special chars)"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "is_verified": false,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string (username or email)",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "access_token": "jwt-token-here",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  },
  "session_expires": "2025-01-02T00:00:00Z"
}
```

#### POST /api/auth/logout
Logout user and invalidate session.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

#### POST /api/auth/change-password
Change user password.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "current_password": "string",
  "new_password": "string"
}
```

## 🔒 Security Features

### Password Requirements
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No common patterns (123456, password, etc.)

### Rate Limiting
- 1000 requests per hour per IP
- 100 requests per minute per IP
- 5 failed login attempts before account lockout
- 30-minute lockout duration

### Session Security
- JWT tokens with secure claims
- Session tracking with IP and User-Agent
- Automatic session expiration (24 hours)
- Session invalidation on password change

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3B82F6)
- **Background**: Dark (#020202)
- **Card**: Dark Gray (#0A0A0A)
- **Text**: White (#FAFAFA)
- **Muted**: Gray (#999999)

### Typography
- **Font**: System fonts with fallbacks
- **Headings**: Bold, gradient text effects
- **Body**: Regular weight, high contrast

### Animations
- **Entrance**: Fade in with slide up
- **Hover**: Scale and glow effects
- **Loading**: Rotating spinners
- **Transitions**: Smooth 300ms ease-out

## 🧪 Testing

### Frontend Testing
```bash
cd advanced-secure-website
pnpm run test
```

### Backend Testing
```bash
cd secure-backend
source venv/bin/activate
python -m pytest tests/
```

### Security Testing
- Password strength validation
- Input sanitization
- Rate limiting
- Session management
- Authentication flows

## 📦 Deployment

### Frontend Deployment
```bash
cd advanced-secure-website
pnpm run build
# Deploy dist/ folder to your hosting provider
```

### Backend Deployment
```bash
cd secure-backend
pip freeze > requirements.txt
# Deploy to your Python hosting provider
```

## 🛠️ Development

### Code Structure
- **Components**: Reusable React components
- **Contexts**: Global state management
- **Models**: Database models and relationships
- **Routes**: API endpoint handlers
- **Utilities**: Helper functions and constants

### Best Practices
- TypeScript-style prop validation
- Comprehensive error handling
- Secure coding practices
- Performance optimization
- Accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@securevault.com
- Documentation: https://docs.securevault.com

---

**Built with ❤️ using React, Flask, and modern web technologies.**

