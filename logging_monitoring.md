# Логирование и мониторинг

## Обзор

Task Manager API теперь включает комплексную систему логирования и мониторинга для отслеживания производительности, безопасности и состояния системы.

## Система логирования

### Настройка логгера

Логгер настраивается в `app/logger.py` и предоставляет:

- **Консольный вывод** - для разработки и отладки
- **Файловый вывод** - для продакшена с ротацией файлов
- **Настраиваемые уровни** - DEBUG, INFO, WARNING, ERROR
- **Структурированные логи** - с временными метками и контекстом

### Конфигурация

```python
from app.logger import setup_logger

# Создание логгера с уровнем INFO
logger = setup_logger("task_manager", "INFO")

# Создание логгера с уровнем DEBUG
debug_logger = setup_logger("debug", "DEBUG")
```

### Уровни логирования

- **DEBUG** - детальная информация для отладки
- **INFO** - общая информация о работе системы
- **WARNING** - предупреждения и подозрительная активность
- **ERROR** - ошибки и исключения

## Middleware

### 1. LoggingMiddleware

Автоматически логирует все HTTP запросы:

```python
# Логирует:
# - Метод запроса (GET, POST, PUT, DELETE)
# - Путь запроса
# - Код ответа
# - Время выполнения
# - Пользователя (если аутентифицирован)
```

**Пример лога:**
```
2024-01-15 10:30:45 - task_manager - INFO - Request completed: {'method': 'GET', 'path': '/tasks/', 'status_code': 200, 'duration': '0.045s', 'user': 'admin', 'timestamp': '2024-01-15T10:30:45.123456'}
```

### 2. SecurityMiddleware

Отслеживает подозрительную активность:

- **Подозрительные пути**: `/admin`, `/config`, `/.env`, `/wp-admin`
- **Подозрительные User-Agent**: sqlmap, nikto, nmap, scanner
- **Логирование IP адресов** подозрительных запросов

**Пример лога безопасности:**
```
2024-01-15 10:31:12 - task_manager - WARNING - Security event: {'event_type': 'suspicious_request', 'user': 'unknown', 'details': 'IP: 192.168.1.100, User-Agent: sqlmap, Path: /admin', 'timestamp': '2024-01-15T10:31:12.456789'}
```

### 3. PerformanceMiddleware

Отслеживает медленные запросы:

- **Порог**: запросы дольше 1 секунды
- **Логирование** деталей медленных запросов
- **IP адрес** источника медленного запроса

**Пример лога производительности:**
```
2024-01-15 10:32:00 - task_manager - INFO - Performance metric: {'operation': 'GET /tasks/', 'duration': '1.234s', 'details': 'Slow request from 192.168.1.101', 'timestamp': '2024-01-15T10:32:00.789012'}
```

## Функции логирования

### log_request()
Логирует завершенные HTTP запросы:

```python
from app.logger import log_request

log_request(
    logger,
    method="GET",
    path="/tasks/",
    status_code=200,
    duration=0.045,
    user="admin"
)
```

### log_error()
Логирует ошибки и исключения:

```python
from app.logger import log_error

try:
    # код, который может вызвать ошибку
    pass
except Exception as e:
    log_error(logger, e, "Creating task")
    raise
```

### log_security_event()
Логирует события безопасности:

```python
from app.logger import log_security_event

log_security_event(
    logger,
    "failed_login",
    user="admin",
    details="IP: 192.168.1.100"
)
```

### log_performance()
Логирует метрики производительности:

```python
from app.logger import log_performance

log_performance(
    logger,
    "database_query",
    duration=0.123,
    details="Complex join operation"
)
```

## Мониторинг

### Endpoint: `/metrics`

Предоставляет метрики производительности:

```bash
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8000/metrics"
```

**Ответ:**
```json
{
  "total_tasks": 150,
  "completed_tasks": 89,
  "overdue_tasks": 12,
  "today_tasks": 5,
  "week_tasks": 23,
  "completion_rate": 59.33,
  "overdue_rate": 8.0,
  "timestamp": "2024-01-15T10:30:00.123456"
}
```

### Endpoint: `/health/detailed`

Детальная проверка состояния системы:

```bash
curl "http://localhost:8000/health/detailed"
```

**Ответ:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.123456",
  "database": "connected",
  "total_tasks": 150,
  "memory_usage": "normal",
  "uptime": "running"
}
```

## Файлы логов

### Структура директории
```
logs/
├── task_manager.log          # Текущий лог файл
├── task_manager.log.1        # Архив 1
├── task_manager.log.2        # Архив 2
├── task_manager.log.3        # Архив 3
├── task_manager.log.4        # Архив 4
└── task_manager.log.5        # Архив 5
```

### Ротация логов
- **Максимальный размер**: 10 MB
- **Количество архивов**: 5
- **Автоматическая ротация** при превышении размера

### Формат логов
```
2024-01-15 10:30:45 - task_manager - INFO - Request completed: {'method': 'GET', 'path': '/tasks/', 'status_code': 200, 'duration': '0.045s', 'user': 'admin', 'timestamp': '2024-01-15T10:30:45.123456'}
```

## Интеграция с системами мониторинга

### Prometheus метрики
Endpoint `/metrics` можно интегрировать с Prometheus для сбора метрик.

### Grafana дашборды
Создание дашбордов для визуализации:
- Количество задач по статусам
- Время выполнения запросов
- Ошибки и исключения
- Активность пользователей

### ELK Stack
Интеграция с Elasticsearch, Logstash, Kibana:
- Централизованное хранение логов
- Поиск и анализ логов
- Алерты и уведомления

## Настройка для продакшена

### Уровни логирования
```python
# Продакшен
logger = setup_logger("task_manager", "WARNING")

# Разработка
logger = setup_logger("task_manager", "DEBUG")
```

### Ротация логов
```python
# Настройка в logger.py
file_handler = RotatingFileHandler(
    logs_dir / "task_manager.log",
    maxBytes=100*1024*1024,  # 100 MB
    backupCount=10            # 10 архивов
)
```

### Внешние системы логирования
```python
# Интеграция с внешними системами
import syslog
syslog_handler = logging.handlers.SysLogHandler()
logger.addHandler(syslog_handler)
```

## Тестирование

### Запуск тестов логирования
```bash
python -m pytest tests/test_logging.py -v
```

### Тестирование middleware
```bash
# Тест логирования
python -m pytest tests/test_logging.py::test_logging_middleware -v

# Тест безопасности
python -m pytest tests/test_logging.py::test_security_middleware -v

# Тест производительности
python -m pytest tests/test_logging.py::test_performance_middleware -v
```

## Примеры использования

### 1. Логирование создания задачи
```python
@app.post("/tasks/")
async def create_task(task: TaskCreate, current_user = Depends(get_current_active_user)):
    try:
        result = task_db.create_task(task)
        logger.info(f"Task created by user {current_user.username}: {task.title}")
        return result
    except Exception as e:
        log_error(logger, e, f"Creating task: {task.title}")
        raise
```

### 2. Логирование аутентификации
```python
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        user = authenticate_user(fake_users_db, form_data.username, form_data.password)
        if not user:
            client_ip = request.client.host if request.client else "unknown"
            log_security_event(logger, "failed_login", form_data.username, f"IP: {client_ip}")
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        
        client_ip = request.client.host if request.client else "unknown"
        logger.info(f"User {user.username} logged in successfully from IP: {client_ip}")
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        if not isinstance(e, HTTPException):
            log_error(logger, e, f"Login attempt for user {form_data.username}")
        raise
```

### 3. Мониторинг производительности
```python
@app.get("/tasks/")
async def get_tasks(current_user = Depends(get_current_active_user)):
    try:
        start_time = time.time()
        result = task_db.get_tasks()
        duration = time.time() - start_time
        
        if duration > 0.5:
            log_performance(logger, "get_tasks", duration, f"User: {current_user.username}")
        
        logger.info(f"Tasks retrieved by user {current_user.username}: {len(result)} tasks")
        return result
    except Exception as e:
        log_error(logger, e, f"Retrieving tasks for user {current_user.username}")
        raise
```

## Алерты и уведомления

### Критические события
- **Множественные неудачные попытки входа**
- **Подозрительная активность**
- **Медленные запросы**
- **Ошибки базы данных**

### Настройка уведомлений
```python
# Интеграция с внешними системами уведомлений
def send_alert(message: str, level: str = "warning"):
    if level == "critical":
        # Отправка SMS, email, Slack
        pass
    elif level == "warning":
        # Логирование и уведомление в чат
        pass
```

## Заключение

Система логирования и мониторинга Task Manager API обеспечивает:

- **Полную видимость** работы системы
- **Безопасность** через отслеживание подозрительной активности
- **Производительность** через мониторинг медленных запросов
- **Отладку** через детальные логи
- **Масштабируемость** через интеграцию с внешними системами
