# Task Manager API

REST API для управления задачами с полным набором CRUD операций.

## Функциональность

- Создание задач
- Получение списка задач с пагинацией
- Получение задачи по ID
- Обновление задач
- Удаление задач
- Фильтрация по статусу
- Система геймификации с достижениями
- AI-ассистент для умного управления
- Расширенная аналитика и статистика

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

**[Быстрый запуск за 5 минут](QUICK_START.md)**

### Локальный запуск

1. Установите зависимости:
```bash
pip install -r requirements.txt
```

2. Запустите приложение:
```bash
python run.py
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

## Мобильное приложение

**[React Native приложение](mobile-app/README.md) готово к использованию!**

### Возможности мобильного приложения:
- Красивый современный UI с градиентами
- Полная система геймификации
- AI-ассистент для создания задач
- Дашборд с статистикой и прогрессом
- Безопасная аутентификация
- Адаптивный дизайн для всех устройств

### Быстрый запуск мобильного приложения:
```bash
cd mobile-app
npm install
npm run android  # для Android
npm run ios      # для iOS
```

## API Endpoints

### Основные операции с задачами
- `GET /` - информация об API
- `GET /health` - проверка состояния
- `POST /tasks/` - создание задачи
- `GET /tasks/` - список задач
- `GET /tasks/{id}` - задача по ID
- `PUT /tasks/{id}` - обновление задачи
- `DELETE /tasks/{id}` - удаление задачи
- `GET /tasks/status/{status}` - задачи по статусу

### AI-ассистент
- `POST /ai/create-task` - создание задачи через AI
- `GET /ai/insights` - получение AI-инсайтов
- `GET /ai/daily-plan` - ежедневный план

### Система геймификации
- `GET /gamification/profile` - профиль пользователя
- `GET /gamification/achievements` - достижения с прогрессом
- `GET /gamification/challenges` - ежедневные и недельные вызовы
- `GET /gamification/rewards` - магазин наград
- `POST /gamification/purchase-reward/{reward_id}` - покупка награды
- `POST /gamification/complete-challenge/{challenge_id}` - завершение вызова
- `GET /gamification/leaderboard` - таблица лидеров
- `POST /gamification/trigger-event` - триггер событий

## Документация API

После запуска приложения документация доступна по адресам:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Дополнительная документация
- [Обзор функций](FEATURES_OVERVIEW.md) - полный обзор всех возможностей
- [AI-ассистент](ai_assistant.md) - подробное описание AI-функций
- [Система геймификации](gamification.md) - описание системы достижений
- [Улучшенная геймификация](GAMIFICATION_ENHANCED.md) - новая система достижений и наград
- [Примеры использования](examples.md) - примеры API запросов
- [Примеры геймификации](gamification_examples.md) - практические примеры использования
- **[Мобильное приложение](mobile-app/README.md)** - документация React Native приложения

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
├── app/                    # Backend API
│   ├── __init__.py
│   ├── main.py            # FastAPI приложение
│   ├── models.py          # Pydantic модели
│   ├── database.py        # База данных
│   ├── auth.py            # Аутентификация
│   ├── logger.py          # Логирование
│   ├── middleware.py      # Middleware
│   ├── cache.py           # Кэширование
│   ├── ai_assistant.py    # AI-ассистент
│   └── gamification.py    # Система геймификации
├── mobile-app/            # React Native приложение
│   ├── src/
│   │   ├── screens/       # Экраны приложения
│   │   ├── contexts/      # React Contexts
│   │   └── components/    # Компоненты
│   ├── App.js             # Главный компонент
│   └── package.json       # Зависимости
├── tests/                 # Тесты
├── requirements.txt       # Python зависимости
├── pytest.ini           # Конфигурация pytest
├── Dockerfile           # Docker образ
├── docker-compose.yml   # Docker Compose
└── README.md            # Документация
```

## Что дальше?

### Backend возможности:
- ✅ CRUD операции для задач
- ✅ Система аутентификации
- ✅ AI-ассистент
- ✅ Система геймификации
- ✅ Кэширование и логирование
- ✅ Полное покрытие тестами
- ✅ Docker контейнеризация

### Мобильное приложение:
- ✅ React Native приложение
- ✅ Красивый UI с градиентами
- ✅ Система геймификации
- ✅ AI-ассистент
- ✅ Адаптивный дизайн
- ✅ Оффлайн поддержка

### Планы на будущее:
- 🔮 WebSocket для реального времени
- 🔮 GraphQL API
- 🔮 Микросервисная архитектура
- 🔮 Машинное обучение для персонализации
- 🔮 Интеграция с внешними сервисами
- 🔮 PWA версия
- 🔮 Desktop приложение (Electron)

## Заключение

Task Manager представляет собой полнофункциональное решение для управления задачами:

- **Backend API** на FastAPI с богатым функционалом
- **Мобильное приложение** на React Native с красивым UI
- **Система геймификации** для мотивации пользователей
- **AI-ассистент** для умного планирования
- **Высокое качество** кода и полное покрытие тестами
- **Готовность к продакшену** с Docker и документацией

Приложение демонстрирует лучшие практики разработки и готово к использованию как в личных, так и в корпоративных целях!
