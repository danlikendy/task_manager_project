from typing import List, Optional
from uuid import UUID
from fastapi import FastAPI, HTTPException, Query, Path, Depends, Request, Body
from typing import Dict
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.security import OAuth2PasswordRequestForm

from app.models import Task, TaskCreate, TaskUpdate, TaskStatus
from app.database import task_db
from app.auth import authenticate_user, create_access_token, get_current_active_user, fake_users_db, ACCESS_TOKEN_EXPIRE_MINUTES
from app.logger import setup_logger, log_error, log_security_event
from app.middleware import LoggingMiddleware, SecurityMiddleware, PerformanceMiddleware
from app.cache import get_cache_stats, clear_cache, cleanup_expired_cache
from app.ai_assistant import ai_assistant
from datetime import timedelta, date, datetime

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


@app.post("/ai/create-task", response_model=Task, tags=["AI Assistant"])
async def ai_create_task(
    text: str,
    current_user = Depends(get_current_active_user)
):
    """Создание задачи с помощью AI на основе текста"""
    try:
        # Анализируем текст и создаем задачу
        task_data = ai_assistant.analyze_text_and_create_task(text)
        
        # Сохраняем задачу
        task = task_db.create_task(task_data)
        
        logger.info(f"AI создал задачу для пользователя {current_user.username}: {task.title}")
        return task
        
    except Exception as e:
        log_error(logger, e, f"AI task creation for user {current_user.username}")
        raise HTTPException(status_code=500, detail="Error creating task with AI")


@app.post("/ai/generate-subtasks", tags=["AI Assistant"])
async def ai_generate_subtasks(
    task_text: str,
    current_user = Depends(get_current_active_user)
):
    """Генерация подзадач с помощью AI"""
    try:
        subtasks = ai_assistant.generate_subtasks(task_text)
        
        logger.info(f"AI сгенерировал {len(subtasks)} подзадач для пользователя {current_user.username}")
        return {
            "subtasks": subtasks,
            "count": len(subtasks),
            "original_task": task_text
        }
        
    except Exception as e:
        log_error(logger, e, f"AI subtask generation for user {current_user.username}")
        raise HTTPException(status_code=500, detail="Error generating subtasks with AI")


@app.get("/ai/insights", tags=["AI Assistant"])
async def ai_get_insights(current_user = Depends(get_current_active_user)):
    """Получение AI инсайтов о продуктивности"""
    try:
        # Получаем статистику пользователя
        stats = task_db.get_tasks_stats()
        
        # Генерируем инсайты
        insights = ai_assistant.get_productivity_insights(stats)
        
        logger.info(f"AI предоставил инсайты для пользователя {current_user.username}")
        return {
            "insights": insights,
            "stats": stats,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        log_error(logger, e, f"AI insights for user {current_user.username}")
        raise HTTPException(status_code=500, detail="Error getting AI insights")


@app.get("/ai/daily-plan", tags=["AI Assistant"])
async def ai_get_daily_plan(current_user = Depends(get_current_active_user)):
    """Получение AI плана на день"""
    try:
        # Получаем активные задачи пользователя
        tasks = task_db.get_tasks(limit=50)
        
        # Конвертируем в словари для AI
        tasks_data = []
        for task in tasks:
            if task.status not in [TaskStatus.COMPLETED]:
                tasks_data.append({
                    "title": task.title,
                    "priority": task.priority.value,
                    "status": task.status.value,
                    "due_date": task.due_date.isoformat() if task.due_date else None
                })
        
        # Генерируем план
        daily_plan = ai_assistant.generate_daily_plan(tasks_data)
        
        # Получаем рекомендации по оптимизации
        suggestions = ai_assistant.suggest_priority_optimization(tasks_data)
        
        logger.info(f"AI создал план дня для пользователя {current_user.username}")
        return {
            "daily_plan": daily_plan,
            "suggestions": suggestions,
            "total_tasks": len(tasks_data),
            "date": date.today().isoformat()
        }
        
    except Exception as e:
        log_error(logger, e, f"AI daily plan for user {current_user.username}")
        raise HTTPException(status_code=500, detail="Error creating daily plan with AI")


@app.post("/ai/smart-reminder", tags=["AI Assistant"])
async def ai_generate_smart_reminder(
    task_id: UUID,
    current_user = Depends(get_current_active_user)
):
    """Генерация умного напоминания для задачи"""
    try:
        # Получаем задачу
        task = task_db.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Задача не найдена")
        
        # Подготавливаем данные для AI
        task_data = {
            "title": task.title,
            "priority": task.priority.value,
            "status": task.status.value,
            "due_date": task.due_date.isoformat() if task.due_date else None
        }
        
        # Генерируем умное напоминание
        reminder_text = ai_assistant.get_smart_reminder_text(task_data)
        
        logger.info(f"AI создал напоминание для задачи {task_id} пользователя {current_user.username}")
        return {
            "reminder_text": reminder_text,
            "task_title": task.title,
            "priority": task.priority.value,
            "created_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        log_error(logger, e, f"AI reminder generation for user {current_user.username}")
        raise HTTPException(status_code=500, detail="Error generating smart reminder")


@app.get("/ai/status", tags=["AI Assistant"])
async def ai_get_status():
    """Статус AI-ассистента"""
    return {
        "status": "active",
        "version": "1.0.0",
        "features": [
            "smart_task_creation",
            "subtask_generation",
            "productivity_insights",
            "daily_planning",
            "smart_reminders",
            "priority_optimization"
        ],
        "supported_languages": ["русский", "english"],
        "last_updated": datetime.utcnow().isoformat()
    }


# Gamification Endpoints
@app.get("/gamification/profile", tags=["Gamification"])
async def get_gamification_profile(current_user: User = Depends(get_current_active_user)):
    """Получение профиля геймификации пользователя"""
    profile = gamification_service.get_user_profile(current_user.username)
    return {
        "user_id": current_user.username,
        "level": profile["level"],
        "xp": profile["xp"],
        "coins": profile["coins"],
        "achievements_count": len(profile["achievements"]),
        "challenges_completed": len(profile["challenges_completed"]),
        "rewards_purchased": len(profile["rewards_purchased"]),
        "daily_streak": profile["daily_streak"],
        "last_activity": profile["last_activity"].isoformat(),
        "stats": profile["stats"]
    }

@app.get("/gamification/achievements", tags=["Gamification"])
async def get_achievements(current_user: User = Depends(get_current_active_user)):
    """Получение всех достижений пользователя"""
    profile = gamification_service.get_user_profile(current_user.username)
    user_achievements = []
    
    for achievement in gamification_service.achievements:
        is_unlocked = achievement.id in profile["achievements"]
        user_achievements.append({
            "id": achievement.id,
            "name": achievement.name,
            "description": achievement.description,
            "type": achievement.achievement_type.value,
            "rarity": achievement.rarity,
            "xp_reward": achievement.xp_reward,
            "coin_reward": achievement.coin_reward,
            "unlocked": is_unlocked,
            "unlocked_at": achievement.unlocked_at.isoformat() if is_unlocked and achievement.unlocked_at else None,
            "progress": profile["stats"].get(achievement.requirements.get("type", ""), 0),
            "max_progress": achievement.max_progress
        })
    
    return {"achievements": user_achievements}

@app.get("/gamification/challenges", tags=["Gamification"])
async def get_challenges(current_user: User = Depends(get_current_active_user)):
    """Получение доступных вызовов"""
    available_challenges = gamification_service.get_available_challenges(current_user.username)
    challenges_data = []
    
    for challenge in available_challenges:
        challenges_data.append({
            "id": challenge.id,
            "name": challenge.name,
            "description": challenge.description,
            "type": challenge.challenge_type.value,
            "requirements": challenge.requirements,
            "rewards": challenge.rewards,
            "start_date": challenge.start_date.isoformat(),
            "end_date": challenge.end_date.isoformat(),
            "progress": challenge.progress,
            "max_progress": challenge.max_progress
        })
    
    return {"challenges": challenges_data}

@app.get("/gamification/rewards", tags=["Gamification"])
async def get_rewards(current_user: User = Depends(get_current_active_user)):
    """Получение доступных наград"""
    profile = gamification_service.get_user_profile(current_user.username)
    rewards_data = []
    
    for reward in gamification_service.rewards:
        is_purchased = reward.id in profile["rewards_purchased"]
        rewards_data.append({
            "id": reward.id,
            "name": reward.name,
            "description": reward.description,
            "type": reward.reward_type.value,
            "cost": reward.cost,
            "effects": reward.effects,
            "rarity": reward.rarity,
            "purchased": is_purchased
        })
    
    return {"rewards": rewards_data}

@app.post("/gamification/purchase-reward/{reward_id}", tags=["Gamification"])
async def purchase_reward(reward_id: str, current_user: User = Depends(get_current_active_user)):
    """Покупка награды"""
    result = gamification_service.purchase_reward(current_user.username, reward_id)
    return result

@app.get("/gamification/leaderboard", tags=["Gamification"])
async def get_leaderboard(limit: int = Query(10, ge=1, le=50)):
    """Получение таблицы лидеров"""
    leaderboard = gamification_service.get_leaderboard(limit)
    return {"leaderboard": leaderboard}

@app.post("/gamification/complete-challenge/{challenge_id}", tags=["Gamification"])
async def complete_challenge(challenge_id: str, current_user: User = Depends(get_current_active_user)):
    """Завершение вызова"""
    profile = gamification_service.get_user_profile(current_user.username)
    
    # Find challenge
    challenge = next((c for c in gamification_service.challenges if c.id == challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # Check if already completed
    if challenge_id in profile["challenges_completed"]:
        raise HTTPException(status_code=400, detail="Challenge already completed")
    
    # Mark as completed
    profile["challenges_completed"].append(challenge_id)
    
    # Add rewards
    xp_gained = challenge.rewards.get("xp", 0)
    coins_gained = challenge.rewards.get("coins", 0)
    
    level_up_info = gamification_service.add_xp(current_user.username, xp_gained)
    profile["coins"] += coins_gained
    
    return {
        "success": True,
        "challenge_name": challenge.name,
        "xp_gained": xp_gained,
        "coins_gained": coins_gained,
        "level_up_info": level_up_info
    }

@app.post("/gamification/trigger-event", tags=["Gamification"])
async def trigger_gamification_event(
    event_type: str = Body(..., description="Тип события"),
    event_data: Dict = Body(..., description="Данные события"),
    current_user: User = Depends(get_current_active_user)
):
    """Триггер события геймификации"""
    try:
        # Проверяем достижения
        unlocked_achievements = gamification_service.check_achievements(
            current_user.username, 
            event_type, 
            event_data.get("value", 1)
        )
        
        # Добавляем XP за событие
        xp_gained = event_data.get("xp", 0)
        level_up_info = None
        if xp_gained > 0:
            level_up_info = gamification_service.add_xp(current_user.username, xp_gained)
        
        return {
            "event_processed": True,
            "unlocked_achievements": unlocked_achievements,
            "xp_gained": xp_gained,
            "level_up_info": level_up_info
        }
        
    except Exception as e:
        log_error(logger, e, f"Gamification event for user {current_user.username}")
        raise HTTPException(status_code=500, detail="Error processing gamification event")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
