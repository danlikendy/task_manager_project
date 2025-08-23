# Быстрый запуск Task Manager

## Запуск за 5 минут

### 1. Установка зависимостей
```bash
pip install -r requirements.txt
```

### 2. Запуск приложения
```bash
python run.py
```

### 3. Открыть в браузере
- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Первый вход

### Получить токен аутентификации
```bash
curl -X POST "http://localhost:8000/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin&password=secret"
```

### Использовать токен
```bash
# Заменить YOUR_TOKEN_HERE на полученный токен
curl -X GET "http://localhost:8000/tasks/" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Попробовать геймификацию

### 1. Создать задачу
```bash
curl -X POST "http://localhost:8000/tasks/" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{"title": "Первая задача", "description": "Описание"}'
```

### 2. Проверить профиль
```bash
curl -X GET "http://localhost:8000/gamification/profile" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Посмотреть достижения
```bash
curl -X GET "http://localhost:8000/gamification/achievements" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🤖 Попробовать AI-ассистента

### Создать задачу через AI
```bash
curl -X POST "http://localhost:8000/ai/create-task" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "text=СРОЧНО подготовить отчет до завтра"
```

### Получить ежедневный план
```bash
curl -X GET "http://localhost:8000/ai/daily-plan" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🧪 Запуск тестов

### Все тесты
```bash
python -m pytest
```

### Конкретные тесты
```bash
# Тесты геймификации
python -m pytest tests/test_gamification.py -v

# Тесты AI-ассистента
python -m pytest tests/test_ai_assistant.py -v

# Тесты с покрытием
python -m pytest --cov=app --cov-report=html
```

## 🐳 Docker запуск

### Быстрый запуск
```bash
docker-compose up --build
```

### Ручная сборка
```bash
docker build -t task-manager .
docker run -p 8000:8000 task-manager
```

## Основные функции

### ✅ CRUD задачи
- Создание, чтение, обновление, удаление
- Фильтрация по статусу, приоритету, тегам
- Поиск и сортировка
- Пагинация результатов

### Геймификация
- Уровни и опыт (XP)
- 50+ достижений
- Ежедневные вызовы
- Система наград

### 🤖 AI-ассистент
- Умное создание задач
- Автоматические приоритеты
- Генерация тегов
- Ежедневные планы

### 🔧 Дополнительно
- Кэширование
- Логирование
- Мониторинг
- Экспорт данных

## 🔍 Полезные endpoints

### Мониторинг
- `GET /health` - здоровье системы
- `GET /metrics` - метрики
- `GET /cache/stats` - статистика кэша

### Статистика
- `GET /tasks/stats` - статистика задач
- `GET /gamification/stats` - статистика геймификации
- `GET /gamification/challenges` - текущие вызовы

## 🚨 Решение проблем

### Порт занят
```bash
# Найти процесс
netstat -ano | findstr :8000

# Остановить процесс
taskkill /PID <PID> /F
```

### Ошибки зависимостей
```bash
# Обновить pip
python -m pip install --upgrade pip

# Переустановить зависимости
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

### Проблемы с Docker
```bash
# Очистить Docker
docker system prune -a

# Пересобрать образ
docker-compose down
docker-compose up --build
```

## 📚 Документация

- [Обзор функций](FEATURES_OVERVIEW.md) - все возможности
- [AI-ассистент](ai_assistant.md) - AI функции
- [Геймификация](gamification.md) - система достижений
- [Примеры](examples.md) - примеры API
- [Примеры геймификации](gamification_examples.md) - практика

## Следующие шаги

1. **Изучить API** через Swagger UI
2. **Создать несколько задач** для получения XP
3. **Попробовать AI-ассистента** для умного планирования
4. **Выполнить вызовы** для получения наград
5. **Изучить статистику** и аналитику

## 🆘 Поддержка

При возникновении проблем:
1. Проверить логи в консоли
2. Убедиться в правильности токена
3. Проверить доступность порта 8000
4. Запустить тесты для диагностики

**Удачи в освоении Task Manager!**
