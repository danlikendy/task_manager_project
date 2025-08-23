from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, date, timedelta
from app.models import Task, TaskCreate, TaskUpdate, TaskStatus, TaskPriority
from app.cache import cache_result, invalidate_cache_pattern, get_cache

class TaskDatabase:
    def __init__(self):
        self.tasks: Dict[UUID, Task] = {}
    
    @cache_result(ttl=60, key_prefix="tasks")
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
    
    @cache_result(ttl=300, key_prefix="task")
    def get_task(self, task_id: UUID) -> Optional[Task]:
        return self.tasks.get(task_id)
    
    def create_task(self, task_create: TaskCreate) -> Task:
        task_id = uuid4()
        now = datetime.utcnow()
        
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
        
        # Инвалидация кэша
        invalidate_cache_pattern("tasks")
        invalidate_cache_pattern("task")
        invalidate_cache_pattern("stats")
        
        return task
    
    def update_task(self, task_id: UUID, task_update: TaskUpdate) -> Optional[Task]:
        if task_id not in self.tasks:
            return None
        
        task = self.tasks[task_id]
        
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
        
        task.updated_at = datetime.utcnow()
        
        # Инвалидация кэша
        invalidate_cache_pattern("tasks")
        invalidate_cache_pattern(f"task:{task_id}")
        invalidate_cache_pattern("stats")
        
        return task
    
    def delete_task(self, task_id: UUID) -> bool:
        if task_id in self.tasks:
            del self.tasks[task_id]
            
            # Инвалидация кэша
            invalidate_cache_pattern("tasks")
            invalidate_cache_pattern(f"task:{task_id}")
            invalidate_cache_pattern("stats")
            
            return True
        return False
    
    @cache_result(ttl=120, key_prefix="tasks_by_status")
    def get_tasks_by_status(self, status: str) -> List[Task]:
        return [task for task in self.tasks.values() if task.status.value == status]
    
    @cache_result(ttl=120, key_prefix="search_tasks")
    def search_tasks(self, query: str, limit: int = 50) -> List[Task]:
        query_lower = query.lower()
        results = []
        
        for task in self.tasks.values():
            if (query_lower in task.title.lower() or 
                (task.description and query_lower in task.description.lower()) or
                any(query_lower in tag.lower() for tag in (task.tags or []))):
                results.append(task)
                if len(results) >= limit:
                    break
        
        return results
    
    @cache_result(ttl=120, key_prefix="tasks_filtered")
    def get_tasks_filtered(self, status: Optional[TaskStatus], tags: Optional[List[str]], 
                          priority: Optional[int], skip: int = 0, limit: int = 100,
                          sort_by: str = "created_at", order: str = "desc") -> List[Task]:
        filtered_tasks = []
        
        for task in self.tasks.values():
            if status and task.status != status:
                continue
            if tags and not any(tag in (task.tags or []) for tag in tags):
                continue
            if priority and task.priority.value != priority:
                continue
            filtered_tasks.append(task)
        
        if sort_by == "title":
            filtered_tasks.sort(key=lambda x: x.title, reverse=(order == "desc"))
        elif sort_by == "status":
            filtered_tasks.sort(key=lambda x: x.status.value, reverse=(order == "desc"))
        elif sort_by == "priority":
            filtered_tasks.sort(key=lambda x: x.priority.value, reverse=(order == "desc"))
        elif sort_by == "due_date":
            filtered_tasks.sort(key=lambda x: x.due_date or date.max, reverse=(order == "desc"))
        else:
            filtered_tasks.sort(key=lambda x: x.created_at or datetime.min, reverse=(order == "desc"))
        
        return filtered_tasks[skip:skip + limit]
    
    @cache_result(ttl=300, key_prefix="tasks_stats")
    def get_tasks_stats(self) -> Dict[str, Any]:
        total_tasks = len(self.tasks)
        if total_tasks == 0:
            return {
                "total_tasks": 0,
                "status_distribution": {},
                "priority_distribution": {},
                "popular_tags": [],
                "completion_rate": 0.0
            }
        
        status_distribution = {}
        priority_distribution = {}
        tag_counts = {}
        completed_count = 0
        
        for task in self.tasks.values():
            status_distribution[task.status.value] = status_distribution.get(task.status.value, 0) + 1
            priority_distribution[task.priority.value] = priority_distribution.get(task.priority.value, 0) + 1
            
            if task.status == TaskStatus.COMPLETED:
                completed_count += 1
            
            if task.tags:
                for tag in task.tags:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        popular_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        popular_tags = [tag for tag, count in popular_tags]
        
        return {
            "total_tasks": total_tasks,
            "status_distribution": status_distribution,
            "priority_distribution": priority_distribution,
            "popular_tags": popular_tags,
            "completion_rate": (completed_count / total_tasks) * 100
        }
    
    def bulk_update_status(self, task_ids: List[UUID], status: TaskStatus) -> int:
        updated_count = 0
        for task_id in task_ids:
            if task_id in self.tasks:
                self.tasks[task_id].status = status
                self.tasks[task_id].updated_at = datetime.utcnow()
                updated_count += 1
        
        if updated_count > 0:
            invalidate_cache_pattern("tasks")
            invalidate_cache_pattern("stats")
        
        return updated_count
    
    def bulk_delete_tasks(self, task_ids: List[UUID]) -> int:
        deleted_count = 0
        for task_id in task_ids:
            if task_id in self.tasks:
                del self.tasks[task_id]
                deleted_count += 1
        
        if deleted_count > 0:
            invalidate_cache_pattern("tasks")
            invalidate_cache_pattern("stats")
        
        return deleted_count
    
    @cache_result(ttl=180, key_prefix="tasks_by_date")
    def get_tasks_by_date_range(self, start_date: datetime, end_date: datetime, 
                               skip: int = 0, limit: int = 100) -> List[Task]:
        tasks = []
        for task in self.tasks.values():
            if task.created_at and start_date <= task.created_at <= end_date:
                tasks.append(task)
                if len(tasks) >= limit:
                    break
        
        return tasks[skip:skip + limit]
    
    @cache_result(ttl=300, key_prefix="overdue_tasks")
    def get_overdue_tasks(self) -> List[Task]:
        today = date.today()
        overdue_tasks = []
        
        for task in self.tasks.values():
            if (task.due_date and task.due_date < today and 
                task.status != TaskStatus.COMPLETED):
                overdue_tasks.append(task)
        
        return overdue_tasks
    
    @cache_result(ttl=300, key_prefix="due_soon_tasks")
    def get_tasks_due_soon(self, days: int = 7) -> List[Task]:
        today = date.today()
        end_date = today + timedelta(days=days)
        due_soon_tasks = []
        
        for task in self.tasks.values():
            if (task.due_date and today <= task.due_date <= end_date and 
                task.status != TaskStatus.COMPLETED):
                due_soon_tasks.append(task)
        
        return due_soon_tasks
    
    def update_overdue_status(self) -> int:
        today = date.today()
        updated_count = 0
        
        for task in self.tasks.values():
            if (task.due_date and task.due_date < today and 
                task.status != TaskStatus.COMPLETED):
                task.status = TaskStatus.OVERDUE
                task.updated_at = datetime.utcnow()
                updated_count += 1
        
        if updated_count > 0:
            invalidate_cache_pattern("overdue_tasks")
            invalidate_cache_pattern("stats")
        
        return updated_count

# Глобальный экземпляр базы данных
task_db = TaskDatabase()
