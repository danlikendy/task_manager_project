import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import task_db


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def clean_db():
    task_db.tasks.clear()
    yield
    task_db.tasks.clear()


@pytest.fixture
def auth_headers(client):
    """Фикстура для получения заголовков аутентификации"""
    response = client.post("/token", data={"username": "admin", "password": "secret"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_task_data():
    """Фикстура с примером данных задачи"""
    return {
        "title": "Тестовая задача",
        "description": "Описание тестовой задачи",
        "status": "создано"
    }


@pytest.fixture
def sample_task_data_in_progress():
    """Фикстура с примером данных задачи в работе"""
    return {
        "title": "Задача в работе",
        "description": "Описание задачи в работе",
        "status": "в работе"
    }
