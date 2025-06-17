import os
import base64
from io import BytesIO
from flask import Flask, send_from_directory, send_file
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from user import db
from auth import auth_bp, limiter


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Base64 encoded favicons (simple red square). Avoids storing binary files in
# the repository while still serving valid icons for browsers.
FAVICON_ICO_BASE64 = (
    "AAABAAMAEBAAAAAAIABWAAAANgAAABgYAAAAACAAYAAAAIwAAAAgIAAAAAAgAGgAAADsAAAAiVBORw0K"
    "GgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHUlEQVR4nGP8z8Dwn4ECwESJ5lEDRg0YNWAwGQAA"
    "WG0CHvXMz6IAAAAASUVORK5CYIKJUE5HDQoaCgAAAA1JSERSAAAAGAAAABgIBgAAAOB3PfgAAAAnSURB"
    "VHic7c0xAQAACMOwgX/PYAK+VEBTk0we6885AAAAAAAAwF0L/TsCLmw3D4IAAAAASUVORK5CYIKJUE5H"
    "DQoaCgAAAA1JSERSAAAAIAAAACAIBgAAAHN6evQAAAAvSURBVHic7c4xAQAwDIAwNv+eWxl9ggHypqbD"
    "/uUcAAAAAAAAAAAAAAAAAACgagEw4wI+NplesQAAAABJRU5ErkJggg=="
)

FAVICON_PNG_BASE64 = (
    "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAL0lEQVR4nO3OMQEAMAyAMDb/nlsZfYIB"
    "8qamw/7lHAAAAAAAAAAAAAAAAAAAoGoBMOMCPjaZXrEAAAAASUVORK5CYII="
)



def create_app():
    # Serve front-end files from the project root so hitting the Flask server
    # directly will return index.html and other assets.
    # Serve frontend files directly from the project root so the React app can
    # be accessed without an additional HTTP server. Using ``static_url_path``
    # as an empty string exposes all files in ``BASE_DIR`` at the root URL. The
    # built-in static handler returns ``404`` for unknown paths before our
    # routes run, so a custom 404 handler is registered below to serve
    # ``index.html`` for client-side routes.
    app = Flask(
        __name__,
        static_folder=BASE_DIR,
        static_url_path="",
    )
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'change-me')

    db.init_app(app)
    JWTManager(app)
    CORS(app)
    limiter.init_app(app)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    @app.route('/favicon.ico')
    def favicon():
        """Return favicon without relying on a static binary file."""
        data = base64.b64decode(FAVICON_ICO_BASE64)
        return send_file(BytesIO(data), mimetype='image/x-icon')

    @app.route('/apple-touch-icon.png')
    @app.route('/apple-touch-icon-precomposed.png')
    def apple_icon():
        data = base64.b64decode(FAVICON_PNG_BASE64)
        return send_file(BytesIO(data), mimetype='image/png')

    # Serve index.html at the root. Any unknown file path will fall back to
    # index.html so that the single-page application works correctly when the
    # client refreshes or navigates directly to a route.
    @app.route('/')
    def serve_index():
        return app.send_static_file('index.html')

    @app.route('/<path:path>')
    def serve_file(path):
        file_path = os.path.join(BASE_DIR, path)
        if os.path.isfile(file_path):
            return send_from_directory(BASE_DIR, path)
        return app.send_static_file('index.html')

    @app.errorhandler(404)
    def spa_fallback(_):
        """Return ``index.html`` for any unknown route so the SPA can handle it."""
        return app.send_static_file('index.html')

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
