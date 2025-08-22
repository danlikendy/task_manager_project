from enum import Enum
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator


class TaskStatus(str, Enum):
    CREATED = "создано"
    IN_PROGRESS = "в работе"
    COMPLETED = "завершено"
    OVERDUE = "просрочено"


class TaskPriority(int, Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4
    CRITICAL = 5


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Название задачи")
    description: Optional[str] = Field(None, max_length=1000, description="Описание задачи")
    status: TaskStatus = Field(default=TaskStatus.CREATED, description="Статус задачи")
    tags: List[str] = Field(default=[], max_length=10, description="Теги задачи")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Приоритет задачи")
    due_date: Optional[date] = Field(None, description="Срок выполнения задачи")
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        for tag in v:
            if len(tag) > 50:
                raise ValueError('Тег не может быть длиннее 50 символов')
            if not tag.strip():
                raise ValueError('Тег не может быть пустым')
        return [tag.strip() for tag in v if tag.strip()]
    
    @field_validator('due_date')
    @classmethod
    def validate_due_date(cls, v):
        if v and v < date.today():
            raise ValueError('Срок выполнения не может быть в прошлом')
        return v


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[TaskStatus] = None
    tags: Optional[List[str]] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[date] = None


class Task(TaskBase):
    id: UUID = Field(default_factory=uuid4, description="Уникальный идентификатор задачи")
    created_at: datetime = Field(default_factory=datetime.now, description="Время создания задачи")
    updated_at: Optional[datetime] = Field(None, description="Время последнего обновления")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Создать API для менеджера задач",
                "description": "Разработать REST API с CRUD операциями для управления задачами",
                "status": "создано",
                "tags": ["api", "backend", "python"],
                "priority": 3,
                "due_date": "2024-12-31",
                "created_at": "2024-01-01T12:00:00",
                "updated_at": "2024-01-01T14:30:00"
            }
        }
    }
