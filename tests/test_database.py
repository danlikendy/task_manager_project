import pytest
from uuid import uuid4
from app.database import TaskDatabase
from app.models import TaskCreate, TaskUpdate, TaskStatus


@pytest.fixture
def db():
    return TaskDatabase()


def test_create_task(db):
    task_data = TaskCreate(title="Тест", description="Описание")
    task = db.create_task(task_data)
    assert task.title == "Тест"
    assert task.description == "Описание"
    assert task.status == TaskStatus.CREATED
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
