import pytest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.cache import Cache, cache_result, generate_cache_key, invalidate_cache_pattern


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    response = client.post("/token", data={"username": "admin", "password": "secret"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def cache():
    return Cache(default_ttl=5)


def test_cache_set_get(cache):
    cache.set("test_key", "test_value", ttl=10)
    assert cache.get("test_key") == "test_value"


def test_cache_expiration(cache):
    cache.set("expire_key", "expire_value", ttl=1)
    assert cache.get("expire_key") == "expire_value"
    time.sleep(1.1)
    assert cache.get("expire_key") is None


def test_cache_delete(cache):
    cache.set("delete_key", "delete_value")
    assert cache.delete("delete_key") is True
    assert cache.get("delete_key") is None


def test_cache_exists(cache):
    cache.set("exists_key", "exists_value")
    assert cache.exists("exists_key") is True
    assert cache.exists("nonexistent_key") is False


def test_cache_clear(cache):
    cache.set("key1", "value1")
    cache.set("key2", "value2")
    cache.clear()
    assert cache.get("key1") is None
    assert cache.get("key2") is None


def test_cache_stats(cache):
    cache.set("key1", "value1", ttl=10)
    cache.set("key2", "value2", ttl=1)
    
    stats = cache.get_stats()
    assert stats["total_entries"] == 2
    assert stats["active_entries"] == 2
    
    time.sleep(1.1)
    stats = cache.get_stats()
    assert stats["expired_entries"] == 1


def test_cache_cleanup(cache):
    cache.set("key1", "value1", ttl=10)
    cache.set("key2", "value2", ttl=1)
    
    time.sleep(1.1)
    cleaned_count = cache.cleanup_expired()
    assert cleaned_count == 1
    
    stats = cache.get_stats()
    assert stats["total_entries"] == 1


def test_generate_cache_key():
    key1 = generate_cache_key("arg1", "arg2", kwarg1="value1")
    key2 = generate_cache_key("arg1", "arg2", kwarg1="value1")
    key3 = generate_cache_key("arg1", "arg2", kwarg1="value2")
    
    assert key1 == key2
    assert key1 != key3


def test_cache_result_decorator(cache):
    call_count = 0
    
    @cache_result(ttl=10, key_prefix="test_func")
    def test_function(arg1, arg2):
        nonlocal call_count
        call_count += 1
        return f"result_{arg1}_{arg2}"
    
    result1 = test_function("a", "b")
    result2 = test_function("a", "b")
    
    assert result1 == result2
    assert call_count == 1


def test_invalidate_cache_pattern(cache):
    cache.set("tasks:key1", "value1")
    cache.set("tasks:key2", "value2")
    cache.set("users:key3", "value3")
    
    invalidated_count = invalidate_cache_pattern("tasks", cache)
    assert invalidated_count == 2
    
    assert cache.get("tasks:key1") is None
    assert cache.get("tasks:key2") is None
    assert cache.get("users:key3") is not None


def test_cache_endpoints(client, auth_headers):
    # Тест получения статистики кэша
    response = client.get("/cache/stats", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "total_entries" in data
    assert "active_entries" in data
    assert "expired_entries" in data
    assert "cache_size" in data


def test_cache_clear_endpoint(client, auth_headers):
    # Тест очистки кэша
    response = client.delete("/cache/clear", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["message"] == "Cache cleared successfully"


def test_cache_cleanup_endpoint(client, auth_headers):
    # Тест очистки истекших записей
    response = client.post("/cache/cleanup", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "message" in data
    assert "cleaned_entries" in data


def test_cache_integration_with_database(client, auth_headers):
    # Создаем задачу
    task_data = {"title": "Test task for cache"}
    create_response = client.post("/tasks/", json=task_data, headers=auth_headers)
    assert create_response.status_code == 201
    
    # Получаем список задач (должен быть закэширован)
    response1 = client.get("/tasks/", headers=auth_headers)
    assert response1.status_code == 200
    
    response2 = client.get("/tasks/", headers=auth_headers)
    assert response2.status_code == 200
    
    # Оба ответа должны быть одинаковыми
    assert response1.json() == response2.json()


def test_cache_invalidation_on_update(client, auth_headers):
    # Создаем задачу
    task_data = {"title": "Task to update"}
    create_response = client.post("/tasks/", json=task_data, headers=auth_headers)
    assert create_response.status_code == 201
    task_id = create_response.json()["id"]
    
    # Получаем список задач
    response1 = client.get("/tasks/", headers=auth_headers)
    assert response1.status_code == 200
    initial_count = len(response1.json())
    
    # Обновляем задачу
    update_data = {"title": "Updated task title"}
    update_response = client.put(f"/tasks/{task_id}", json=update_data, headers=auth_headers)
    assert update_response.status_code == 200
    
    # Получаем список задач снова
    response2 = client.get("/tasks/", headers=auth_headers)
    assert response2.status_code == 200
    
    # Кэш должен быть инвалидирован и обновлен
    assert len(response2.json()) == initial_count
    updated_task = next((t for t in response2.json() if t["id"] == task_id), None)
    assert updated_task is not None
    assert updated_task["title"] == "Updated task title"
