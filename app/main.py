from typing import List, Optional
from uuid import UUID
from fastapi import FastAPI, HTTPException, Query, Path, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.security import OAuth2PasswordRequestForm

from app.models import Task, TaskCreate, TaskUpdate, TaskStatus
from app.database import task_db
from app.auth import authenticate_user, create_access_token, get_current_active_user, fake_users_db, ACCESS_TOKEN_EXPIRE_MINUTES
from app.logger import setup_logger, log_error, log_security_event
from app.middleware import LoggingMiddleware, SecurityMiddleware, PerformanceMiddleware
from app.cache import get_cache_stats, clear_cache, cleanup_expired_cache
from datetime import timedelta

logger = setup_logger()

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

# Добавление middleware для логирования и безопасности
app.add_middleware(LoggingMiddleware, logger=logger)
app.add_middleware(SecurityMiddleware, logger=logger)
app.add_middleware(PerformanceMiddleware, logger=logger)


@app.get("/", tags=["Root"])
async def root():
    """Корневой эндпоинт"""
    return {
        "message": "Task Manager API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.post("/tasks/", response_model=Task, status_code=201, tags=["Tasks"])
async def create_task(task: TaskCreate, current_user = Depends(get_current_active_user), request: Request = None):
    """
    Создание новой задачи
    
    - **title**: Название задачи (обязательно)
    - **description**: Описание задачи (опционально)
    - **status**: Статус задачи (по умолчанию: создано)
    """
    try:
        result = task_db.create_task(task)
        logger.info(f"Task created by user {current_user.username}: {task.title}")
        return result
    except Exception as e:
        log_error(logger, e, f"Creating task: {task.title}")
        raise


@app.get("/tasks/", response_model=List[Task], tags=["Tasks"])
async def get_tasks(
    skip: int = Query(0, ge=0, description="Количество задач для пропуска"),
    limit: int = Query(100, ge=1, le=1000, description="Максимальное количество задач"),
    status: Optional[TaskStatus] = Query(None, description="Фильтр по статусу"),
    tags: Optional[List[str]] = Query(None, description="Фильтр по тегам"),
    priority: Optional[int] = Query(None, ge=1, le=5, description="Фильтр по приоритету"),
    sort_by: str = Query("created_at", description="Поле для сортировки (title, status, priority, created_at)"),
    order: str = Query("desc", description="Порядок сортировки (asc, desc)"),
    current_user = Depends(get_current_active_user)
):
    try:
        if status or tags or priority:
            result = task_db.get_tasks_filtered(status, tags, priority, skip, limit, sort_by, order)
        else:
            result = task_db.get_tasks(skip=skip, limit=limit, sort_by=sort_by, order=order)
        
        logger.info(f"Tasks retrieved by user {current_user.username}: {len(result)} tasks")
        return result
    except Exception as e:
        log_error(logger, e, f"Retrieving tasks for user {current_user.username}")
        raise


@app.get("/tasks/search/", response_model=List[Task], tags=["Tasks"])
async def search_tasks(
    query: str = Query(..., description="Поисковый запрос"),
    limit: int = Query(50, ge=1, le=100, description="Максимальное количество результатов"),
    current_user = Depends(get_current_active_user)
):
    return task_db.search_tasks(query, limit)


@app.get("/tasks/{task_id}", response_model=Task, tags=["Tasks"])
async def get_task(task_id: UUID, current_user = Depends(get_current_active_user)):
    """
    Получение задачи по ID
    
    - **task_id**: Уникальный идентификатор задачи
    """
    task = task_db.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return task


@app.put("/tasks/{task_id}", response_model=Task, tags=["Tasks"])
async def update_task(task_id: UUID, task_update: TaskUpdate, current_user = Depends(get_current_active_user)):
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
async def delete_task(task_id: UUID, current_user = Depends(get_current_active_user)):
    """
    Удаление задачи
    
    - **task_id**: Уникальный идентификатор задачи
    """
    if not task_db.delete_task(task_id):
        raise HTTPException(status_code=404, detail="Задача не найдена")


@app.get("/tasks/status/{status}", response_model=List[Task], tags=["Tasks"])
async def get_tasks_by_status(status: TaskStatus, current_user = Depends(get_current_active_user)):
    """
    Получение задач по статусу
    
    - **status**: Статус для фильтрации
    """
    return task_db.get_tasks_by_status(status.value)


@app.get("/tasks/stats/", tags=["Tasks"])
async def get_tasks_stats(current_user = Depends(get_current_active_user)):
    return task_db.get_tasks_stats()


@app.post("/tasks/bulk/status", tags=["Tasks"])
async def bulk_update_status(
    task_ids: List[UUID],
    status: TaskStatus,
    current_user = Depends(get_current_active_user)
):
    updated_count = task_db.bulk_update_status(task_ids, status)
    return {
        "message": f"Обновлено {updated_count} задач",
        "updated_count": updated_count,
        "total_requested": len(task_ids)
    }


@app.delete("/tasks/bulk/", tags=["Tasks"])
async def bulk_delete_tasks(task_ids: List[UUID], current_user = Depends(get_current_active_user)):
    deleted_count = task_db.bulk_delete_tasks(task_ids)
    return {
        "message": f"Удалено {deleted_count} задач",
        "deleted_count": deleted_count,
        "total_requested": len(task_ids)
    }


@app.get("/tasks/export/csv", tags=["Tasks"])
async def export_tasks_csv(current_user = Depends(get_current_active_user)):
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
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user)
):
    try:
        from datetime import datetime
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        return task_db.get_tasks_by_date_range(start, end, skip, limit)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте YYYY-MM-DD")


@app.get("/tasks/overdue", response_model=List[Task], tags=["Tasks"])
async def get_overdue_tasks(current_user = Depends(get_current_active_user)):
    """Получение просроченных задач"""
    return task_db.get_overdue_tasks()


@app.get("/tasks/due-soon", response_model=List[Task], tags=["Tasks"])
async def get_tasks_due_soon(
    days: int = Query(7, ge=1, le=30, description="Количество дней для проверки"),
    current_user = Depends(get_current_active_user)
):
    """Получение задач с приближающимся сроком"""
    return task_db.get_tasks_due_soon(days)


@app.post("/tasks/update-overdue", tags=["Tasks"])
async def update_overdue_status(current_user = Depends(get_current_active_user)):
    """Обновление статуса просроченных задач"""
    updated_count = task_db.update_overdue_status()
    return {
        "message": f"Обновлено {updated_count} просроченных задач",
        "updated_count": updated_count
    }


@app.get("/tasks/priority/{priority}", response_model=List[Task], tags=["Tasks"])
async def get_tasks_by_priority(
    priority: int = Path(..., ge=1, le=5, description="Приоритет задачи"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user)
):
    """Получение задач по приоритету"""
    return task_db.get_tasks_filtered(None, None, priority, skip, limit)


@app.get("/tasks/priority-range", response_model=List[Task], tags=["Tasks"])
async def get_tasks_by_priority_range(
    min_priority: int = Query(..., ge=1, le=5, description="Минимальный приоритет"),
    max_priority: int = Query(..., ge=1, le=5, description="Максимальный приоритет"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user)
):
    """Получение задач по диапазону приоритетов"""
    if min_priority > max_priority:
        raise HTTPException(status_code=400, detail="Минимальный приоритет не может быть больше максимального")
    
    tasks = []
    for task in task_db.get_tasks(limit=1000):
        if min_priority <= task.priority.value <= max_priority:
            tasks.append(task)
            if len(tasks) >= limit:
                break
    
    return tasks[skip:skip + limit]


@app.get("/tasks/tags/{tags}", response_model=List[Task], tags=["Tasks"])
async def get_tasks_by_tags(
    tags: str = Path(..., description="Теги для фильтрации (разделенные запятой)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user)
):
    """Получение задач по тегам"""
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    return task_db.get_tasks_filtered(None, tag_list, None, skip, limit)


@app.get("/tasks/created-between", response_model=List[Task], tags=["Tasks"])
async def get_tasks_created_between(
    start_date: str = Query(..., description="Начальная дата (YYYY-MM-DD)"),
    end_date: str = Query(..., description="Конечная дата (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user)
):
    """Получение задач по диапазону дат создания"""
    try:
        from datetime import datetime
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        return task_db.get_tasks_by_date_range(start, end, skip, limit)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте YYYY-MM-DD")


@app.get("/tasks/due-between", response_model=List[Task], tags=["Tasks"])
async def get_tasks_due_between(
    start_date: str = Query(..., description="Начальная дата (YYYY-MM-DD)"),
    end_date: str = Query(..., description="Конечная дата (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user)
):
    """Получение задач по диапазону дат выполнения"""
    try:
        from datetime import datetime, date
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
        
        if start > end:
            raise HTTPException(status_code=400, detail="Начальная дата не может быть позже конечной")
        
        tasks = []
        for task in task_db.get_tasks(limit=1000):
            if task.due_date and start <= task.due_date <= end:
                tasks.append(task)
                if len(tasks) >= limit:
                    break
        
        return tasks[skip:skip + limit]
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте YYYY-MM-DD")


@app.get("/tasks/status-priority", response_model=List[Task], tags=["Tasks"])
async def get_tasks_by_status_and_priority(
    status: TaskStatus = Query(..., description="Статус задачи"),
    priority: int = Query(..., ge=1, le=5, description="Приоритет задачи"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user)
):
    """Получение задач по статусу и приоритету"""
    return task_db.get_tasks_filtered(status, None, priority, skip, limit)


@app.get("/tasks/status-tags", response_model=List[Task], tags=["Tasks"])
async def get_tasks_by_status_and_tags(
    status: TaskStatus = Query(..., description="Статус задачи"),
    tags: str = Query(..., description="Теги для фильтрации (разделенные запятой)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user)
):
    """Получение задач по статусу и тегам"""
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    return task_db.get_tasks_filtered(status, tag_list, None, skip, limit)


@app.get("/tasks/priority-tags", response_model=List[Task], tags=["Tasks"])
async def get_tasks_by_priority_and_tags(
    priority: int = Query(..., ge=1, le=5, description="Приоритет задачи"),
    tags: str = Query(..., description="Теги для фильтрации (разделенные запятой)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user)
):
    """Получение задач по приоритету и тегам"""
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    return task_db.get_tasks_filtered(None, tag_list, priority, skip, limit)


@app.get("/tasks/status-priority-tags", response_model=List[Task], tags=["Tasks"])
async def get_tasks_by_status_priority_and_tags(
    status: TaskStatus = Query(..., description="Статус задачи"),
    priority: int = Query(..., ge=1, le=5, description="Приоритет задачи"),
    tags: str = Query(..., description="Теги для фильтрации (разделенные запятой)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user)
):
    """Получение задач по статусу, приоритету и тегам"""
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    return task_db.get_tasks_filtered(status, tag_list, priority, skip, limit)


@app.post("/token", tags=["Authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), request: Request = None):
    """Получение токена доступа"""
    try:
        user = authenticate_user(fake_users_db, form_data.username, form_data.password)
        if not user:
            client_ip = request.client.host if request.client else "unknown"
            log_security_event(logger, "failed_login", form_data.username, f"IP: {client_ip}")
            raise HTTPException(
                status_code=400,
                detail="Incorrect username or password"
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        client_ip = request.client.host if request.client else "unknown"
        logger.info(f"User {user.username} logged in successfully from IP: {client_ip}")
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        if not isinstance(e, HTTPException):
            log_error(logger, e, f"Login attempt for user {form_data.username}")
        raise


@app.get("/users/me", tags=["Authentication"])
async def read_users_me(current_user = Depends(get_current_active_user)):
    """Получение информации о текущем пользователе"""
    return current_user


@app.get("/health", tags=["Health"])
async def health_check():
    """Проверка состояния API"""
    return {"status": "healthy"}


@app.get("/metrics", tags=["Monitoring"])
async def get_metrics():
    """Получение метрик для мониторинга"""
    try:
        from datetime import datetime, timedelta
        
        total_tasks = len(task_db.tasks)
        completed_tasks = len([t for t in task_db.tasks.values() if t.status.value == "завершено"])
        overdue_tasks = len([t for t in task_db.tasks.values() if t.status.value == "просрочено"])
        
        now = datetime.utcnow()
        today_tasks = len([t for t in task_db.tasks.values() 
                          if t.created_at and t.created_at.date() == now.date()])
        
        week_ago = now - timedelta(days=7)
        week_tasks = len([t for t in task_db.tasks.values() 
                         if t.created_at and t.created_at >= week_ago])
        
        metrics = {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "overdue_tasks": overdue_tasks,
            "today_tasks": today_tasks,
            "week_tasks": week_tasks,
            "completion_rate": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            "overdue_rate": (overdue_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            "timestamp": now.isoformat()
        }
        
        logger.info(f"Metrics requested: {metrics}")
        return metrics
        
    except Exception as e:
        log_error(logger, e, "Getting metrics")
        raise HTTPException(status_code=500, detail="Error getting metrics")


@app.get("/health/detailed", tags=["Health"])
async def detailed_health_check():
    """Детальная проверка состояния API"""
    try:
        from datetime import datetime
        
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
            "total_tasks": len(task_db.tasks),
            "memory_usage": "normal",
            "uptime": "running"
        }
        
        logger.info("Detailed health check performed")
        return health_status
        
    except Exception as e:
        log_error(logger, e, "Detailed health check")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@app.get("/cache/stats", tags=["Cache"])
async def get_cache_statistics(current_user = Depends(get_current_active_user)):
    """Получение статистики кэша"""
    try:
        stats = get_cache_stats()
        logger.info(f"Cache stats requested by user {current_user.username}")
        return stats
    except Exception as e:
        log_error(logger, e, "Getting cache stats")
        raise HTTPException(status_code=500, detail="Error getting cache stats")


@app.delete("/cache/clear", tags=["Cache"])
async def clear_all_cache(current_user = Depends(get_current_active_user)):
    """Очистка всего кэша"""
    try:
        clear_cache()
        logger.info(f"Cache cleared by user {current_user.username}")
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        log_error(logger, e, "Clearing cache")
        raise HTTPException(status_code=500, detail="Error clearing cache")


@app.post("/cache/cleanup", tags=["Cache"])
async def cleanup_cache(current_user = Depends(get_current_active_user)):
    """Очистка истекших записей кэша"""
    try:
        cleaned_count = cleanup_expired_cache()
        logger.info(f"Cache cleanup performed by user {current_user.username}: {cleaned_count} entries removed")
        return {
            "message": f"Cache cleanup completed",
            "cleaned_entries": cleaned_count
        }
    except Exception as e:
        log_error(logger, e, "Cache cleanup")
        raise HTTPException(status_code=500, detail="Error cleaning up cache")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
