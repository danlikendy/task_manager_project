# Система кэширования

## Обзор

Task Manager API теперь включает интеллектуальную систему кэширования для значительного улучшения производительности и снижения нагрузки на базу данных.

## Архитектура кэширования

### Основные компоненты

1. **Cache класс** - основная реализация кэша в памяти
2. **Декоратор cache_result** - автоматическое кэширование функций
3. **Функции управления** - очистка, статистика, инвалидация
4. **Интеграция с базой данных** - автоматическая инвалидация при изменениях

### Типы кэширования

- **Чтение данных** - кэширование результатов запросов
- **Статистика** - кэширование агрегированных данных
- **Поиск** - кэширование результатов поиска
- **Фильтрация** - кэширование отфильтрованных результатов

## Конфигурация кэша

### Настройки по умолчанию

```python
class Cache:
    def __init__(self, default_ttl: int = 300):  # 5 минут
        self.cache = {}
        self.default_ttl = default_ttl
```

### TTL для разных типов данных

```python
# Список задач - 1 минута
@cache_result(ttl=60, key_prefix="tasks")
def get_tasks(self, skip: int = 0, limit: int = 100):
    pass

# Отдельная задача - 5 минут
@cache_result(ttl=300, key_prefix="task")
def get_task(self, task_id: UUID):
    pass

# Статистика - 5 минут
@cache_result(ttl=300, key_prefix="tasks_stats")
def get_tasks_stats(self):
    pass

# Поиск - 2 минуты
@cache_result(ttl=120, key_prefix="search_tasks")
def search_tasks(self, query: str, limit: int = 50):
    pass
```

## Функциональность кэша

### Основные операции

#### 1. Установка значения
```python
cache.set("key", "value", ttl=300)  # TTL в секундах
```

#### 2. Получение значения
```python
value = cache.get("key")
if value is None:
    # Значение не найдено или истекло
    pass
```

#### 3. Удаление значения
```python
success = cache.delete("key")
```

#### 4. Проверка существования
```python
exists = cache.exists("key")
```

#### 5. Очистка всего кэша
```python
cache.clear()
```

### Автоматическое управление

#### Очистка истекших записей
```python
cleaned_count = cache.cleanup_expired()
```

#### Статистика кэша
```python
stats = cache.get_stats()
# {
#     "total_entries": 150,
#     "active_entries": 120,
#     "expired_entries": 30,
#     "cache_size": 150
# }
```

## Декоратор cache_result

### Базовое использование

```python
from app.cache import cache_result

@cache_result(ttl=300, key_prefix="my_function")
def expensive_function(param1: str, param2: int):
    # Результат будет закэширован на 5 минут
    return complex_calculation(param1, param2)
```

### Автоматическая генерация ключей

```python
# Ключ генерируется автоматически на основе аргументов
result1 = expensive_function("hello", 42)
result2 = expensive_function("hello", 42)  # Из кэша
result3 = expensive_function("world", 42)  # Новый вызов
```

### Настройка TTL

```python
@cache_result(ttl=60)      # 1 минута
@cache_result(ttl=300)     # 5 минут
@cache_result(ttl=3600)    # 1 час
@cache_result()             # Использует default_ttl
```

## Интеграция с базой данных

### Автоматическая инвалидация

При любых изменениях в данных автоматически инвалидируется соответствующий кэш:

```python
def create_task(self, task_create: TaskCreate) -> Task:
    # ... создание задачи ...
    
    # Автоматическая инвалидация кэша
    invalidate_cache_pattern("tasks")
    invalidate_cache_pattern("task")
    invalidate_cache_pattern("stats")
    
    return task

def update_task(self, task_id: UUID, task_update: TaskUpdate) -> Optional[Task]:
    # ... обновление задачи ...
    
    # Инвалидация конкретной задачи и общих списков
    invalidate_cache_pattern("tasks")
    invalidate_cache_pattern(f"task:{task_id}")
    invalidate_cache_pattern("stats")
    
    return task
```

### Паттерны инвалидации

```python
# Инвалидация всех задач
invalidate_cache_pattern("tasks")

# Инвалидация конкретной задачи
invalidate_cache_pattern(f"task:{task_id}")

# Инвалидация статистики
invalidate_cache_pattern("stats")

# Инвалидация поиска
invalidate_cache_pattern("search_tasks")

# Инвалидация фильтров
invalidate_cache_pattern("tasks_filtered")
```

## API Endpoints для кэша

### 1. Статистика кэша

```bash
GET /cache/stats
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "total_entries": 150,
  "active_entries": 120,
  "expired_entries": 30,
  "cache_size": 150
}
```

### 2. Очистка всего кэша

```bash
DELETE /cache/clear
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "message": "Cache cleared successfully"
}
```

### 3. Очистка истекших записей

```bash
POST /cache/cleanup
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "message": "Cache cleanup completed",
  "cleaned_entries": 30
}
```

## Стратегии кэширования

### 1. Кэширование чтения

```python
@cache_result(ttl=60, key_prefix="tasks")
def get_tasks(self, skip: int = 0, limit: int = 100):
    # Результат кэшируется на 1 минуту
    pass
```

**Преимущества:**
- Быстрые ответы для повторных запросов
- Снижение нагрузки на базу данных
- Улучшение пользовательского опыта

### 2. Кэширование агрегатов

```python
@cache_result(ttl=300, key_prefix="tasks_stats")
def get_tasks_stats(self):
    # Статистика кэшируется на 5 минут
    pass
```

**Преимущества:**
- Быстрый доступ к статистике
- Снижение вычислительной нагрузки
- Актуальные данные в разумных пределах

### 3. Кэширование поиска

```python
@cache_result(ttl=120, key_prefix="search_tasks")
def search_tasks(self, query: str, limit: int = 50):
    # Результаты поиска кэшируются на 2 минуты
    pass
```

**Преимущества:**
- Быстрые результаты поиска
- Кэширование популярных запросов
- Снижение нагрузки при повторных поисках

## Управление производительностью

### Мониторинг кэша

```python
# Получение статистики
stats = get_cache_stats()

# Анализ эффективности
hit_rate = (stats["total_entries"] - stats["expired_entries"]) / stats["total_entries"]
print(f"Cache hit rate: {hit_rate:.2%}")
```

### Оптимизация TTL

```python
# Для часто изменяющихся данных
@cache_result(ttl=30)   # 30 секунд

# Для стабильных данных
@cache_result(ttl=1800) # 30 минут

# Для редко изменяющихся данных
@cache_result(ttl=7200) # 2 часа
```

### Очистка истекших записей

```python
# Периодическая очистка
def cleanup_expired_cache():
    cleaned_count = cleanup_expired_cache()
    logger.info(f"Cleaned {cleaned_count} expired cache entries")
```

## Интеграция с внешними системами

### Redis (для продакшена)

```python
import redis
from app.cache import Cache

class RedisCache(Cache):
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        ttl = ttl or self.default_ttl
        self.redis.setex(key, ttl, json.dumps(value))
    
    def get(self, key: str) -> Optional[Any]:
        value = self.redis.get(key)
        return json.loads(value) if value else None
```

### Memcached

```python
import memcache
from app.cache import Cache

class MemcachedCache(Cache):
    def __init__(self, memcached_client: memcache.Client):
        self.memcached = memcached_client
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        ttl = ttl or self.default_ttl
        self.memcached.set(key, value, time=ttl)
    
    def get(self, key: str) -> Optional[Any]:
        return self.memcached.get(key)
```

## Тестирование кэширования

### Запуск тестов

```bash
# Все тесты кэширования
python -m pytest tests/test_cache.py -v

# Конкретный тест
python -m pytest tests/test_cache.py::test_cache_set_get -v

# Тесты интеграции
python -m pytest tests/test_cache.py::test_cache_integration_with_database -v
```

### Тестирование производительности

```python
import time

def test_cache_performance():
    start_time = time.time()
    
    # Первый вызов (без кэша)
    result1 = expensive_function("param1", "param2")
    first_call_time = time.time() - start_time
    
    # Второй вызов (из кэша)
    start_time = time.time()
    result2 = expensive_function("param1", "param2")
    second_call_time = time.time() - start_time
    
    # Проверяем улучшение производительности
    assert second_call_time < first_call_time * 0.1  # В 10 раз быстрее
```

## Лучшие практики

### 1. Выбор TTL

- **Короткий TTL (30-60 сек)**: часто изменяющиеся данные
- **Средний TTL (5-15 мин)**: умеренно изменяющиеся данные
- **Длинный TTL (1-24 часа)**: стабильные данные

### 2. Ключи кэша

- **Уникальность**: каждый уникальный запрос должен иметь уникальный ключ
- **Читаемость**: ключи должны быть понятными для отладки
- **Длина**: избегать слишком длинных ключей

### 3. Инвалидация

- **Автоматическая**: при любых изменениях данных
- **Селективная**: инвалидировать только затронутые данные
- **Своевременная**: сразу после изменения данных

### 4. Мониторинг

- **Статистика**: регулярно проверять статистику кэша
- **Производительность**: отслеживать hit rate и miss rate
- **Очистка**: периодически очищать истекшие записи

## Заключение

Система кэширования Task Manager API обеспечивает:

- **Значительное улучшение производительности** для операций чтения
- **Автоматическое управление** жизненным циклом кэша
- **Интеллектуальную инвалидацию** при изменениях данных
- **Гибкую настройку** TTL для разных типов данных
- **Масштабируемость** через интеграцию с внешними системами
- **Простоту использования** через декораторы и автоматизацию

Кэширование особенно эффективно для:
- Часто запрашиваемых данных
- Сложных вычислений и агрегаций
- Результатов поиска и фильтрации
- Статистической информации
