import os, sys

if __name__ == "__main__" and __package__ is None:
    sys.path.append(os.path.dirname(__file__))

from flask import Flask
from flask_cors import CORS

# Initialize extensions

from extensions import db, jwt


def create_app():
    app = Flask(__name__)

    # Configurations (could be loaded from environment)
    app.config.setdefault('SECRET_KEY', 'change-this-secret')
    app.config.setdefault('JWT_SECRET_KEY', 'change-this-jwt-secret')
    app.config.setdefault('SQLALCHEMY_DATABASE_URI', 'sqlite:///app.db')
    app.config.setdefault('SQLALCHEMY_TRACK_MODIFICATIONS', False)

    CORS(app)
    db.init_app(app)
    jwt.init_app(app)

    from routes.auth import auth_bp
    from routes.user import user_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/user')

    return app


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000)
