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
    response = client.post("/token", data={"username": "admin", "password": "secret"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Task Manager API"
    assert data["version"] == "1.0.0"


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_create_task(client, clean_db, auth_headers):
    task_data = {
        "title": "Тестовая задача",
        "description": "Описание задачи",
        "status": "создано"
    }
    response = client.post("/tasks/", json=task_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == task_data["title"]
    assert data["description"] == task_data["description"]
    assert data["status"] == task_data["status"]
    assert "id" in data


def test_create_task_minimal(client, clean_db, auth_headers):
    task_data = {"title": "Простая задача"}
    response = client.post("/tasks/", json=task_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == task_data["title"]
    assert data["status"] == "создано"


def test_create_task_validation_error(client, auth_headers):
    response = client.post("/tasks/", json={"title": ""}, headers=auth_headers)
    assert response.status_code == 422


def test_get_tasks_empty(client, clean_db, auth_headers):
    response = client.get("/tasks/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0


def test_get_tasks_with_data(client, clean_db, auth_headers):
    client.post("/tasks/", json={"title": "Задача 1"}, headers=auth_headers)
    client.post("/tasks/", json={"title": "Задача 2"}, headers=auth_headers)

    response = client.get("/tasks/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_tasks_with_pagination(client, clean_db, auth_headers):
    for i in range(5):
        client.post("/tasks/", json={"title": f"Задача {i}"}, headers=auth_headers)

    response = client.get("/tasks/?skip=2&limit=2", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_tasks_by_status(client, clean_db, auth_headers):
    client.post("/tasks/", json={"title": "Задача 1", "status": "создано"}, headers=auth_headers)
    client.post("/tasks/", json={"title": "Задача 2", "status": "в работе"}, headers=auth_headers)
    client.post("/tasks/", json={"title": "Задача 3", "status": "создано"}, headers=auth_headers)

    response = client.get("/tasks/?status=создано", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_task_by_id(client, clean_db, auth_headers):
    create_response = client.post("/tasks/", json={"title": "Тестовая задача"}, headers=auth_headers)
    task_id = create_response.json()["id"]

    response = client.get(f"/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task_id
    assert data["title"] == "Тестовая задача"


def test_get_task_not_found(client, clean_db, auth_headers):
    import uuid
    fake_id = str(uuid.uuid4())
    response = client.get(f"/tasks/{fake_id}", headers=auth_headers)
    assert response.status_code == 404


def test_update_task(client, clean_db, auth_headers):
    create_response = client.post("/tasks/", json={"title": "Старое название"}, headers=auth_headers)
    task_id = create_response.json()["id"]

    update_data = {"title": "Новое название", "status": "в работе"}
    response = client.put(f"/tasks/{task_id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Новое название"
    assert data["status"] == "в работе"


def test_update_task_not_found(client, clean_db, auth_headers):
    import uuid
    fake_id = str(uuid.uuid4())
    response = client.put(f"/tasks/{fake_id}", json={"title": "Новое название"}, headers=auth_headers)
    assert response.status_code == 404


def test_delete_task(client, clean_db, auth_headers):
    create_response = client.post("/tasks/", json={"title": "Задача для удаления"}, headers=auth_headers)
    task_id = create_response.json()["id"]

    response = client.delete(f"/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 204

    get_response = client.get(f"/tasks/{task_id}", headers=auth_headers)
    assert get_response.status_code == 404


def test_delete_task_not_found(client, clean_db, auth_headers):
    import uuid
    fake_id = str(uuid.uuid4())
    response = client.delete(f"/tasks/{fake_id}", headers=auth_headers)
    assert response.status_code == 404


def test_get_tasks_by_status_endpoint(client, clean_db, auth_headers):
    client.post("/tasks/", json={"title": "Задача 1", "status": "создано"}, headers=auth_headers)
    client.post("/tasks/", json={"title": "Задача 2", "status": "завершено"}, headers=auth_headers)

    response = client.get("/tasks/status/создано", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert data[0]["status"] == "создано"


def test_search_tasks(client, clean_db, auth_headers):
    client.post("/tasks/", json={"title": "Python задача", "description": "Разработка на Python"}, headers=auth_headers)
    client.post("/tasks/", json={"title": "API задача", "description": "Создание REST API"}, headers=auth_headers)

    client.post("/tasks/", json={"title": "Тестовая задача"}, headers=auth_headers)

    response = client.get("/tasks/search/?query=Python", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert "Python" in data[0]["title"]


def test_get_tasks_with_filters(client, clean_db, auth_headers):
    client.post("/tasks/", json={"title": "Задача 1", "status": "создано", "priority": 1}, headers=auth_headers)
    client.post("/tasks/", json={"title": "Задача 2", "status": "в работе", "priority": 3}, headers=auth_headers)

    client.post("/tasks/", json={"title": "Задача 3", "status": "создано", "priority": 2}, headers=auth_headers)

    # Фильтр по статусу
    response = client.get("/tasks/?status=создано", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    # Фильтр по приоритету
    response = client.get("/tasks/?priority=3", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


def test_get_tasks_stats(client, clean_db, auth_headers):
    client.post("/tasks/", json={"title": "Задача 1", "status": "создано", "priority": 1, "tags": ["backend"]}, headers=auth_headers)

    client.post("/tasks/", json={"title": "Задача 2", "status": "в работе", "priority": 3, "tags": ["backend", "api"]}, headers=auth_headers)

    response = client.get("/tasks/stats/", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()
    assert data["total_tasks"] == 2
    assert data["status_distribution"]["создано"] == 1
    assert data["status_distribution"]["в работе"] == 1
    assert "backend" in data["popular_tags"]
    assert "api" in data["popular_tags"]
