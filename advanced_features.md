# Расширенные функции Task Manager API

## Сроки выполнения задач

### Новое поле due_date:
- Автоматическая валидация: срок не может быть в прошлом
- Поддержка формата YYYY-MM-DD
- Автоматическое обновление статуса на "просрочено"

### Примеры создания задач со сроком:
```bash
curl -X POST "http://localhost:8000/tasks/" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Важная задача",
       "description": "Должна быть выполнена к концу месяца",
       "due_date": "2024-12-31",
       "priority": 4
     }'
```

## Новые статусы задач

### Добавлен статус OVERDUE:
- Автоматически устанавливается для просроченных задач
- Задачи со статусом "завершено" не считаются просроченными

## Endpoints для работы со сроками

### Просроченные задачи:
```bash
curl "http://localhost:8000/tasks/overdue"
```

### Задачи с приближающимся сроком:
```bash
# Задачи на следующие 7 дней (по умолчанию)
curl "http://localhost:8000/tasks/due-soon"

# Задачи на следующие 14 дней
curl "http://localhost:8000/tasks/due-soon?days=14"
```

### Автоматическое обновление статуса:
```bash
curl -X POST "http://localhost:8000/tasks/update-overdue"
```

## Расширенная фильтрация

### По приоритету:
```bash
# Задачи с высоким приоритетом
curl "http://localhost:8000/tasks/priority/4"

# Задачи с низким приоритетом
curl "http://localhost:8000/tasks/priority/1"
```

### По диапазону приоритетов:
```bash
# Задачи с приоритетом 3-5
curl "http://localhost:8000/tasks/priority-range?min_priority=3&max_priority=5"
```

### По тегам:
```bash
# Задачи с тегом "backend"
curl "http://localhost:8000/tasks/tags/backend"

# Задачи с несколькими тегами
curl "http://localhost:8000/tasks/tags/backend,api,python"
```

### По датам создания:
```bash
# Задачи за последнюю неделю
curl "http://localhost:8000/tasks/created-between?start_date=2024-01-01&end_date=2024-01-07"
```

### По датам выполнения:
```bash
# Задачи со сроком на следующую неделю
curl "http://localhost:8000/tasks/due-between?start_date=2024-01-01&end_date=2024-01-07"
```

## Комбинированные фильтры

### Статус + Приоритет:
```bash
curl "http://localhost:8000/tasks/status-priority?status=в%20работе&priority=4"
```

### Статус + Теги:
```bash
curl "http://localhost:8000/tasks/status-tags?status=создано&tags=backend,api"
```

### Приоритет + Теги:
```bash
curl "http://localhost:8000/tasks/priority-tags?priority=5&tags=urgent,bugfix"
```

### Статус + Приоритет + Теги:
```bash
curl "http://localhost:8000/tasks/status-priority-tags?status=в%20работе&priority=4&tags=backend,api"
```

## Улучшенная сортировка

### Новые поля для сортировки:
- `due_date` - по сроку выполнения
- `priority` - по приоритету
- `title` - по названию
- `status` - по статусу
- `created_at` - по дате создания (по умолчанию)

### Примеры сортировки:
```bash
# По сроку выполнения (сначала ближайшие)
curl "http://localhost:8000/tasks/?sort_by=due_date&order=asc"

# По приоритету (сначала высокие)
curl "http://localhost:8000/tasks/?sort_by=priority&order=desc"

# По названию (алфавитно)
curl "http://localhost:8000/tasks/?sort_by=title&order=asc"
```

## Автоматические обновления

### Временные метки:
- `created_at` - автоматически при создании
- `updated_at` - автоматически при любом изменении
- `due_date` - валидируется при создании/обновлении

### Статусы:
- Автоматическое обновление на "просрочено" для задач с истекшим сроком
- Задачи со статусом "завершено" не считаются просроченными

## Валидация данных

### Сроки выполнения:
- Не может быть в прошлом
- Формат: YYYY-MM-DD
- Опциональное поле

### Приоритеты:
- Диапазон: 1-5
- 1 - Низкий, 5 - Критический

### Теги:
- Максимум 10 тегов
- Каждый тег не длиннее 50 символов
- Автоматическая очистка от пробелов

## Примеры сложных запросов

### Высокоприоритетные просроченные задачи:
```bash
curl "http://localhost:8000/tasks/status-priority?status=просрочено&priority=5"
```

### Задачи с тегом "urgent" и сроком на этой неделе:
```bash
curl "http://localhost:8000/tasks/due-between?start_date=2024-01-01&end_date=2024-01-07" | \
jq '.[] | select(.tags[] | contains("urgent"))'
```

### Статистика по просроченным задачам:
```bash
# Получаем просроченные задачи
overdue=$(curl -s "http://localhost:8000/tasks/overdue" | jq length)

# Получаем общую статистику
stats=$(curl -s "http://localhost:8000/tasks/stats/")

echo "Просроченных задач: $overdue"
echo "Общая статистика: $stats"
```
