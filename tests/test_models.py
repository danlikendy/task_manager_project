import pytest
from app.models import Task, TaskCreate, TaskUpdate, TaskStatus


def test_task_status_enum():
    assert TaskStatus.CREATED == "создано"
    assert TaskStatus.IN_PROGRESS == "в работе"
    assert TaskStatus.COMPLETED == "завершено"


def test_task_create_model():
    task_data = {
        "title": "Тестовая задача",
        "description": "Описание задачи",
        "status": TaskStatus.CREATED
    }
    task = TaskCreate(**task_data)
    assert task.title == "Тестовая задача"
    assert task.description == "Описание задачи"
    assert task.status == TaskStatus.CREATED


def test_task_create_model_default_status():
    task_data = {"title": "Тестовая задача"}
    task = TaskCreate(**task_data)
    assert task.status == TaskStatus.CREATED


def test_task_update_model():
    task_data = {"title": "Обновленное название"}
    task = TaskUpdate(**task_data)
    assert task.title == "Обновленное название"
    assert task.description is None
    assert task.status is None


def test_task_model():
    task_data = {
        "title": "Тестовая задача",
        "description": "Описание задачи",
        "status": TaskStatus.IN_PROGRESS
    }
    task = Task(**task_data)
    assert task.title == "Тестовая задача"
    assert task.description == "Описание задачи"
    assert task.status == TaskStatus.IN_PROGRESS
    assert task.id is not None


def test_task_model_validation():
    with pytest.raises(ValueError):
        TaskCreate(title="")
    
    with pytest.raises(ValueError):
        TaskCreate(title="a" * 201)
    
    with pytest.raises(ValueError):
        TaskCreate(title="Тест", description="a" * 1001)
