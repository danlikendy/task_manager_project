import re
import random
from typing import List, Dict, Optional, Tuple
from datetime import datetime, date, timedelta
from app.models import TaskCreate, TaskStatus, TaskPriority
from app.logger import setup_logger

logger = setup_logger("ai_assistant")

class AIAssistant:
    """
    AI-ассистент для умного управления задачами
    """
    
    def __init__(self):
        self.priority_keywords = {
            TaskPriority.CRITICAL: ["критично", "критический", "critical", "катастрофа"],
            TaskPriority.URGENT: ["срочно", "urgent", "asap", "важно", "горит", "deadline"],
            TaskPriority.HIGH: ["высокий", "high", "приоритет", "скоро", "быстро"],
            TaskPriority.MEDIUM: ["средний", "medium", "обычно", "планово"],
            TaskPriority.LOW: ["низкий", "low", "когда-нибудь", "не спешно", "может подождать", "не важно"]
        }
        
        self.tag_patterns = {
            "работа": ["работа", "офис", "проект", "встреча", "клиент", "отчет"],
            "личное": ["дом", "семья", "здоровье", "спорт", "хобби"],
            "покупки": ["купить", "магазин", "заказать", "оплатить"],
            "звонки": ["позвонить", "связаться", "созвониться"],
            "документы": ["документ", "справка", "подписать", "оформить"],
            "изучение": ["изучить", "прочитать", "курс", "обучение"],
            "дизайн": ["дизайн", "макет", "ui", "ux", "интерфейс"],
            "разработка": ["код", "программирование", "api", "баг", "фича"]
        }
        
        self.motivational_quotes = [
            "Каждая завершенная задача - шаг к успеху!",
            "Продуктивность - это привычка, а не событие.",
            "Маленькие шаги ведут к большим достижениям.",
            "Сегодня отличный день для продуктивности!",
            "Ваша настойчивость впечатляет!",
            "Еще одна задача выполнена - вы молодец!",
            "Фокус на цели приближает к результату.",
            "Каждое действие приближает к мечте!"
        ]
    
    def analyze_text_and_create_task(self, text: str, user_context: Optional[Dict] = None) -> TaskCreate:
        """
        Анализирует текст и создает умную задачу
        """
        logger.info(f"AI анализирует текст: {text[:50]}...")
        
        # Извлекаем название задачи
        title = self._extract_title(text)
        
        # Определяем приоритет
        priority = self._detect_priority(text)
        
        # Генерируем теги
        tags = self._generate_tags(text)
        
        # Определяем дату выполнения
        due_date = self._extract_due_date(text)
        
        # Создаем описание
        description = self._enhance_description(text, title)
        
        task = TaskCreate(
            title=title,
            description=description,
            priority=priority,
            tags=tags,
            due_date=due_date,
            status=TaskStatus.CREATED
        )
        
        logger.info(f"AI создал задачу: {title} с приоритетом {priority.value}")
        return task
    
    def _extract_title(self, text: str) -> str:
        """Извлекает название задачи из текста"""
        # Удаляем лишние слова и форматируем
        title = text.strip()
        
        # Если текст очень длинный, берем первое предложение
        sentences = re.split(r'[.!?]+', title)
        if sentences:
            title = sentences[0].strip()
        
        # Ограничиваем длину
        if len(title) > 100:
            title = title[:97] + "..."
        
        # Капитализация
        title = title.capitalize()
        
        return title
    
    def _detect_priority(self, text: str) -> TaskPriority:
        """Определяет приоритет на основе ключевых слов"""
        text_lower = text.lower()
        
        # Ищем ключевые слова для каждого приоритета
        for priority, keywords in self.priority_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return priority
        
        # Если дата выполнения близко - повышаем приоритет
        due_date = self._extract_due_date(text)
        if due_date:
            days_until = (due_date - date.today()).days
            if days_until <= 1:
                return TaskPriority.URGENT
            elif days_until <= 3:
                return TaskPriority.HIGH
        
        # По умолчанию средний приоритет
        return TaskPriority.MEDIUM
    
    def _generate_tags(self, text: str) -> List[str]:
        """Генерирует теги на основе содержания"""
        text_lower = text.lower()
        generated_tags = []
        
        # Ищем соответствия по паттернам
        for tag, patterns in self.tag_patterns.items():
            for pattern in patterns:
                if pattern in text_lower:
                    generated_tags.append(tag)
                    break
        
        # Добавляем теги на основе времени
        now = datetime.now()
        if now.weekday() < 5:  # Будний день
            if "работа" not in generated_tags and any(word in text_lower for word in ["проект", "встреча", "отчет"]):
                generated_tags.append("работа")
        
        # Ограничиваем количество тегов
        return generated_tags[:5]
    
    def _extract_due_date(self, text: str) -> Optional[date]:
        """Извлекает дату выполнения из текста"""
        text_lower = text.lower()
        today = date.today()
        
        # Относительные даты
        if any(word in text_lower for word in ["сегодня", "today"]):
            return today
        elif any(word in text_lower for word in ["завтра", "tomorrow"]):
            return today + timedelta(days=1)
        elif any(word in text_lower for word in ["послезавтра"]):
            return today + timedelta(days=2)
        elif any(word in text_lower for word in ["на неделе", "this week"]):
            return today + timedelta(days=7-today.weekday())
        elif any(word in text_lower for word in ["в понедельник", "monday"]):
            days_ahead = 0 - today.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            return today + timedelta(days=days_ahead)
        
        # Поиск дат в формате DD.MM или DD/MM
        date_patterns = [
            r'\b(\d{1,2})[./](\d{1,2})\b',
            r'\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b'
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            if matches:
                try:
                    if len(matches[0]) == 2:  # DD.MM
                        day, month = map(int, matches[0])
                        year = today.year
                        if month < today.month or (month == today.month and day < today.day):
                            year += 1
                        return date(year, month, day)
                    elif len(matches[0]) == 3:  # DD.MM.YYYY
                        day, month, year = map(int, matches[0])
                        return date(year, month, day)
                except ValueError:
                    continue
        
        return None
    
    def _enhance_description(self, original_text: str, title: str) -> Optional[str]:
        """Улучшает описание задачи"""
        if len(original_text) <= len(title) + 10:
            return None
        
        # Если исходный текст длиннее названия, используем его как описание
        description = original_text.strip()
        
        # Добавляем контекст
        enhancement = self._add_context_to_description(description)
        if enhancement:
            description += f"\n\n{enhancement}"
        
        return description
    
    def _add_context_to_description(self, text: str) -> Optional[str]:
        """Добавляет контекстную информацию к описанию"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["встреча", "звонок", "созвон"]):
            return "Не забудьте подготовить agenda и проверить техническую связь."
        elif any(word in text_lower for word in ["документ", "справка", "оформить"]):
            return "Уточните требуемые документы и сроки их предоставления."
        elif any(word in text_lower for word in ["код", "программирование", "разработка"]):
            return "Рассмотрите возможность разбить задачу на подзадачи для лучшего контроля."
        elif any(word in text_lower for word in ["изучить", "прочитать", "курс"]):
            return "Установите конкретные цели обучения и выделите время для практики."
        
        return None
    
    def generate_subtasks(self, main_task_text: str) -> List[str]:
        """Генерирует подзадачи для основной задачи"""
        text_lower = main_task_text.lower()
        subtasks = []
        
        if any(word in text_lower for word in ["проект", "разработка"]):
            subtasks.extend([
                "Провести анализ требований",
                "Создать техническое задание",
                "Разработать план выполнения",
                "Выполнить основную работу",
                "Провести тестирование",
                "Подготовить документацию"
            ])
        elif any(word in text_lower for word in ["встреча", "совещание"]):
            subtasks.extend([
                "Подготовить agenda встречи",
                "Отправить приглашения участникам",
                "Подготовить материалы для презентации",
                "Провести встречу",
                "Составить протокол встречи"
            ])
        elif any(word in text_lower for word in ["изучить", "курс", "обучение"]):
            subtasks.extend([
                "Найти и выбрать учебные материалы",
                "Составить план изучения",
                "Изучить теоретическую часть",
                "Выполнить практические задания",
                "Закрепить полученные знания"
            ])
        elif any(word in text_lower for word in ["покупки", "купить"]):
            subtasks.extend([
                "Составить список необходимого",
                "Сравнить цены в разных магазинах",
                "Совершить покупку",
                "Проверить качество товара"
            ])
        
        return subtasks[:4]  # Ограничиваем количество подзадач
    
    def get_productivity_insights(self, user_stats: Dict) -> Dict[str, str]:
        """Генерирует инсайты о продуктивности пользователя"""
        insights = {}
        
        total_tasks = user_stats.get("total_tasks", 0)
        completed_tasks = user_stats.get("completed_tasks", 0)
        completion_rate = user_stats.get("completion_rate", 0)
        
        # Анализ завершенности
        if completion_rate >= 80:
            insights["completion"] = "Отличная работа! Вы выполняете большинство своих задач."
        elif completion_rate >= 60:
            insights["completion"] = "Хорошие результаты! Попробуйте планировать меньше задач для повышения качества."
        else:
            insights["completion"] = "Рассмотрите возможность разбития крупных задач на более мелкие."
        
        # Анализ активности
        if total_tasks > 50:
            insights["activity"] = "Вы очень активный пользователь! Не забывайте делать перерывы."
        elif total_tasks > 20:
            insights["activity"] = "Отличная активность в планировании задач!"
        else:
            insights["activity"] = "Попробуйте использовать систему более активно для лучших результатов."
        
        # Мотивационное сообщение
        insights["motivation"] = random.choice(self.motivational_quotes)
        
        return insights
    
    def suggest_priority_optimization(self, tasks_data: List[Dict]) -> List[str]:
        """Предлагает оптимизацию приоритетов задач"""
        suggestions = []
        
        urgent_count = sum(1 for task in tasks_data if task.get("priority") == TaskPriority.URGENT.value)
        overdue_count = sum(1 for task in tasks_data if task.get("status") == "просрочено")
        
        if urgent_count > 5:
            suggestions.append("У вас много срочных задач. Рассмотрите возможность делегирования или переноса некоторых.")
        
        if overdue_count > 0:
            suggestions.append(f"У вас {overdue_count} просроченных задач. Рекомендуется пересмотреть их приоритеты.")
        
        # Анализ распределения по дням недели
        today_tasks = sum(1 for task in tasks_data if task.get("due_date") == date.today().isoformat())
        if today_tasks > 8:
            suggestions.append("На сегодня запланировано много задач. Рассмотрите перенос некоторых на завтра.")
        
        if not suggestions:
            suggestions.append("Ваше планирование выглядит сбалансированным!")
        
        return suggestions
    
    def generate_daily_plan(self, tasks_data: List[Dict]) -> Dict[str, List[str]]:
        """Генерирует план на день"""
        plan = {
            "morning": [],
            "afternoon": [],
            "evening": []
        }
        
        # Сортируем задачи по приоритету
        sorted_tasks = sorted(tasks_data, key=lambda x: {
            TaskPriority.CRITICAL.value: 0,
            TaskPriority.URGENT.value: 1,
            TaskPriority.HIGH.value: 2,
            TaskPriority.MEDIUM.value: 3,
            TaskPriority.LOW.value: 4
        }.get(x.get("priority"), 3))
        
        # Распределяем задачи по времени
        for i, task in enumerate(sorted_tasks[:9]):  # Максимум 9 задач в день
            if i < 3:
                plan["morning"].append(task["title"])
            elif i < 6:
                plan["afternoon"].append(task["title"])
            else:
                plan["evening"].append(task["title"])
        
        return plan
    
    def get_smart_reminder_text(self, task_data: Dict) -> str:
        """Генерирует умный текст напоминания"""
        title = task_data.get("title", "задача")
        priority = task_data.get("priority", "medium")
        due_date = task_data.get("due_date")
        
        if due_date:
            try:
                due_date_obj = datetime.fromisoformat(due_date).date()
                days_left = (due_date_obj - date.today()).days
                
                if days_left == 0:
                    urgency = "сегодня"
                elif days_left == 1:
                    urgency = "завтра"
                elif days_left < 0:
                    urgency = f"просрочена на {abs(days_left)} дн."
                else:
                    urgency = f"через {days_left} дн."
            except:
                urgency = "скоро"
        else:
            urgency = ""
        
        priority_emoji = {
            TaskPriority.CRITICAL.value: "CRITICAL",
            TaskPriority.URGENT.value: "URGENT",
            TaskPriority.HIGH.value: "HIGH",
            TaskPriority.MEDIUM.value: "MEDIUM",
            TaskPriority.LOW.value: "LOW"
        }.get(priority, "MEDIUM")
        
        reminder_templates = [
            f"{priority_emoji} Напоминание: {title}",
            f"⏰ Не забудьте: {title}",
            f"Время для: {title}",
            f"Пора выполнить: {title}"
        ]
        
        base_reminder = random.choice(reminder_templates)
        
        if urgency:
            base_reminder += f" ({urgency})"
        
        return base_reminder

# Глобальный экземпляр AI-ассистента
ai_assistant = AIAssistant()
