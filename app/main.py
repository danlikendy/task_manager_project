from typing import List, Optional
from uuid import UUID
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.models import Task, TaskCreate, TaskUpdate, TaskStatus
from app.database import task_db

# Создание FastAPI приложения
app = FastAPI(
    title="Task Manager API",
    description="API для управления задачами с CRUD операциями",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    """Корневой эндпоинт"""
    return {
        "message": "Task Manager API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.post("/tasks/", response_model=Task, status_code=201, tags=["Tasks"])
async def create_task(task: TaskCreate):
    """
    Создание новой задачи
    
    - **title**: Название задачи (обязательно)
    - **description**: Описание задачи (опционально)
    - **status**: Статус задачи (по умолчанию: создано)
    """
    return task_db.create_task(task)


@app.get("/tasks/", response_model=List[Task], tags=["Tasks"])
async def get_tasks(
    skip: int = Query(0, ge=0, description="Количество задач для пропуска"),
    limit: int = Query(100, ge=1, le=1000, description="Максимальное количество задач"),
    status: Optional[TaskStatus] = Query(None, description="Фильтр по статусу")
):
    """
    Получение списка задач
    
    - **skip**: Количество задач для пропуска (для пагинации)
    - **limit**: Максимальное количество задач
    - **status**: Фильтр по статусу (опционально)
    """
    if status:
        return task_db.get_tasks_by_status(status.value)
    return task_db.get_tasks(skip=skip, limit=limit)


@app.get("/tasks/{task_id}", response_model=Task, tags=["Tasks"])
async def get_task(task_id: UUID):
    """
    Получение задачи по ID
    
    - **task_id**: Уникальный идентификатор задачи
    """
    task = task_db.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return task


@app.put("/tasks/{task_id}", response_model=Task, tags=["Tasks"])
async def update_task(task_id: UUID, task_update: TaskUpdate):
    """
    Обновление задачи
    
    - **task_id**: Уникальный идентификатор задачи
    - **task_update**: Данные для обновления
    """
    task = task_db.update_task(task_id, task_update)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return task


@app.delete("/tasks/{task_id}", status_code=204, tags=["Tasks"])
async def delete_task(task_id: UUID):
    """
    Удаление задачи
    
    - **task_id**: Уникальный идентификатор задачи
    """
    if not task_db.delete_task(task_id):
        raise HTTPException(status_code=404, detail="Задача не найдена")


@app.get("/tasks/status/{status}", response_model=List[Task], tags=["Tasks"])
async def get_tasks_by_status(status: TaskStatus):
    """
    Получение задач по статусу
    
    - **status**: Статус для фильтрации
    """
    return task_db.get_tasks_by_status(status.value)


@app.get("/health", tags=["Health"])
async def health_check():
    """Проверка состояния API"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
