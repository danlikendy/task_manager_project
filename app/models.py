from enum import Enum
from typing import Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    """Enum для статусов задач"""
    CREATED = "создано"
    IN_PROGRESS = "в работе"
    COMPLETED = "завершено"


class TaskBase(BaseModel):
    """Базовая модель задачи"""
    title: str = Field(..., min_length=1, max_length=200, description="Название задачи")
    description: Optional[str] = Field(None, max_length=1000, description="Описание задачи")
    status: TaskStatus = Field(default=TaskStatus.CREATED, description="Статус задачи")


class TaskCreate(TaskBase):
    """Модель для создания задачи"""
    pass


class TaskUpdate(BaseModel):
    """Модель для обновления задачи"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[TaskStatus] = None


class Task(TaskBase):
    """Полная модель задачи"""
    id: UUID = Field(default_factory=uuid4, description="Уникальный идентификатор задачи")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Создать API для менеджера задач",
                "description": "Разработать REST API с CRUD операциями для управления задачами",
                "status": "создано"
            }
        }
    }
