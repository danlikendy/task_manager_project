import pytest
from app.models import Task, TaskCreate, TaskUpdate, TaskStatus, TaskPriority


def test_task_status_enum():
    assert TaskStatus.CREATED == "создано"
    assert TaskStatus.IN_PROGRESS == "в работе"
    assert TaskStatus.COMPLETED == "завершено"


def test_task_priority_enum():
    assert TaskPriority.LOW == 1
    assert TaskPriority.MEDIUM == 2
    assert TaskPriority.HIGH == 3
    assert TaskPriority.URGENT == 4
    assert TaskPriority.CRITICAL == 5


def test_task_create_model():
    task_data = {
        "title": "Тестовая задача",
        "description": "Описание задачи",
        "status": TaskStatus.CREATED,
        "tags": ["test", "api"],
        "priority": TaskPriority.HIGH
    }
    task = TaskCreate(**task_data)
    assert task.title == "Тестовая задача"
    assert task.description == "Описание задачи"
    assert task.status == TaskStatus.CREATED
    assert task.tags == ["test", "api"]
    assert task.priority == TaskPriority.HIGH


def test_task_create_model_default_values():
    task_data = {"title": "Тестовая задача"}
    task = TaskCreate(**task_data)
    assert task.status == TaskStatus.CREATED
    assert task.tags == []
    assert task.priority == TaskPriority.MEDIUM


def test_task_update_model():
    task_data = {"title": "Обновленное название", "priority": TaskPriority.URGENT}
    task = TaskUpdate(**task_data)
    assert task.title == "Обновленное название"
    assert task.priority == TaskPriority.URGENT
    assert task.description is None
    assert task.status is None
    assert task.tags is None


def test_task_model():
    task_data = {
        "title": "Тестовая задача",
        "description": "Описание задачи",
        "status": TaskStatus.IN_PROGRESS,
        "tags": ["backend", "python"],
        "priority": TaskPriority.CRITICAL
    }
    task = Task(**task_data)
    assert task.title == "Тестовая задача"
    assert task.description == "Описание задачи"
    assert task.status == TaskStatus.IN_PROGRESS
    assert task.tags == ["backend", "python"]
    assert task.priority == TaskPriority.CRITICAL
    assert task.id is not None


def test_task_model_validation():
    with pytest.raises(ValueError):
        TaskCreate(title="")
    
    with pytest.raises(ValueError):
        TaskCreate(title="Тест", description="a" * 1001)


def test_tags_validation():
    with pytest.raises(ValueError):
        TaskCreate(title="Тест", tags=["a" * 51])
    
    with pytest.raises(ValueError):
        TaskCreate(title="Тест", tags=["", "valid"])
    
    task = TaskCreate(title="Тест", tags=["  tag1  ", "tag2"])
    assert task.tags == ["tag1", "tag2"]
