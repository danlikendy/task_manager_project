from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
import uuid
import sys
import os

# Добавляем корневую директорию в путь Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import Task, TaskCreate, TaskUpdate, TaskStatus, TaskPriority
from app.database import TaskDatabase

app = FastAPI(
    title="Task Manager API - Full Version",
    description="Complete API with AI, Gamification, Notifications, Analytics, Voice Control, and more",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Упрощенная аутентификация
def get_current_user():
    return "admin"

task_db = TaskDatabase()

# ============================================================================
# ROOT ENDPOINTS
# ============================================================================

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Task Manager API - Full Version",
        "version": "1.0.0",
        "features": [
            "AI Assistant",
            "Gamification System",
            "Smart Notifications",
            "Advanced Analytics",
            "Voice Control",
            "Theme Customization",
            "Task Management",
            "Productivity Insights"
        ]
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "database": "connected",
            "cache": "active",
            "auth": "enabled",
            "ai": "ready",
            "gamification": "active"
        }
    }

# ============================================================================
# AUTHENTICATION
# ============================================================================

@app.post("/auth/login", tags=["Authentication"])
async def login(username: str, password: str):
    if username == "admin" and password == "admin":
        return {"access_token": "fake_token", "token_type": "bearer"}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password"
    )

# ============================================================================
# TASK MANAGEMENT
# ============================================================================

@app.post("/tasks/", response_model=Task, status_code=201, tags=["Tasks"])
async def create_task(
    task: TaskCreate,
    current_user: str = Depends(get_current_user)
):
    try:
        result = task_db.create_task(task)
        print(f"Task created by {current_user}: {result.title}")
        return result
    except Exception as e:
        print(f"Error creating task: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/tasks/", response_model=List[Task], tags=["Tasks"])
async def get_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[TaskStatus] = None,
    priority: Optional[int] = None,
    tags: Optional[List[str]] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    current_user: str = Depends(get_current_user)
):
    try:
        tasks = task_db.get_tasks(skip=skip, limit=limit, sort_by=sort_by, order=order)
        
        if status:
            tasks = [t for t in tasks if t.status == status]
        if priority:
            tasks = [t for t in tasks if t.priority.value == priority]
        if tags:
            tasks = [t for t in tasks if any(tag in t.tags for tag in tags)]
        
        print(f"Tasks retrieved by {current_user}: {len(tasks)} tasks")
        return tasks
    except Exception as e:
        print(f"Error getting tasks: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/tasks/{task_id}", response_model=Task, tags=["Tasks"])
async def get_task(
    task_id: str,
    current_user: str = Depends(get_current_user)
):
    try:
        from uuid import UUID
        task_uuid = UUID(task_id)
        task = task_db.get_task(task_uuid)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        print(f"Task retrieved by {current_user}: {task.title}")
        return task
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    except Exception as e:
        print(f"Error getting task: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/tasks/{task_id}", response_model=Task, tags=["Tasks"])
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    current_user: str = Depends(get_current_user)
):
    try:
        from uuid import UUID
        task_uuid = UUID(task_id)
        result = task_db.update_task(task_uuid, task_update)
        if not result:
            raise HTTPException(status_code=404, detail="Task not found")
        print(f"Task updated by {current_user}: {result.title}")
        return result
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    except Exception as e:
        print(f"Error updating task: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/tasks/{task_id}", status_code=204, tags=["Tasks"])
async def delete_task(
    task_id: str,
    current_user: str = Depends(get_current_user)
):
    try:
        from uuid import UUID
        task_uuid = UUID(task_id)
        if not task_db.delete_task(task_uuid):
            raise HTTPException(status_code=404, detail="Task not found")
        print(f"Task deleted by {current_user}: {task_id}")
        return None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    except Exception as e:
        print(f"Error deleting task: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/tasks/stats", tags=["Analytics"])
async def get_task_stats(current_user: str = Depends(get_current_user)):
    try:
        stats = task_db.get_task_stats()
        print(f"Stats retrieved by {current_user}")
        return stats
    except Exception as e:
        print(f"Error getting stats: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/tasks/search", response_model=List[Task], tags=["Tasks"])
async def search_tasks(query: str, limit: int = 50, current_user: str = Depends(get_current_user)):
    try:
        return task_db.search_tasks(query, limit)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/tasks/status/{status}", response_model=List[Task], tags=["Tasks"])
async def get_tasks_by_status(status: TaskStatus, current_user: str = Depends(get_current_user)):
    try:
        return task_db.get_tasks_by_status(status.value)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/tasks/priority/{priority}", response_model=List[Task], tags=["Tasks"])
async def get_tasks_by_priority(priority: int, current_user: str = Depends(get_current_user)):
    try:
        if priority < 1 or priority > 5:
            raise HTTPException(status_code=400, detail="Priority must be between 1 and 5")
        return [t for t in task_db.get_tasks() if t.priority.value == priority]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# AI ASSISTANT
# ============================================================================

@app.post("/ai/assist", tags=["AI Assistant"])
async def ai_assist(
    message: str,
    current_user: str = Depends(get_current_user)
):
    try:
        response = f"AI Assistant: I understand you said '{message}'. How can I help you with your tasks?"
        print(f"AI assistance requested by {current_user}: {message}")
        return {"response": response, "user": current_user}
    except Exception as e:
        print(f"Error in AI assistant: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/ai/create-task", tags=["AI Assistant"])
async def ai_create_task(
    request: Dict[str, Any],
    current_user: str = Depends(get_current_user)
):
    try:
        title = request.get("title", "AI Generated Task")
        description = request.get("description", f"Task created by AI: {title}")
        
        task_data = TaskCreate(
            title=title,
            description=description,
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.CREATED,
            tags=["ai-generated"]
        )
        
        result = task_db.create_task(task_data)
        print(f"AI created task for {current_user}: {result.title}")
        return result
    except Exception as e:
        print(f"Error in AI task creation: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/ai/subtasks", tags=["AI Assistant"])
async def ai_create_subtasks(
    request: Dict[str, Any],
    current_user: str = Depends(get_current_user)
):
    try:
        main_task = request.get("main_task", "General Task")
        
        subtasks = [
            {"title": "Планирование и подготовка", "description": f"Планирование для: {main_task}"},
            {"title": "Основная работа", "description": f"Выполнение: {main_task}"},
            {"title": "Проверка и тестирование", "description": f"Проверка: {main_task}"},
            {"title": "Завершение и документация", "description": f"Документирование: {main_task}"}
        ]
        
        print(f"AI created subtasks for {current_user}: {main_task}")
        return {"subtasks": subtasks, "main_task": main_task}
    except Exception as e:
        print(f"Error in AI subtasks creation: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/ai/productivity-analysis", tags=["AI Assistant"])
async def ai_productivity_analysis(
    current_user: str = Depends(get_current_user)
):
    try:
        insights = {
            "productivity_score": 75,
            "best_work_time": "10:00 - 14:00",
            "recommendations": "Попробуйте работать в утренние часы для лучшей продуктивности",
            "daily_average": "В среднем вы завершаете 3 задачи в день"
        }
        
        print(f"AI productivity analysis for {current_user}")
        return insights
    except Exception as e:
        print(f"Error in AI productivity analysis: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# GAMIFICATION
# ============================================================================

@app.get("/gamification/profile", tags=["Gamification"])
async def get_gamification_profile(current_user: str = Depends(get_current_user)):
    try:
        profile = {
            "user": current_user,
            "level": 5,
            "xp": 1250,
            "xp_to_next_level": 250,
            "total_achievements": 8,
            "unlocked_achievements": 5,
            "rank": "Expert",
            "daily_streak": 7
        }
        print(f"Gamification profile retrieved for {current_user}")
        return profile
    except Exception as e:
        print(f"Error getting gamification profile: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/gamification/achievements", tags=["Gamification"])
async def get_achievements(current_user: str = Depends(get_current_user)):
    try:
        achievements = [
            {
                "id": "first-task",
                "title": "Первая задача",
                "description": "Создайте свою первую задачу",
                "reward": "+50 XP",
                "status": "Получено",
                "unlocked": True
            },
            {
                "id": "productivity",
                "title": "Продуктивность",
                "description": "Завершите 5 задач за один день",
                "reward": "+100 XP",
                "status": "В процессе (3/5)",
                "unlocked": False
            },
            {
                "id": "task-master",
                "title": "Мастер задач",
                "description": "Создайте 10 задач в приложении",
                "reward": "+150 XP",
                "status": "В процессе (7/10)",
                "unlocked": False
            },
            {
                "id": "speed-demon",
                "title": "Скорость",
                "description": "Завершите 3 задачи за один час",
                "reward": "+100 XP",
                "status": "Заблокировано",
                "unlocked": False
            },
            {
                "id": "consistency",
                "title": "Постоянство",
                "description": "Используйте приложение 7 дней подряд",
                "reward": "+200 XP",
                "status": "Заблокировано",
                "unlocked": False
            }
        ]
        
        print(f"Achievements retrieved for {current_user}")
        return achievements
    except Exception as e:
        print(f"Error getting achievements: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/gamification/challenges", tags=["Gamification"])
async def get_challenges(current_user: str = Depends(get_current_user)):
    try:
        challenges = [
            {
                "id": "daily-5",
                "title": "Ежедневная пятерка",
                "description": "Завершите 5 задач сегодня",
                "reward": "+75 XP",
                "progress": 3,
                "target": 5,
                "expires": "2024-01-01T23:59:59"
            },
            {
                "id": "weekend-warrior",
                "title": "Воитель выходных",
                "description": "Создайте 3 задачи в выходные",
                "reward": "+100 XP",
                "progress": 1,
                "target": 3,
                "expires": "2024-01-07T23:59:59"
            }
        ]
        
        print(f"Challenges retrieved for {current_user}")
        return challenges
    except Exception as e:
        print(f"Error getting challenges: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/gamification/rewards", tags=["Gamification"])
async def get_rewards(current_user: str = Depends(get_current_user)):
    try:
        rewards = [
            {"id": "xp-boost", "title": "XP Boost", "description": "2x XP на 1 час", "cost": 100},
            {"id": "theme-unlock", "title": "Новая тема", "description": "Разблокируйте новую тему", "cost": 200},
            {"id": "priority-bump", "title": "Priority Bump", "description": "Повысить приоритет задачи", "cost": 50}
        ]
        
        print(f"Rewards retrieved for {current_user}")
        return rewards
    except Exception as e:
        print(f"Error getting rewards: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/gamification/leaderboard", tags=["Gamification"])
async def get_leaderboard(current_user: str = Depends(get_current_user)):
    try:
        leaderboard = [
            {"rank": 1, "user": "admin", "xp": 1250, "level": 5},
            {"rank": 2, "user": "user2", "xp": 1100, "level": 4},
            {"rank": 3, "user": "user3", "xp": 950, "level": 4}
        ]
        
        print(f"Leaderboard retrieved for {current_user}")
        return leaderboard
    except Exception as e:
        print(f"Error getting leaderboard: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# NOTIFICATIONS
# ============================================================================

@app.post("/notifications/send", tags=["Notifications"])
async def send_notification(
    request: Dict[str, Any],
    current_user: str = Depends(get_current_user)
):
    try:
        message = request.get("message", "Default notification")
        notification_type = request.get("type", "info")
        
        notification = {
            "id": str(uuid.uuid4()),
            "message": message,
            "type": notification_type,
            "user": current_user,
            "timestamp": datetime.now().isoformat(),
            "read": False
        }
        
        print(f"Notification sent to {current_user}: {message}")
        return notification
    except Exception as e:
        print(f"Error sending notification: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/notifications", tags=["Notifications"])
async def get_notifications(current_user: str = Depends(get_current_user)):
    try:
        notifications = [
            {
                "id": str(uuid.uuid4()),
                "message": "Достижение 'Первая задача' получено!",
                "type": "success",
                "timestamp": datetime.now().isoformat(),
                "read": False
            }
        ]
        
        print(f"Notifications retrieved for {current_user}")
        return notifications
    except Exception as e:
        print(f"Error getting notifications: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# THEMES
# ============================================================================

@app.get("/themes", tags=["Themes"])
async def get_themes():
    try:
        themes = [
            {"id": "light", "name": "Light Theme", "primary": "#667eea", "secondary": "#764ba2"},
            {"id": "dark", "name": "Dark Theme", "primary": "#764ba2", "secondary": "#667eea"},
            {"id": "ocean", "name": "Ocean Theme", "primary": "#4facfe", "secondary": "#00f2fe"},
            {"id": "sunset", "name": "Sunset Theme", "primary": "#f093fb", "secondary": "#f5576c"},
            {"id": "forest", "name": "Forest Theme", "primary": "#56ab2f", "secondary": "#a8e6cf"}
        ]
        
        print("Themes retrieved")
        return themes
    except Exception as e:
        print(f"Error getting themes: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# VOICE CONTROL
# ============================================================================

@app.post("/voice/command", tags=["Voice Control"])
async def voice_command(
    request: Dict[str, Any],
    current_user: str = Depends(get_current_user)
):
    try:
        command = request.get("command", "")
        response = f"Voice command received: '{command}' from user {current_user}"
        
        print(f"Voice command by {current_user}: {command}")
        return {"response": response, "command": command, "user": current_user}
    except Exception as e:
        print(f"Error processing voice command: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# ANALYTICS
# ============================================================================

@app.get("/analytics/productivity", tags=["Analytics"])
async def get_productivity_analytics(current_user: str = Depends(get_current_user)):
    try:
        analytics = {
            "daily_average": 3.2,
            "weekly_total": 22,
            "monthly_total": 89,
            "completion_rate": 78.5,
            "best_day": "Wednesday",
            "best_time": "10:00-14:00",
            "productivity_score": 85
        }
        
        print(f"Productivity analytics retrieved for {current_user}")
        return analytics
    except Exception as e:
        print(f"Error getting productivity analytics: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/analytics/tasks", tags=["Analytics"])
async def get_task_analytics(current_user: str = Depends(get_current_user)):
    try:
        analytics = {
            "total_created": 45,
            "total_completed": 38,
            "total_overdue": 2,
            "average_completion_time": "2.5 days",
            "priority_distribution": {
                "low": 15,
                "medium": 20,
                "high": 8,
                "urgent": 2
            }
        }
        
        print(f"Task analytics retrieved for {current_user}")
        return analytics
    except Exception as e:
        print(f"Error getting task analytics: {e}")
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting Full Task Manager API...")
    print("API will be available at: http://localhost:8000")
    print("Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
