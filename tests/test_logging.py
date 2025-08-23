import pytest
from fastapi.testclient import TestClient
from app.main import app
import logging


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    response = client.post("/token", data={"username": "admin", "password": "secret"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_metrics_endpoint(client, auth_headers):
    response = client.get("/metrics", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "total_tasks" in data
    assert "completed_tasks" in data
    assert "overdue_tasks" in data
    assert "today_tasks" in data
    assert "week_tasks" in data
    assert "completion_rate" in data
    assert "overdue_rate" in data
    assert "timestamp" in data


def test_detailed_health_check(client):
    response = client.get("/health/detailed")
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
    assert "timestamp" in data
    assert "database" in data
    assert "total_tasks" in data
    assert "memory_usage" in data
    assert "uptime" in data


def test_logging_middleware(client, auth_headers):
    response = client.get("/tasks/", headers=auth_headers)
    assert response.status_code == 200


def test_security_middleware(client):
    suspicious_paths = ["/admin", "/config", "/.env", "/wp-admin"]
    
    for path in suspicious_paths:
        response = client.get(path)
        assert response.status_code == 404


def test_performance_middleware(client, auth_headers):
    response = client.get("/tasks/", headers=auth_headers)
    assert response.status_code == 200


def test_logger_setup():
    from app.logger import setup_logger
    
    logger = setup_logger("test_logger", "DEBUG")
    assert logger is not None
    assert logger.level == logging.DEBUG


def test_log_functions():
    from app.logger import log_request, log_error, log_security_event, log_performance
    import logging
    
    logger = logging.getLogger("test")
    
    log_request(logger, "GET", "/test", 200, 0.1, "test_user")
    log_error(logger, Exception("Test error"), "test_context")
    log_security_event(logger, "test_event", "test_user", "test_details")
    log_performance(logger, "test_operation", 0.5, "test_details")
