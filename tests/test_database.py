import pytest
from uuid import uuid4
from app.database import TaskDatabase
from app.models import TaskCreate, TaskUpdate, TaskStatus, TaskPriority


@pytest.fixture
def db():
    return TaskDatabase()


def test_create_task(db):
    task_data = TaskCreate(title="Тест", description="Описание", tags=["test"], priority=TaskPriority.HIGH)
    task = db.create_task(task_data)
    assert task.title == "Тест"
    assert task.description == "Описание"
    assert task.status == TaskStatus.CREATED
    assert task.tags == ["test"]
    assert task.priority == TaskPriority.HIGH
    assert task.id in db.tasks


def test_get_task(db):
    task_data = TaskCreate(title="Тест")
    created_task = db.create_task(task_data)
    retrieved_task = db.get_task(created_task.id)
    assert retrieved_task == created_task


def test_get_task_not_found(db):
    task = db.get_task(uuid4())
    assert task is None


def test_get_tasks(db):
    task1 = db.create_task(TaskCreate(title="Задача 1"))
    task2 = db.create_task(TaskCreate(title="Задача 2"))
    tasks = db.get_tasks()
    assert len(tasks) == 2
    assert task1 in tasks
    assert task2 in tasks


def test_get_tasks_with_pagination(db):
    for i in range(5):
        db.create_task(TaskCreate(title=f"Задача {i}"))
    
    tasks = db.get_tasks(skip=2, limit=2)
    assert len(tasks) == 2


def test_update_task(db):
    task = db.create_task(TaskCreate(title="Старое название"))
    update_data = TaskUpdate(title="Новое название", status=TaskStatus.IN_PROGRESS)
    updated_task = db.update_task(task.id, update_data)
    
    assert updated_task.title == "Новое название"
    assert updated_task.status == TaskStatus.IN_PROGRESS


def test_update_task_not_found(db):
    update_data = TaskUpdate(title="Новое название")
    result = db.update_task(uuid4(), update_data)
    assert result is None


def test_delete_task(db):
    task = db.create_task(TaskCreate(title="Тест"))
    assert db.delete_task(task.id) is True
    assert db.get_task(task.id) is None


def test_delete_task_not_found(db):
    assert db.delete_task(uuid4()) is False


def test_get_tasks_by_status(db):
    db.create_task(TaskCreate(title="Задача 1", status=TaskStatus.CREATED))
    db.create_task(TaskCreate(title="Задача 2", status=TaskStatus.IN_PROGRESS))
    db.create_task(TaskCreate(title="Задача 3", status=TaskStatus.CREATED))
    
    created_tasks = db.get_tasks_by_status("создано")
    assert len(created_tasks) == 2
    
    in_progress_tasks = db.get_tasks_by_status("в работе")
    assert len(in_progress_tasks) == 1


def test_search_tasks(db):
    db.create_task(TaskCreate(title="Python задача", description="Разработка на Python"))
    db.create_task(TaskCreate(title="API задача", description="Создание REST API"))
    db.create_task(TaskCreate(title="Тестовая задача"))
    
    python_tasks = db.search_tasks("Python")
    assert len(python_tasks) == 1
    assert "Python" in python_tasks[0].title
    
    api_tasks = db.search_tasks("API")
    assert len(api_tasks) == 1
    assert "API" in api_tasks[0].title


def test_get_tasks_filtered(db):
    db.create_task(TaskCreate(title="Задача 1", status=TaskStatus.CREATED, priority=TaskPriority.LOW))
    db.create_task(TaskCreate(title="Задача 2", status=TaskStatus.IN_PROGRESS, priority=TaskPriority.HIGH))
    db.create_task(TaskCreate(title="Задача 3", status=TaskStatus.CREATED, priority=TaskPriority.MEDIUM))
    
    # Фильтр по статусу
    created_tasks = db.get_tasks_filtered(TaskStatus.CREATED, None, None)
    assert len(created_tasks) == 2
    
    # Фильтр по приоритету
    high_priority_tasks = db.get_tasks_filtered(None, None, TaskPriority.HIGH)
    assert len(high_priority_tasks) == 1
    assert high_priority_tasks[0].priority == TaskPriority.HIGH


def test_get_tasks_stats(db):
    db.create_task(TaskCreate(title="Задача 1", status=TaskStatus.CREATED, priority=TaskPriority.LOW, tags=["backend"]))
    db.create_task(TaskCreate(title="Задача 2", status=TaskStatus.IN_PROGRESS, priority=TaskPriority.HIGH, tags=["backend", "api"]))
    db.create_task(TaskCreate(title="Задача 3", status=TaskStatus.CREATED, priority=TaskPriority.MEDIUM, tags=["frontend"]))
    
    stats = db.get_tasks_stats()
    
    assert stats["total_tasks"] == 3
    assert stats["status_distribution"]["создано"] == 2
    assert stats["status_distribution"]["в работе"] == 1
    assert stats["priority_distribution"][1] == 1
    assert stats["priority_distribution"][2] == 1
    assert stats["priority_distribution"][3] == 1
    assert "backend" in stats["popular_tags"]
    assert "api" in stats["popular_tags"]
    assert "frontend" in stats["popular_tags"]
