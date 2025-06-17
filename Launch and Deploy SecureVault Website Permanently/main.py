import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from src.models.user import db
from src.routes.auth import auth_bp
from src.routes.user import user_bp
import secrets

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Security Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', secrets.token_hex(32))
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # We'll handle expiration manually
app.config['JWT_ALGORITHM'] = 'HS256'

# CORS Configuration - Allow all origins for development
CORS(app, origins="*", supports_credentials=True)

# JWT Configuration
jwt = JWTManager(app)

# Rate Limiting Configuration
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["1000 per hour", "100 per minute"]
)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/user')

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

@app.errorhandler(429)
def ratelimit_handler(e):
    return {"error": "Rate limit exceeded", "message": str(e.description)}, 429

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return {"error": "Token has expired", "message": "Please log in again"}, 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return {"error": "Invalid token", "message": "Please log in again"}, 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return {"error": "Authorization required", "message": "Please log in to access this resource"}, 401

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

