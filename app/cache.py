import time
from typing import Any, Optional, Dict, List
from functools import wraps
import hashlib
import json

class Cache:
    def __init__(self, default_ttl: int = 300):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Установка значения в кэш"""
        ttl = ttl or self.default_ttl
        self.cache[key] = {
            "value": value,
            "expires_at": time.time() + ttl,
            "created_at": time.time()
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Получение значения из кэша"""
        if key not in self.cache:
            return None
        
        cache_entry = self.cache[key]
        if time.time() > cache_entry["expires_at"]:
            del self.cache[key]
            return None
        
        return cache_entry["value"]
    
    def delete(self, key: str) -> bool:
        """Удаление значения из кэша"""
        if key in self.cache:
            del self.cache[key]
            return True
        return False
    
    def clear(self) -> None:
        """Очистка всего кэша"""
        self.cache.clear()
    
    def exists(self, key: str) -> bool:
        """Проверка существования ключа в кэше"""
        if key not in self.cache:
            return False
        
        if time.time() > self.cache[key]["expires_at"]:
            del self.cache[key]
            return False
        
        return True
    
    def get_stats(self) -> Dict[str, Any]:
        """Получение статистики кэша"""
        current_time = time.time()
        active_entries = 0
        expired_entries = 0
        
        for key, entry in self.cache.items():
            if current_time > entry["expires_at"]:
                expired_entries += 1
            else:
                active_entries += 1
        
        return {
            "total_entries": len(self.cache),
            "active_entries": active_entries,
            "expired_entries": expired_entries,
            "cache_size": len(self.cache)
        }
    
    def cleanup_expired(self) -> int:
        """Очистка истекших записей"""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self.cache.items()
            if current_time > entry["expires_at"]
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        return len(expired_keys)

def generate_cache_key(*args, **kwargs) -> str:
    """Генерация ключа кэша на основе аргументов функции"""
    key_data = {
        "args": args,
        "kwargs": sorted(kwargs.items())
    }
    key_string = json.dumps(key_data, sort_keys=True, default=str)
    return hashlib.md5(key_string.encode()).hexdigest()

def cache_result(ttl: Optional[int] = None, key_prefix: str = ""):
    """Декоратор для кэширования результатов функций"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}:{generate_cache_key(*args, **kwargs)}"
            
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator

def invalidate_cache_pattern(pattern: str, cache_instance: Optional[Cache] = None) -> int:
    """Инвалидация кэша по паттерну"""
    target_cache = cache_instance or cache
    invalidated_count = 0
    keys_to_delete = []
    
    for key in list(target_cache.cache.keys()):
        if pattern in key:
            keys_to_delete.append(key)
    
    for key in keys_to_delete:
        if target_cache.delete(key):
            invalidated_count += 1
    
    return invalidated_count

# Глобальный экземпляр кэша
cache = Cache()

# Функции для работы с кэшем
def get_cache() -> Cache:
    return cache

def set_cache_value(key: str, value: Any, ttl: Optional[int] = None) -> None:
    cache.set(key, value, ttl)

def get_cache_value(key: str) -> Optional[Any]:
    return cache.get(key)

def delete_cache_value(key: str) -> bool:
    return cache.delete(key)

def clear_cache() -> None:
    cache.clear()

def get_cache_stats() -> Dict[str, Any]:
    return cache.get_stats()

def cleanup_expired_cache() -> int:
    return cache.cleanup_expired()
