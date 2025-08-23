import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.ai_assistant import AIAssistant, ai_assistant
from app.models import TaskPriority, TaskStatus


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    response = client.post("/token", data={"username": "admin", "password": "secret"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def ai():
    return AIAssistant()


def test_ai_assistant_creation():
    ai = AIAssistant()
    assert ai is not None
    assert len(ai.priority_keywords) > 0
    assert len(ai.tag_patterns) > 0
    assert len(ai.motivational_quotes) > 0


def test_extract_title(ai):
    text = "Создать отчет по продажам за месяц. Нужно включить графики и таблицы."
    title = ai._extract_title(text)
    assert title == "Создать отчет по продажам за месяц"
    
    long_text = "Очень длинный текст" * 20
    long_title = ai._extract_title(long_text)
    assert len(long_title) <= 100


def test_detect_priority(ai):
    critical_text = "Критический баг нужно исправить"
    assert ai._detect_priority(critical_text) == TaskPriority.CRITICAL
    
    urgent_text = "Срочно нужно позвонить клиенту"
    assert ai._detect_priority(urgent_text) == TaskPriority.URGENT
    
    high_text = "Высокий приоритет для этой задачи"
    assert ai._detect_priority(high_text) == TaskPriority.HIGH
    
    normal_text = "Обычная задача без срочности"
    assert ai._detect_priority(normal_text) == TaskPriority.MEDIUM


def test_generate_tags(ai):
    work_text = "Встреча с клиентом по проекту"
    tags = ai._generate_tags(work_text)
    assert "работа" in tags
    
    personal_text = "Купить продукты в магазине"
    tags = ai._generate_tags(personal_text)
    assert "покупки" in tags
    
    dev_text = "Исправить баг в API"
    tags = ai._generate_tags(dev_text)
    assert "разработка" in tags


def test_extract_due_date(ai):
    today_text = "Сделать это сегодня"
    due_date = ai._extract_due_date(today_text)
    assert due_date == date.today()
    
    tomorrow_text = "Завтра нужно закончить"
    due_date = ai._extract_due_date(tomorrow_text)
    assert due_date == date.today() + timedelta(days=1)
    
    date_text = "Сделать до 25.12"
    due_date = ai._extract_due_date(date_text)
    if due_date:
        assert due_date.month == 12
        assert due_date.day == 25


def test_analyze_text_and_create_task(ai):
    text = "Срочно создать отчет по продажам до завтра"
    task = ai.analyze_text_and_create_task(text)
    
    assert task.title is not None
    assert task.priority == TaskPriority.URGENT
    assert task.due_date == date.today() + timedelta(days=1)
    assert task.status == TaskStatus.CREATED


def test_generate_subtasks(ai):
    project_text = "Разработать новую функцию для сайта"
    subtasks = ai.generate_subtasks(project_text)
    assert len(subtasks) > 0
    assert any("анализ" in subtask.lower() for subtask in subtasks)
    
    meeting_text = "Провести встречу с командой"
    subtasks = ai.generate_subtasks(meeting_text)
    assert len(subtasks) > 0
    assert any("agenda" in subtask.lower() for subtask in subtasks)


def test_get_productivity_insights(ai):
    stats = {
        "total_tasks": 50,
        "completed_tasks": 40,
        "completion_rate": 80
    }
    
    insights = ai.get_productivity_insights(stats)
    assert "completion" in insights
    assert "activity" in insights
    assert "motivation" in insights


def test_suggest_priority_optimization(ai):
    tasks_data = [
        {"priority": TaskPriority.URGENT.value, "status": "создано"},
        {"priority": TaskPriority.URGENT.value, "status": "создано"},
        {"priority": TaskPriority.HIGH.value, "status": "просрочено"}
    ]
    
    suggestions = ai.suggest_priority_optimization(tasks_data)
    assert len(suggestions) > 0
    assert isinstance(suggestions[0], str)


def test_generate_daily_plan(ai):
    tasks_data = [
        {"title": "Задача 1", "priority": TaskPriority.URGENT.value},
        {"title": "Задача 2", "priority": TaskPriority.HIGH.value},
        {"title": "Задача 3", "priority": TaskPriority.MEDIUM.value}
    ]
    
    plan = ai.generate_daily_plan(tasks_data)
    assert "morning" in plan
    assert "afternoon" in plan
    assert "evening" in plan
    
    total_planned = len(plan["morning"]) + len(plan["afternoon"]) + len(plan["evening"])
    assert total_planned <= len(tasks_data)


def test_get_smart_reminder_text(ai):
    task_data = {
        "title": "Важная встреча",
        "priority": TaskPriority.HIGH.value,
        "due_date": date.today().isoformat()
    }
    
    reminder = ai.get_smart_reminder_text(task_data)
    assert "Важная встреча" in reminder
    assert len(reminder) > 0


def test_ai_create_task_endpoint(client, auth_headers):
    response = client.post(
        "/ai/create-task",
        params={"text": "Срочно написать отчет по проекту"},
        headers=auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "title" in data
    assert "priority" in data
    assert data["status"] == TaskStatus.CREATED.value


def test_ai_generate_subtasks_endpoint(client, auth_headers):
    response = client.post(
        "/ai/generate-subtasks",
        params={"task_text": "Разработать новое приложение"},
        headers=auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "subtasks" in data
    assert "count" in data
    assert len(data["subtasks"]) > 0


def test_ai_insights_endpoint(client, auth_headers):
    response = client.get("/ai/insights", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "insights" in data
    assert "stats" in data
    assert "timestamp" in data


def test_ai_daily_plan_endpoint(client, auth_headers):
    # Сначала создаем несколько задач
    for i in range(3):
        client.post(
            "/tasks/",
            json={"title": f"Тестовая задача {i+1}"},
            headers=auth_headers
        )
    
    response = client.get("/ai/daily-plan", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "daily_plan" in data
    assert "suggestions" in data
    assert "total_tasks" in data
    assert "date" in data


def test_ai_smart_reminder_endpoint(client, auth_headers):
    # Создаем задачу
    task_response = client.post(
        "/tasks/",
        json={"title": "Тестовая задача для напоминания"},
        headers=auth_headers
    )
    task_id = task_response.json()["id"]
    
    # Генерируем напоминание
    response = client.post(
        "/ai/smart-reminder",
        params={"task_id": task_id},
        headers=auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "reminder_text" in data
    assert "task_title" in data
    assert "priority" in data
    assert "created_at" in data


def test_ai_status_endpoint(client):
    response = client.get("/ai/status")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "active"
    assert "version" in data
    assert "features" in data
    assert len(data["features"]) > 0
    assert "supported_languages" in data


def test_ai_create_task_complex(client, auth_headers):
    complex_text = "Нужно срочно до завтра создать презентацию для встречи с клиентом, включить данные по продажам"
    
    response = client.post(
        "/ai/create-task",
        params={"text": complex_text},
        headers=auth_headers
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["priority"] == TaskPriority.URGENT.value
    assert "tags" in data
    assert len(data["tags"]) > 0


def test_ai_error_handling(client, auth_headers):
    # Тест с невалидным task_id для напоминания
    response = client.post(
        "/ai/smart-reminder",
        params={"task_id": "00000000-0000-0000-0000-000000000000"},
        headers=auth_headers
    )
    assert response.status_code == 404


def test_ai_unauthorized_access(client):
    # Тест без токена аутентификации
    response = client.post(
        "/ai/create-task",
        params={"text": "Тестовая задача"}
    )
    assert response.status_code == 403  # FastAPI возвращает 403 для отсутствующего токена


def test_ai_task_creation_variations(ai):
    # Тест различных вариантов текста
    test_cases = [
        ("Позвонить маме", TaskPriority.MEDIUM),
        ("СРОЧНО исправить критический баг", TaskPriority.CRITICAL),
        ("Изучить новую технологию на выходных", TaskPriority.LOW),
        ("Встреча с командой в понедельник", TaskPriority.MEDIUM)
    ]
    
    for text, expected_priority in test_cases:
        task = ai.analyze_text_and_create_task(text)
        assert task.title is not None
        assert task.priority == expected_priority


def test_ai_multilingual_support(ai):
    # Тест поддержки разных языков
    english_text = "Urgent meeting with client tomorrow"
    task = ai.analyze_text_and_create_task(english_text)
    assert task.priority == TaskPriority.URGENT
    
    russian_text = "Срочная встреча с клиентом завтра"
    task = ai.analyze_text_and_create_task(russian_text)
    assert task.priority == TaskPriority.URGENT


def test_ai_context_enhancement(ai):
    meeting_text = "Встреча с командой"
    enhancement = ai._add_context_to_description(meeting_text)
    assert enhancement is not None
    assert "agenda" in enhancement.lower()
    
    code_text = "Написать код для API"
    enhancement = ai._add_context_to_description(code_text)
    assert enhancement is not None
    assert "подзадач" in enhancement.lower()
