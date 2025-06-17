import os
import sys
from pathlib import Path

# Ensure the project sources are importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'State-of-the-Art Website with Advanced Designs'))

import pytest
from app import create_app
from user import db

@pytest.fixture()
def app():
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
    os.environ['JWT_SECRET_KEY'] = 'testing-secret'
    app = create_app()
    app.config['TESTING'] = True
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture()
def client(app):
    return app.test_client()


def register_user(client, username='alice', email='alice@example.com', password='StrongPass!123'):
    return client.post('/api/auth/register', json={
        'username': username,
        'email': email,
        'password': password
    })


def login_user(client, username='alice', password='StrongPass!123'):
    return client.post('/api/auth/login', json={
        'username': username,
        'password': password
    })


def test_register_requires_strong_password(client):
    res = register_user(client, password='weak')
    assert res.status_code == 400
    assert 'Password' in res.get_json()['error']


def test_register_login_logout_flow(client):
    reg = register_user(client)
    assert reg.status_code == 201

    login = login_user(client)
    assert login.status_code == 200
    token = login.get_json()['access_token']

    verify = client.post('/api/auth/verify-token', headers={'Authorization': f'Bearer {token}'})
    assert verify.status_code == 200

    logout = client.post('/api/auth/logout', headers={'Authorization': f'Bearer {token}'})
    assert logout.status_code == 200

    verify_again = client.post('/api/auth/verify-token', headers={'Authorization': f'Bearer {token}'})
    assert verify_again.status_code == 401
