from typing import List, Optional
from uuid import UUID
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

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
    status: Optional[TaskStatus] = Query(None, description="Фильтр по статусу"),
    tags: Optional[List[str]] = Query(None, description="Фильтр по тегам"),
    priority: Optional[int] = Query(None, ge=1, le=5, description="Фильтр по приоритету"),
    sort_by: str = Query("created_at", description="Поле для сортировки (title, status, priority, created_at)"),
    order: str = Query("desc", description="Порядок сортировки (asc, desc)")
):
    if status or tags or priority:
        return task_db.get_tasks_filtered(status, tags, priority, skip, limit, sort_by, order)
    return task_db.get_tasks(skip=skip, limit=limit, sort_by=sort_by, order=order)


@app.get("/tasks/search/", response_model=List[Task], tags=["Tasks"])
async def search_tasks(
    query: str = Query(..., description="Поисковый запрос"),
    limit: int = Query(50, ge=1, le=100, description="Максимальное количество результатов")
):
    return task_db.search_tasks(query, limit)


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


@app.get("/tasks/stats/", tags=["Tasks"])
async def get_tasks_stats():
    return task_db.get_tasks_stats()


@app.post("/tasks/bulk/status", tags=["Tasks"])
async def bulk_update_status(
    task_ids: List[UUID],
    status: TaskStatus
):
    updated_count = task_db.bulk_update_status(task_ids, status)
    return {
        "message": f"Обновлено {updated_count} задач",
        "updated_count": updated_count,
        "total_requested": len(task_ids)
    }


@app.delete("/tasks/bulk/", tags=["Tasks"])
async def bulk_delete_tasks(task_ids: List[UUID]):
    deleted_count = task_db.bulk_delete_tasks(task_ids)
    return {
        "message": f"Удалено {deleted_count} задач",
        "deleted_count": deleted_count,
        "total_requested": len(task_ids)
    }


@app.get("/tasks/export/csv", tags=["Tasks"])
async def export_tasks_csv():
    tasks = task_db.get_tasks(limit=1000)
    
    if not tasks:
        return PlainTextResponse("Нет задач для экспорта")
    
    csv_content = "ID,Название,Описание,Статус,Приоритет,Теги,Создано,Обновлено\n"
    
    for task in tasks:
        tags_str = ";".join(task.tags) if task.tags else ""
        created_at = task.created_at.strftime("%Y-%m-%d %H:%M:%S") if task.created_at else ""
        updated_at = task.updated_at.strftime("%Y-%m-%d %H:%M:%S") if task.updated_at else ""
        
        csv_content += f'"{task.id}","{task.title}","{task.description or ""}","{task.status.value}","{task.priority.value}","{tags_str}","{created_at}","{updated_at}"\n'
    
    return PlainTextResponse(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tasks.csv"}
    )


@app.get("/tasks/by-date", response_model=List[Task], tags=["Tasks"])
async def get_tasks_by_date_range(
    start_date: str = Query(..., description="Начальная дата (YYYY-MM-DD)"),
    end_date: str = Query(..., description="Конечная дата (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    try:
        from datetime import datetime
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        return task_db.get_tasks_by_date_range(start, end, skip, limit)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте YYYY-MM-DD")


@app.get("/health", tags=["Health"])
async def health_check():
    """Проверка состояния API"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
