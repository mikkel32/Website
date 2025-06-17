# SecureVault - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 20+ with pnpm
- Python 3.11+ with pip
- Git (optional)

### 1. Start the Backend
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python src/main.py
```
Backend will run on: http://localhost:5000

### 2. Start the Frontend
```bash
cd frontend
pnpm install
pnpm run dev
```
Frontend will run on: http://localhost:5173

### 3. Access the Application
Open your browser and go to: http://localhost:5173

## 🎯 What You'll See

1. **Landing Page**: Stunning animated homepage with dark theme
2. **Authentication**: Click "Get Started" to access login/register
3. **Registration**: Create account with password strength validation
4. **Dashboard**: User management interface after login

## 🔧 Quick Configuration

### Environment Variables (Optional)
Create `.env` files for custom configuration:

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

**Backend (.env)**
```
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
```

## 🛠️ Development Commands

### Frontend
```bash
cd frontend
pnpm run dev      # Start development server
pnpm run build    # Build for production
pnpm run preview  # Preview production build
```

### Backend
```bash
cd backend
source venv/bin/activate
python src/main.py              # Start development server
pip freeze > requirements.txt   # Update dependencies
```

## 📁 Project Structure
```
securevault-complete-project/
├── frontend/           # React + Vite frontend
├── backend/           # Flask + SQLAlchemy backend
├── README.md          # Complete documentation
├── design_concept.md  # Design philosophy
└── QUICK_START.md     # This file
```

## 🔒 Security Features Included

- **Password Strength Validation**: Real-time feedback
- **Rate Limiting**: Protection against brute force
- **JWT Authentication**: Secure token-based auth
- **Session Management**: Secure session tracking
- **Input Validation**: Comprehensive sanitization
- **Account Lockout**: Automatic protection

## 🎨 UI Features

- **Dark Theme**: Modern dark-first design
- **Animations**: Smooth Framer Motion animations
- **Responsive**: Works on all devices
- **Glassmorphism**: Modern UI effects
- **Password Strength**: Visual strength indicator

## 🚀 Deployment Ready

Both frontend and backend are production-ready:
- Frontend: Build with `pnpm run build`
- Backend: Deploy with any Python hosting service

## 📞 Need Help?

Check the complete README.md for detailed documentation, API reference, and troubleshooting.

---

**Enjoy your state-of-the-art secure website! 🎉**

