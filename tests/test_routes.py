import os
import sys
from pathlib import Path

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


def test_index_served(client):
    res = client.get('/')
    assert res.status_code == 200
    assert b'SecureVault' in res.data


def test_main_js_served(client):
    res = client.get('/src/main.js')
    assert res.status_code == 200
    assert b'import React' in res.data


def test_auth_context_no_jsx(client):
    res = client.get('/src/AuthContext.js')
    assert res.status_code == 200
    assert b'<AuthContext.Provider' not in res.data
    assert b'React.createElement' in res.data
