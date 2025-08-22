from typing import Dict, List, Optional
from uuid import UUID
from datetime import datetime
from app.models import Task, TaskCreate, TaskUpdate
from app.models import TaskStatus


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
    
    def get_tasks(self, skip: int = 0, limit: int = 100, sort_by: str = "created_at", order: str = "desc") -> List[Task]:
        """Получение списка задач с пагинацией"""
        tasks = list(self.tasks.values())
        tasks = self._sort_tasks(tasks, sort_by, order)
        return tasks[skip:skip + limit]
    
    def update_task(self, task_id: UUID, task_data: TaskUpdate) -> Optional[Task]:
        """Обновление задачи"""
        if task_id not in self.tasks:
            return None
        
        task = self.tasks[task_id]
        update_data = task_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(task, field, value)
        
        task.updated_at = datetime.now()
        return task
    
    def delete_task(self, task_id: UUID) -> bool:
        """Удаление задачи"""
        if task_id in self.tasks:
            del self.tasks[task_id]
            return True
        return False
    
    def get_tasks_filtered(self, status: Optional[str], tags: Optional[List[str]], priority: Optional[int], skip: int = 0, limit: int = 100, sort_by: str = "created_at", order: str = "desc") -> List[Task]:
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
        filtered_tasks = self._sort_tasks(filtered_tasks, sort_by, order)
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
    
    def _sort_tasks(self, tasks: List[Task], sort_by: str, order: str) -> List[Task]:
        reverse = order.lower() == "desc"
        
        if sort_by == "title":
            return sorted(tasks, key=lambda x: x.title.lower(), reverse=reverse)
        elif sort_by == "status":
            return sorted(tasks, key=lambda x: x.status.value, reverse=reverse)
        elif sort_by == "priority":
            return sorted(tasks, key=lambda x: x.priority.value, reverse=reverse)
        elif sort_by == "created_at":
            return sorted(tasks, key=lambda x: x.created_at, reverse=reverse)
        else:
            return sorted(tasks, key=lambda x: x.created_at, reverse=reverse)
    
    def bulk_update_status(self, task_ids: List[UUID], status: TaskStatus) -> int:
        updated_count = 0
        for task_id in task_ids:
            if task_id in self.tasks:
                self.tasks[task_id].status = status
                self.tasks[task_id].updated_at = datetime.now()
                updated_count += 1
        return updated_count
    
    def bulk_delete_tasks(self, task_ids: List[UUID]) -> int:
        deleted_count = 0
        for task_id in task_ids:
            if task_id in self.tasks:
                del self.tasks[task_id]
                deleted_count += 1
        return deleted_count
    
    def get_tasks_by_date_range(self, start_date: datetime, end_date: datetime, skip: int = 0, limit: int = 100) -> List[Task]:
        filtered_tasks = []
        
        for task in self.tasks.values():
            if start_date <= task.created_at <= end_date:
                filtered_tasks.append(task)
        
        filtered_tasks = self._sort_tasks(filtered_tasks, "created_at", "desc")
        return filtered_tasks[skip:skip + limit]


# Глобальный экземпляр базы данных
task_db = TaskDatabase()
