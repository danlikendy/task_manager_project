# Task Manager API

REST API для управления задачами с полным набором CRUD операций.

## Функциональность

- Создание задач
- Получение списка задач с пагинацией
- Получение задачи по ID
- Обновление задач
- Удаление задач
- Фильтрация по статусу

## Статусы задач

- `создано` - задача создана
- `в работе` - задача выполняется
- `завершено` - задача завершена

## Технологии

- **Backend**: FastAPI (3 балла)
- **Тестирование**: pytest (2 балла)
- **Валидация**: Pydantic
- **База данных**: In-memory хранилище

## Установка и запуск

### Локальный запуск

1. Установите зависимости:
```bash
pip install -r requirements.txt
```

2. Запустите приложение:
```bash
python -m uvicorn app.main:app --reload
```

### Docker

1. Соберите и запустите контейнер:
```bash
docker-compose up --build
```

2. Или используйте Dockerfile напрямую:
```bash
docker build -t task-manager .
docker run -p 8000:8000 task-manager
```

## API Endpoints

- `GET /` - информация об API
- `GET /health` - проверка состояния
- `POST /tasks/` - создание задачи
- `GET /tasks/` - список задач
- `GET /tasks/{id}` - задача по ID
- `PUT /tasks/{id}` - обновление задачи
- `DELETE /tasks/{id}` - удаление задачи
- `GET /tasks/status/{status}` - задачи по статусу

## Документация API

После запуска приложения документация доступна по адресам:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Тестирование

Запуск тестов:
```bash
pytest
```

Запуск тестов с подробным выводом:
```bash
pytest -v
```

## Примеры использования

### Создание задачи
```bash
curl -X POST "http://localhost:8000/tasks/" \
     -H "Content-Type: application/json" \
     -d '{"title": "Новая задача", "description": "Описание"}'
```

### Получение списка задач
```bash
curl "http://localhost:8000/tasks/"
```

### Обновление задачи
```bash
curl -X PUT "http://localhost:8000/tasks/{task_id}" \
     -H "Content-Type: application/json" \
     -d '{"status": "в работе"}'
```

## Структура проекта

```
task_manager_project/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI приложение
│   ├── models.py        # Pydantic модели
│   └── database.py      # База данных
├── tests/
│   ├── __init__.py
│   ├── conftest.py      # Конфигурация pytest
│   ├── test_models.py   # Тесты моделей
│   ├── test_database.py # Тесты базы данных
│   └── test_api.py      # Тесты API
├── requirements.txt      # Зависимости
├── pytest.ini          # Конфигурация pytest
├── Dockerfile          # Docker образ
├── docker-compose.yml  # Docker Compose
└── README.md           # Документация
```
