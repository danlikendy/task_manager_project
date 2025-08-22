from typing import Dict, List, Optional
from uuid import UUID
from app.models import Task, TaskCreate, TaskUpdate


class TaskDatabase:
    """In-memory база данных для задач"""
    
    def __init__(self):
        self.tasks: Dict[UUID, Task] = {}
    
    def create_task(self, task_data: TaskCreate) -> Task:
        """Создание новой задачи"""
        task = Task(**task_data.model_dump())
        self.tasks[task.id] = task
        return task
    
    def get_task(self, task_id: UUID) -> Optional[Task]:
        """Получение задачи по ID"""
        return self.tasks.get(task_id)
    
    def get_tasks(self, skip: int = 0, limit: int = 100) -> List[Task]:
        """Получение списка задач с пагинацией"""
        tasks = list(self.tasks.values())
        return tasks[skip:skip + limit]
    
    def update_task(self, task_id: UUID, task_data: TaskUpdate) -> Optional[Task]:
        """Обновление задачи"""
        if task_id not in self.tasks:
            return None
        
        task = self.tasks[task_id]
        update_data = task_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(task, field, value)
        
        return task
    
    def delete_task(self, task_id: UUID) -> bool:
        """Удаление задачи"""
        if task_id in self.tasks:
            del self.tasks[task_id]
            return True
        return False
    
    def get_tasks_by_status(self, status: str) -> List[Task]:
        """Получение задач по статусу"""
        return [task for task in self.tasks.values() if task.status.value == status]


# Глобальный экземпляр базы данных
task_db = TaskDatabase()
