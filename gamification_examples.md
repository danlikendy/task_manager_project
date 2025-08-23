# Примеры использования системы геймификации

## Быстрый старт

### 1. Получение профиля пользователя

```bash
# Получить токен аутентификации
curl -X POST "http://localhost:8000/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin&password=secret"

# Использовать токен для получения профиля
curl -X GET "http://localhost:8000/gamification/profile" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Ответ:**
```json
{
  "user_id": "admin",
  "level": 5,
  "current_xp": 1250,
  "next_level_xp": 2000,
  "total_xp": 1250,
  "coins": 450,
  "mood": "excited",
  "mood_note": "Отличный день!",
  "achievements_count": 12,
  "challenges_completed": 8
}
```

### 2. Просмотр достижений

```bash
# Получить все доступные достижения
curl -X GET "http://localhost:8000/gamification/achievements" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Получить достижения конкретного пользователя
curl -X GET "http://localhost:8000/gamification/achievements/user/admin" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Ответ:**
```json
{
  "achievements": [
    {
      "id": "first_task",
      "title": "Первые шаги",
      "description": "Создать первую задачу",
      "category": "productivity",
      "rarity": "common",
      "xp_reward": 1,
      "coin_reward": 5,
      "is_unlocked": true,
      "unlocked_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "task_master",
      "title": "Мастер задач",
      "description": "Создать 50 задач",
      "category": "productivity",
      "rarity": "rare",
      "xp_reward": 5,
      "coin_reward": 25,
      "is_unlocked": false,
      "unlocked_at": null
    }
  ]
}
```

### 3. Текущие вызовы

```bash
# Получить текущие вызовы
curl -X GET "http://localhost:8000/gamification/challenges" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Получить вызовы по периоду
curl -X GET "http://localhost:8000/gamification/challenges/daily" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Ответ:**
```json
{
  "challenges": [
    {
      "id": "daily_productivity",
      "title": "Утренняя продуктивность",
      "description": "Завершить 3 задачи до 12:00",
      "period": "daily",
      "target": 3,
      "current_progress": 1,
      "xp_reward": 25,
      "coin_reward": 50,
      "deadline": "2024-01-15T23:59:59Z",
      "is_completed": false
    }
  ]
}
```

### 4. Статистика и аналитика

```bash
# Общая статистика
curl -X GET "http://localhost:8000/gamification/stats" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Статистика по периоду
curl -X GET "http://localhost:8000/gamification/stats/weekly" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Ответ:**
```json
{
  "overview": {
    "total_xp": 1250,
    "current_level": 5,
    "total_coins": 450,
    "achievements_count": 12,
    "challenges_completed": 8
  },
  "productivity": {
    "tasks_created": 45,
    "tasks_completed": 38,
    "completion_rate": 84.4,
    "average_completion_time": "2.5 days"
  },
  "gamification": {
    "daily_streak": 7,
    "weekly_goals_met": 3,
    "monthly_challenges": 1
  }
}
```

## Практические сценарии

### Сценарий 1: Новый пользователь

```bash
# 1. Создать первую задачу
curl -X POST "http://localhost:8000/tasks/" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{"title": "Изучить API", "description": "Изучить документацию Task Manager"}'

# 2. Проверить профиль (должен получить достижение "Первые шаги")
curl -X GET "http://localhost:8000/gamification/profile" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. Посмотреть достижения
curl -X GET "http://localhost:8000/gamification/achievements/user/admin" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Сценарий 2: Выполнение ежедневного вызова

```bash
# 1. Посмотреть текущие вызовы
curl -X GET "http://localhost:8000/gamification/challenges/daily" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 2. Создать несколько задач с высоким приоритетом
curl -X POST "http://localhost:8000/tasks/" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{"title": "Срочная задача 1", "priority": "high"}'

curl -X POST "http://localhost:8000/tasks/" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{"title": "Срочная задача 2", "priority": "high"}'

# 3. Проверить прогресс вызова
curl -X GET "http://localhost:8000/gamification/challenges" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Сценарий 3: Использование AI-ассистента для геймификации

```bash
# 1. Создать задачу через AI
curl -X POST "http://localhost:8000/ai/create-task" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "text=СРОЧНО подготовить презентацию до завтра"

# 2. Проверить профиль (должен получить XP за AI-использование)
curl -X GET "http://localhost:8000/gamification/profile" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. Посмотреть статистику по категориям
curl -X GET "http://localhost:8000/gamification/stats/categories" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 💰 Система наград

### Просмотр доступных наград

```bash
# Получить список наград
curl -X GET "http://localhost:8000/gamification/rewards" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Ответ:**
```json
{
  "rewards": [
    {
      "id": "theme_dark",
      "title": "Темная тема",
      "description": "Стильная темная тема оформления",
      "category": "profile",
      "price": 100,
      "is_purchased": false
    },
    {
      "id": "extra_tags",
      "title": "Дополнительные теги",
      "description": "Возможность использовать больше тегов",
      "category": "functional",
      "price": 1000,
      "is_purchased": false
    }
  ]
}
```

### Покупка награды

```bash
# Купить награду
curl -X POST "http://localhost:8000/gamification/rewards/theme_dark/purchase" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Проверить обновленный профиль
curl -X GET "http://localhost:8000/gamification/profile" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Аналитика и отчеты

### Временная аналитика

```bash
# Статистика по дням недели
curl -X GET "http://localhost:8000/gamification/stats/weekly" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Статистика по месяцам
curl -X GET "http://localhost:8000/gamification/stats/monthly" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Категорийная аналитика

```bash
# Статистика по приоритетам
curl -X GET "http://localhost:8000/gamification/stats/priorities" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Статистика по тегам
curl -X GET "http://localhost:8000/gamification/stats/tags" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔧 Интеграция с фронтендом

### JavaScript примеры

```javascript
// Получение профиля геймификации
async function getGamificationProfile() {
  const response = await fetch('/gamification/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Отображение прогресса уровня
function displayLevelProgress(profile) {
  const progressBar = document.querySelector('.xp-progress');
  const progressText = document.querySelector('.xp-text');
  
  const progress = ((profile.current_xp - profile.previous_level_xp) / 
                   (profile.next_level_xp - profile.previous_level_xp)) * 100;
  
  progressBar.style.width = `${progress}%`;
  progressText.textContent = `${profile.current_xp} / ${profile.next_level_xp} XP`;
}

// Обновление настроений
async function updateMood(mood, note) {
  const response = await fetch('/gamification/mood', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ mood, note })
  });
  return await response.json();
}

// Покупка награды
async function purchaseReward(rewardId) {
  const response = await fetch(`/gamification/rewards/${rewardId}/purchase`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}
```

## Игровые механики

### Система комбо

```bash
# Создать несколько задач подряд для получения комбо
for i in {1..5}; do
  curl -X POST "http://localhost:8000/tasks/" \
       -H "Authorization: Bearer YOUR_TOKEN_HERE" \
       -H "Content-Type: application/json" \
       -d "{\"title\": \"Задача $i\", \"description\": \"Описание задачи $i\"}"
done

# Проверить профиль на наличие комбо-бонусов
curl -X GET "http://localhost:8000/gamification/profile" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Ежедневные бонусы

```bash
# Проверить ежедневные бонусы
curl -X GET "http://localhost:8000/gamification/challenges/daily" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Выполнить задачи для получения бонусов
curl -X POST "http://localhost:8000/tasks/" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{"title": "Ежедневная задача", "priority": "medium"}'
```

## Оптимизация и производительность

### Кэширование

```bash
# Проверить статистику кэша
curl -X GET "http://localhost:8000/cache/stats" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Очистить кэш для обновления данных
curl -X DELETE "http://localhost:8000/cache/clear" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Мониторинг

```bash
# Проверить здоровье системы
curl -X GET "http://localhost:8000/health/detailed"

# Получить метрики производительности
curl -X GET "http://localhost:8000/metrics" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Мобильные приложения

### React Native пример

```javascript
// Компонент профиля геймификации
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GamificationProfile = ({ token }) => {
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    fetchProfile();
  }, []);
  
  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:8000/gamification/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };
  
  if (!profile) return <Text>Загрузка...</Text>;
  
  return (
    <View style={styles.container}>
      <Text style={styles.level}>Уровень {profile.level}</Text>
      <View style={styles.xpBar}>
        <View 
          style={[
            styles.xpProgress, 
            { width: `${(profile.current_xp / profile.next_level_xp) * 100}%` }
          ]} 
        />
      </View>
      <Text style={styles.xpText}>
        {profile.current_xp} / {profile.next_level_xp} XP
      </Text>
      <Text style={styles.coins}>🪙 {profile.coins}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  level: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  xpBar: {
    height: 20,
    backgroundColor: '#ddd',
    borderRadius: 10,
    marginVertical: 10
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 10
  },
  xpText: {
    textAlign: 'center',
    marginBottom: 10
  },
  coins: {
    fontSize: 18,
    textAlign: 'center'
  }
});

export default GamificationProfile;
```

## 🔮 Будущие возможности

### Планируемые функции

- **Мультиплеер**: Соревнования между пользователями
- **Кланы**: Командные достижения
- **Сезонные события**: Временные вызовы
- **Интеграция с социальными сетями**

### API расширения

- **WebSocket**: Реальное время обновлений
- **GraphQL**: Гибкие запросы данных
- **Webhooks**: Уведомления о событиях
- **REST API v2**: Улучшенная версия API

## 📝 Заключение

Система геймификации Task Manager предоставляет богатый набор возможностей для:

- **Мотивации** пользователей через достижения
- **Отслеживания** прогресса и продуктивности
- **Награждения** за выполнение задач
- **Анализа** паттернов работы
- **Персонализации** опыта

Все функции доступны через REST API и легко интегрируются с любыми фронтенд-приложениями!
