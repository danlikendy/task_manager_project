# Примеры использования улучшенного Task Manager API

## Поиск задач

### Поиск по названию или описанию:
```bash
curl "http://localhost:8000/tasks/search/?query=Python"
curl "http://localhost:8000/tasks/search/?query=API&limit=10"
```

## Создание задач с тегами и приоритетом

### Базовая задача:
```bash
curl -X POST "http://localhost:8000/tasks/" \
     -H "Content-Type: application/json" \
     -d '{"title": "Разработать API"}'
```

### Задача с тегами и приоритетом:
```bash
curl -X POST "http://localhost:8000/tasks/" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Создать документацию API",
       "description": "Написать подробную документацию для всех endpoints",
       "tags": ["docs", "api", "swagger"],
       "priority": 4
     }'
```

## Фильтрация задач

### По статусу:
```bash
curl "http://localhost:8000/tasks/?status=создано"
curl "http://localhost:8000/tasks/?status=в%20работе"
```

### По приоритету:
```bash
curl "http://localhost:8000/tasks/?priority=5"
curl "http://localhost:8000/tasks/?priority=1"
```

### Комбинированная фильтрация:
```bash
curl "http://localhost:8000/tasks/?status=создано&priority=3"
```

## Статистика задач

### Получение общей статистики:
```bash
curl "http://localhost:8000/tasks/stats/"
```

Ответ будет содержать:
- Общее количество задач
- Распределение по статусам
- Распределение по приоритетам
- Популярные теги

## Обновление задач

### Изменение приоритета:
```bash
curl -X PUT "http://localhost:8000/tasks/{task_id}" \
     -H "Content-Type: application/json" \
     -d '{"priority": 5}'
```

### Добавление тегов:
```bash
curl -X PUT "http://localhost:8000/tasks/{task_id}" \
     -H "Content-Type: application/json" \
     -d '{"tags": ["urgent", "bugfix"]}'
```

### Комплексное обновление:
```bash
curl -X PUT "http://localhost:8000/tasks/{task_id}" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Обновленное название",
       "status": "в работе",
       "priority": 3,
       "tags": ["frontend", "react"]
     }'
```

## Примеры для Postman/Insomnia

### Создание задачи:
- **Method**: POST
- **URL**: `http://localhost:8000/tasks/`
- **Body** (JSON):
```json
{
  "title": "Тестовая задача",
  "description": "Описание для тестирования",
  "tags": ["test", "example"],
  "priority": 2
}
```

### Поиск задач:
- **Method**: GET
- **URL**: `http://localhost:8000/tasks/search/?query=тест&limit=20`

### Фильтрация:
- **Method**: GET
- **URL**: `http://localhost:8000/tasks/?status=создано&priority=3&tags=backend`

## Приоритеты задач

- **1** - Низкий (LOW)
- **2** - Средний (MEDIUM) - по умолчанию
- **3** - Высокий (HIGH)
- **4** - Срочный (URGENT)
- **5** - Критический (CRITICAL)

## Валидация тегов

- Максимум 10 тегов на задачу
- Каждый тег не длиннее 50 символов
- Пустые теги автоматически удаляются
- Теги автоматически обрезаются от пробелов
