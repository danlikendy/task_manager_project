# Аутентификация и авторизация

## Обзор

Task Manager API теперь защищен системой аутентификации с использованием JWT токенов. Все endpoints (кроме `/`, `/health` и `/token`) требуют валидный токен доступа.

## Получение токена

### Endpoint: `POST /token`

Для получения токена доступа используйте форму с username и password:

```bash
curl -X POST "http://localhost:8000/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin&password=secret"
```

**Ответ:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

## Использование токена

### Заголовок Authorization

Все защищенные endpoints требуют заголовок `Authorization` с токеном:

```bash
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
     "http://localhost:8000/tasks/"
```

## Тестовые пользователи

### Admin пользователь
- **Username**: admin
- **Password**: secret
- **Email**: admin@example.com
- **Full Name**: Administrator

### Обычный пользователь
- **Username**: user
- **Password**: secret
- **Email**: user@example.com
- **Full Name**: Regular User

## Примеры использования

### 1. Создание задачи с аутентификацией

```bash
# Получаем токен
TOKEN=$(curl -s -X POST "http://localhost:8000/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin&password=secret" | \
     jq -r '.access_token')

# Создаем задачу
curl -X POST "http://localhost:8000/tasks/" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Важная задача",
       "description": "Описание задачи",
       "priority": 4
     }'
```

### 2. Получение списка задач

```bash
curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:8000/tasks/"
```

### 3. Обновление задачи

```bash
curl -X PUT "http://localhost:8000/tasks/{task_id}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "в работе",
       "priority": 5
     }'
```

### 4. Удаление задачи

```bash
curl -X DELETE "http://localhost:8000/tasks/{task_id}" \
     -H "Authorization: Bearer $TOKEN"
```

## Информация о пользователе

### Endpoint: `GET /users/me`

Получение информации о текущем аутентифицированном пользователе:

```bash
curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:8000/users/me"
```

**Ответ:**
```json
{
  "username": "admin",
  "full_name": "Administrator",
  "email": "admin@example.com",
  "disabled": false
}
```

## Безопасность

### JWT токены
- **Алгоритм**: HS256
- **Время жизни**: 30 минут
- **Секретный ключ**: настраивается в `app/auth.py`

### Пароли
- Хешируются с использованием bcrypt
- Автоматическая валидация при аутентификации

### Защищенные endpoints
Все следующие endpoints требуют аутентификацию:
- `/tasks/*` - все операции с задачами
- `/users/me` - информация о пользователе

### Публичные endpoints
Следующие endpoints доступны без аутентификации:
- `/` - корневой endpoint
- `/health` - проверка состояния
- `/token` - получение токена
- `/docs` - Swagger документация
- `/redoc` - ReDoc документация

## Обработка ошибок

### 401 Unauthorized
- Неверный или отсутствующий токен
- Истекший токен

### 403 Forbidden
- Отсутствует заголовок Authorization
- Неверный формат токена

### 400 Bad Request
- Неверные учетные данные при логине

## Настройка для продакшена

### Секретный ключ
Измените `SECRET_KEY` в `app/auth.py`:

```python
SECRET_KEY = "your-super-secret-key-here"
```

### Время жизни токена
Настройте `ACCESS_TOKEN_EXPIRE_MINUTES`:

```python
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 час
```

### База данных пользователей
Замените `fake_users_db` на реальную базу данных пользователей.

## Тестирование

### Запуск тестов аутентификации
```bash
python -m pytest tests/test_auth.py -v
```

### Запуск всех тестов
```bash
python -m pytest tests/ -v
```

## Интеграция с клиентами

### Postman/Insomnia
1. Создайте запрос на `POST /token`
2. В Body выберите `x-www-form-urlencoded`
3. Добавьте `username` и `password`
4. В ответе получите `access_token`
5. Используйте токен в заголовке `Authorization: Bearer {token}`

### JavaScript/Fetch
```javascript
// Получение токена
const response = await fetch('/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'username=admin&password=secret'
});

const { access_token } = await response.json();

// Использование токена
const tasksResponse = await fetch('/tasks/', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

### Python/Requests
```python
import requests

# Получение токена
response = requests.post('http://localhost:8000/token', 
                        data={'username': 'admin', 'password': 'secret'})
token = response.json()['access_token']

# Использование токена
headers = {'Authorization': f'Bearer {token}'}
tasks = requests.get('http://localhost:8000/tasks/', headers=headers)
```
