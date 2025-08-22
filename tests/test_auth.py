import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_login_success(client):
    response = client.post("/token", data={"username": "admin", "password": "secret"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    response = client.post("/token", data={"username": "admin", "password": "wrong"})
    assert response.status_code == 400
    assert "Incorrect username or password" in response.json()["detail"]


def test_get_user_info(client):
    # Сначала получаем токен
    login_response = client.post("/token", data={"username": "admin", "password": "secret"})
    token = login_response.json()["access_token"]
    
    # Используем токен для получения информации о пользователе
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"


def test_get_user_info_without_token(client):
    response = client.get("/users/me")
    assert response.status_code == 403


def test_get_user_info_with_invalid_token(client):
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 401
