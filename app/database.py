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
    
    def get_tasks_filtered(self, status: Optional[str], tags: Optional[List[str]], priority: Optional[int], skip: int = 0, limit: int = 100) -> List[Task]:
        filtered_tasks = []
        
        for task in self.tasks.values():
            # Фильтр по статусу
            if status and task.status.value != status.value:
                continue
                
            # Фильтр по приоритету
            if priority and task.priority.value != priority:
                continue
                
            # Фильтр по тегам
            if tags and not any(tag in task.tags for tag in tags):
                continue
                
            filtered_tasks.append(task)
        
        # Применяем пагинацию
        return filtered_tasks[skip:skip + limit]
    
    def get_tasks_by_status(self, status: str) -> List[Task]:
        """Получение задач по статусу"""
        return [task for task in self.tasks.values() if task.status.value == status]
    
    def search_tasks(self, query: str, limit: int = 50) -> List[Task]:
        """Поиск задач по названию или описанию"""
        query_lower = query.lower()
        matching_tasks = []
        
        for task in self.tasks.values():
            if (query_lower in task.title.lower() or 
                (task.description and query_lower in task.description.lower())):
                matching_tasks.append(task)
                if len(matching_tasks) >= limit:
                    break
        
        return matching_tasks

    def get_tasks_stats(self) -> dict:
        total_tasks = len(self.tasks)
        status_counts = {}
        priority_counts = {}
        tag_counts = {}
        
        for task in self.tasks.values():
            # Подсчет по статусам
            status = task.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
            
            # Подсчет по приоритетам
            priority = task.priority.value
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
            
            # Подсчет по тегам
            for tag in task.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        return {
            "total_tasks": total_tasks,
            "status_distribution": status_counts,
            "priority_distribution": priority_counts,
            "popular_tags": dict(sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10])
        }


# Глобальный экземпляр базы данных
task_db = TaskDatabase()
