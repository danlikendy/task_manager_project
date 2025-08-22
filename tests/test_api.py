import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Task Manager API"
    assert data["version"] == "1.0.0"


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_task(client, clean_db):
    task_data = {
        "title": "Тестовая задача",
        "description": "Описание задачи",
        "status": "создано"
    }
    response = client.post("/tasks/", json=task_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["title"] == "Тестовая задача"
    assert data["description"] == "Описание задачи"
    assert data["status"] == "создано"
    assert "id" in data


def test_create_task_minimal(client, clean_db):
    task_data = {"title": "Простая задача"}
    response = client.post("/tasks/", json=task_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["title"] == "Простая задача"
    assert data["status"] == "создано"


def test_create_task_validation_error(client):
    response = client.post("/tasks/", json={"title": ""})
    assert response.status_code == 422


def test_get_tasks_empty(client, clean_db):
    response = client.get("/tasks/")
    assert response.status_code == 200
    assert response.json() == []


def test_get_tasks_with_data(client, clean_db):
    client.post("/tasks/", json={"title": "Задача 1"})
    client.post("/tasks/", json={"title": "Задача 2"})
    
    response = client.get("/tasks/")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 2


def test_get_tasks_with_pagination(client, clean_db):
    for i in range(5):
        client.post("/tasks/", json={"title": f"Задача {i}"})
    
    response = client.get("/tasks/?skip=2&limit=2")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 2


def test_get_tasks_by_status(client, clean_db):
    client.post("/tasks/", json={"title": "Задача 1", "status": "создано"})
    client.post("/tasks/", json={"title": "Задача 2", "status": "в работе"})
    client.post("/tasks/", json={"title": "Задача 3", "status": "создано"})
    
    response = client.get("/tasks/?status=создано")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 2
    assert all(task["status"] == "создано" for task in data)


def test_get_task_by_id(client, clean_db):
    create_response = client.post("/tasks/", json={"title": "Тестовая задача"})
    task_id = create_response.json()["id"]
    
    response = client.get(f"/tasks/{task_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["title"] == "Тестовая задача"
    assert data["id"] == task_id


def test_get_task_not_found(client):
    import uuid
    task_id = str(uuid.uuid4())
    
    response = client.get(f"/tasks/{task_id}")
    assert response.status_code == 404


def test_update_task(client, clean_db):
    create_response = client.post("/tasks/", json={"title": "Старое название"})
    task_id = create_response.json()["id"]
    
    update_data = {"title": "Новое название", "status": "в работе"}
    response = client.put(f"/tasks/{task_id}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["title"] == "Новое название"
    assert data["status"] == "в работе"


def test_update_task_not_found(client):
    import uuid
    task_id = str(uuid.uuid4())
    
    update_data = {"title": "Новое название"}
    response = client.put(f"/tasks/{task_id}", json=update_data)
    assert response.status_code == 404


def test_delete_task(client, clean_db):
    create_response = client.post("/tasks/", json={"title": "Задача для удаления"})
    task_id = create_response.json()["id"]
    
    response = client.delete(f"/tasks/{task_id}")
    assert response.status_code == 204
    
    get_response = client.get(f"/tasks/{task_id}")
    assert get_response.status_code == 404


def test_delete_task_not_found(client):
    import uuid
    task_id = str(uuid.uuid4())
    
    response = client.delete(f"/tasks/{task_id}")
    assert response.status_code == 404


def test_get_tasks_by_status_endpoint(client, clean_db):
    client.post("/tasks/", json={"title": "Задача 1", "status": "создано"})
    client.post("/tasks/", json={"title": "Задача 2", "status": "завершено"})
    
    response = client.get("/tasks/status/создано")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 1
    assert data[0]["status"] == "создано"


def test_search_tasks(client, clean_db):
    client.post("/tasks/", json={"title": "Python задача", "description": "Разработка на Python"})
    client.post("/tasks/", json={"title": "API задача", "description": "Создание REST API"})
    client.post("/tasks/", json={"title": "Тестовая задача"})
    
    response = client.get("/tasks/search/?query=Python")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 1
    assert "Python" in data[0]["title"]


def test_get_tasks_with_filters(client, clean_db):
    client.post("/tasks/", json={"title": "Задача 1", "status": "создано", "priority": 1})
    client.post("/tasks/", json={"title": "Задача 2", "status": "в работе", "priority": 3})
    client.post("/tasks/", json={"title": "Задача 3", "status": "создано", "priority": 2})
    
    # Фильтр по статусу
    response = client.get("/tasks/?status=создано")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(task["status"] == "создано" for task in data)
    
    # Фильтр по приоритету
    response = client.get("/tasks/?priority=3")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["priority"] == 3


def test_get_tasks_stats(client, clean_db):
    client.post("/tasks/", json={"title": "Задача 1", "status": "создано", "priority": 1, "tags": ["backend"]})
    client.post("/tasks/", json={"title": "Задача 2", "status": "в работе", "priority": 3, "tags": ["backend", "api"]})
    
    response = client.get("/tasks/stats/")
    assert response.status_code == 200
    
    data = response.json()
    assert data["total_tasks"] == 2
    assert data["status_distribution"]["создано"] == 1
    assert data["status_distribution"]["в работе"] == 1
    assert "backend" in data["popular_tags"]
    assert "api" in data["popular_tags"]
