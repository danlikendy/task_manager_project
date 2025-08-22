from enum import Enum
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class TaskStatus(str, Enum):
    """Enum для статусов задач"""
    CREATED = "создано"
    IN_PROGRESS = "в работе"
    COMPLETED = "завершено"


class TaskPriority(int, Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4
    CRITICAL = 5


class TaskBase(BaseModel):
    """Базовая модель задачи"""
    title: str = Field(..., min_length=1, max_length=200, description="Название задачи")
    description: Optional[str] = Field(None, max_length=1000, description="Описание задачи")
    status: TaskStatus = Field(default=TaskStatus.CREATED, description="Статус задачи")
    tags: List[str] = Field(default=[], max_length=10, description="Теги задачи")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Приоритет задачи")
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        for tag in v:
            if len(tag) > 50:
                raise ValueError('Тег не может быть длиннее 50 символов')
            if not tag.strip():
                raise ValueError('Тег не может быть пустым')
        return [tag.strip() for tag in v if tag.strip()]


class TaskCreate(TaskBase):
    """Модель для создания задачи"""
    pass


class TaskUpdate(BaseModel):
    """Модель для обновления задачи"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[TaskStatus] = None
    tags: Optional[List[str]] = None
    priority: Optional[TaskPriority] = None


class Task(TaskBase):
    """Полная модель задачи"""
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
                "created_at": "2024-01-01T12:00:00",
                "updated_at": "2024-01-01T14:30:00"
            }
        }
    }
