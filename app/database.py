from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, date, timedelta
from app.models import Task, TaskCreate, TaskUpdate, TaskStatus, TaskPriority

class TaskDatabase:
    def __init__(self):
        self.tasks: Dict[UUID, Task] = {}
    
    def get_tasks(self, skip: int = 0, limit: int = 100, sort_by: str = "created_at", order: str = "desc") -> List[Task]:
        tasks = list(self.tasks.values())
        
        if sort_by == "title":
            tasks.sort(key=lambda x: x.title, reverse=(order == "desc"))
        elif sort_by == "status":
            tasks.sort(key=lambda x: x.status.value, reverse=(order == "desc"))
        elif sort_by == "priority":
            tasks.sort(key=lambda x: x.priority.value, reverse=(order == "desc"))
        elif sort_by == "due_date":
            tasks.sort(key=lambda x: x.due_date or date.max, reverse=(order == "desc"))
        else:
            tasks.sort(key=lambda x: x.created_at or datetime.min, reverse=(order == "desc"))
        
        return tasks[skip:skip + limit]
    
    def get_task(self, task_id: UUID) -> Optional[Task]:
        return self.tasks.get(task_id)
    
    def create_task(self, task_create: TaskCreate) -> Task:
        task_id = uuid4()
        now = datetime.now()
        
        task = Task(
            id=task_id,
            title=task_create.title,
            description=task_create.description,
            status=task_create.status,
            priority=task_create.priority,
            tags=task_create.tags,
            due_date=task_create.due_date,
            created_at=now,
            updated_at=now
        )
        
        self.tasks[task_id] = task
        
        print(f"Task created: {task.title}")
        
        return task
    
    def update_task(self, task_id: UUID, task_update: TaskUpdate) -> Optional[Task]:
        if task_id not in self.tasks:
            return None
        
        task = self.tasks[task_id]
        old_status = task.status
        
        if task_update.title is not None:
            task.title = task_update.title
        if task_update.description is not None:
            task.description = task_update.description
        if task_update.status is not None:
            task.status = task_update.status
        if task_update.priority is not None:
            task.priority = task_update.priority
        if task_update.tags is not None:
            task.tags = task_update.tags
        if task_update.due_date is not None:
            task.due_date = task_update.due_date
        
        task.updated_at = datetime.now()
        
        if task_update.status == TaskStatus.COMPLETED and old_status != TaskStatus.COMPLETED:
            print(f"Task completed: {task.title}")
        else:
            print(f"Task updated: {task.title}")
        
        return task
    
    def delete_task(self, task_id: UUID) -> bool:
        if task_id in self.tasks:
            del self.tasks[task_id]
            print(f"Task deleted: {task_id}")
            return True
        return False
    
    def get_task_stats(self) -> Dict[str, Any]:
        tasks = self.get_tasks()
        total = len(tasks)
        completed = len([t for t in tasks if t.status == TaskStatus.COMPLETED])
        in_progress = len([t for t in tasks if t.status == TaskStatus.IN_PROGRESS])
        overdue = len([t for t in tasks if t.status == TaskStatus.OVERDUE])
        
        return {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "overdue": overdue,
            "completion_rate": (completed / total * 100) if total > 0 else 0
        }
    
    def search_tasks(self, query: str, limit: int = 50) -> List[Task]:
        query_lower = query.lower()
        matching_tasks = []
        
        for task in self.tasks.values():
            if (query_lower in task.title.lower() or 
                query_lower in task.description.lower() or
                any(query_lower in tag.lower() for tag in task.tags)):
                matching_tasks.append(task)
                if len(matching_tasks) >= limit:
                    break
        
        return matching_tasks
    
    def get_tasks_by_status(self, status_value: str) -> List[Task]:
        try:
            status = TaskStatus(status_value)
            return [t for t in self.tasks.values() if t.status == status]
        except ValueError:
            return []

# Глобальный экземпляр базы данных
task_db = TaskDatabase()
