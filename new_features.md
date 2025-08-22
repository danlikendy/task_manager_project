# Новые функции Task Manager API

## Сортировка задач

### Параметры сортировки:
- `sort_by`: title, status, priority, created_at
- `order`: asc, desc

### Примеры:
```bash
# Сортировка по названию по возрастанию
curl "http://localhost:8000/tasks/?sort_by=title&order=asc"

# Сортировка по приоритету по убыванию
curl "http://localhost:8000/tasks/?sort_by=priority&order=desc"

# Сортировка по дате создания (по умолчанию)
curl "http://localhost:8000/tasks/?sort_by=created_at&order=desc"
```

## Временные метки

### Автоматически добавляемые поля:
- `created_at`: время создания задачи
- `updated_at`: время последнего обновления

### Пример ответа:
```json
{
  "id": "uuid",
  "title": "Название задачи",
  "created_at": "2024-01-01T12:00:00",
  "updated_at": "2024-01-01T14:30:00"
}
```

## Массовые операции

### Массовое обновление статуса:
```bash
curl -X POST "http://localhost:8000/tasks/bulk/status" \
     -H "Content-Type: application/json" \
     -d '{
       "task_ids": ["uuid1", "uuid2", "uuid3"],
       "status": "завершено"
     }'
```

### Массовое удаление:
```bash
curl -X DELETE "http://localhost:8000/tasks/bulk/" \
     -H "Content-Type: application/json" \
     -d '{
       "task_ids": ["uuid1", "uuid2"]
     }'
```

## Экспорт данных

### Экспорт в CSV:
```bash
curl "http://localhost:8000/tasks/export/csv" \
     -o tasks.csv
```

Файл содержит: ID, Название, Описание, Статус, Приоритет, Теги, Создано, Обновлено

## Фильтрация по датам

### Получение задач по диапазону дат:
```bash
# Задачи за последнюю неделю
curl "http://localhost:8000/tasks/by-date?start_date=2024-01-01&end_date=2024-01-07"

# Задачи за конкретный месяц
curl "http://localhost:8000/tasks/by-date?start_date=2024-01-01&end_date=2024-01-31&limit=50"
```

## Комбинированные фильтры

### Примеры сложных запросов:
```bash
# Высокоприоритетные задачи в работе с тегом "backend"
curl "http://localhost:8000/tasks/?status=в%20работе&priority=4&tags=backend&sort_by=priority&order=desc"

# Задачи созданные сегодня, отсортированные по названию
curl "http://localhost:8000/tasks/?start_date=2024-01-01&end_date=2024-01-01&sort_by=title&order=asc"
```

## Улучшенная статистика

### Новые поля в статистике:
- Распределение по статусам
- Распределение по приоритетам
- Популярные теги (топ-10)
- Общее количество задач

### Получение статистики:
```bash
curl "http://localhost:8000/tasks/stats/"
```

## Валидация данных

### Автоматическая валидация:
- Теги: максимум 10, каждый не длиннее 50 символов
- Пустые теги автоматически удаляются
- Временные метки обновляются автоматически
- Приоритеты: от 1 (низкий) до 5 (критический)
