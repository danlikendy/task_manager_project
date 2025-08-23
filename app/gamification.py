import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from enum import Enum
import random

class AchievementType(Enum):
    TASK_COMPLETION = "task_completion"
    STREAK = "streak"
    PRODUCTIVITY = "productivity"
    COLLABORATION = "collaboration"
    LEARNING = "learning"
    CREATIVITY = "creativity"
    CONSISTENCY = "consistency"
    SPEED = "speed"
    QUALITY = "quality"
    INNOVATION = "innovation"

class ChallengeType(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    SPECIAL = "special"

class RewardType(Enum):
    COSMETIC = "cosmetic"
    FUNCTIONAL = "functional"
    BOOST = "boost"
    UNLOCK = "unlock"

class Achievement:
    def __init__(self, name: str, description: str, achievement_type: AchievementType, 
                 rarity: str, xp_reward: int, coin_reward: int, requirements: Dict):
        self.id = str(uuid.uuid4())
        self.name = name
        self.description = description
        self.achievement_type = achievement_type
        self.rarity = rarity
        self.xp_reward = xp_reward
        self.coin_reward = coin_reward
        self.requirements = requirements
        self.unlocked_at: Optional[datetime] = None
        self.progress = 0
        self.max_progress = requirements.get('target', 1)

class Challenge:
    def __init__(self, name: str, description: str, challenge_type: ChallengeType,
                 requirements: Dict, rewards: Dict, start_date: datetime, end_date: datetime):
        self.id = str(uuid.uuid4())
        self.name = name
        self.description = description
        self.challenge_type = challenge_type
        self.requirements = requirements
        self.rewards = rewards
        self.start_date = start_date
        self.end_date = end_date
        self.completed = False
        self.progress = 0
        self.max_progress = requirements.get('target', 1)

class Reward:
    def __init__(self, name: str, description: str, reward_type: RewardType,
                 cost: int, effects: Dict, rarity: str):
        self.id = str(uuid.uuid4())
        self.name = name
        self.description = description
        self.reward_type = reward_type
        self.cost = cost
        self.effects = effects
        self.rarity = rarity
        self.purchased = False

class GamificationService:
    def __init__(self):
        self.achievements: List[Achievement] = []
        self.challenges: List[Challenge] = []
        self.rewards: List[Reward] = []
        self.user_profiles: Dict[str, Dict] = {}
        self._initialize_achievements()
        self._initialize_challenges()
        self._initialize_rewards()

    def _initialize_achievements(self):
        # Task Completion Achievements
        self.achievements.append(Achievement(
            "First Steps", "Complete your first task", 
            AchievementType.TASK_COMPLETION, "common", 50, 10,
            {"target": 1, "type": "tasks_completed"}
        ))
        
        self.achievements.append(Achievement(
            "Task Master", "Complete 100 tasks", 
            AchievementType.TASK_COMPLETION, "rare", 500, 100,
            {"target": 100, "type": "tasks_completed"}
        ))
        
        self.achievements.append(Achievement(
            "Productivity Guru", "Complete 1000 tasks", 
            AchievementType.TASK_COMPLETION, "epic", 2000, 500,
            {"target": 1000, "type": "tasks_completed"}
        ))

        # Streak Achievements
        self.achievements.append(Achievement(
            "Consistent", "Complete tasks for 7 days in a row", 
            AchievementType.STREAK, "uncommon", 200, 50,
            {"target": 7, "type": "daily_streak"}
        ))
        
        self.achievements.append(Achievement(
            "Unstoppable", "Complete tasks for 30 days in a row", 
            AchievementType.STREAK, "epic", 1000, 250,
            {"target": 30, "type": "daily_streak"}
        ))

        # Productivity Achievements
        self.achievements.append(Achievement(
            "Speed Demon", "Complete 5 tasks in one day", 
            AchievementType.PRODUCTIVITY, "uncommon", 150, 30,
            {"target": 5, "type": "tasks_per_day"}
        ))
        
        self.achievements.append(Achievement(
            "Overachiever", "Complete 10 tasks in one day", 
            AchievementType.PRODUCTIVITY, "rare", 400, 80,
            {"target": 10, "type": "tasks_per_day"}
        ))

        # Quality Achievements
        self.achievements.append(Achievement(
            "Perfectionist", "Complete 50 high-priority tasks", 
            AchievementType.QUALITY, "rare", 300, 60,
            {"target": 50, "type": "high_priority_tasks"}
        ))

        # Learning Achievements
        self.achievements.append(Achievement(
            "Explorer", "Use AI assistant 10 times", 
            AchievementType.LEARNING, "uncommon", 100, 20,
            {"target": 10, "type": "ai_usage"}
        ))

    def _initialize_challenges(self):
        # Daily Challenges
        today = datetime.now()
        tomorrow = today + timedelta(days=1)
        
        self.challenges.append(Challenge(
            "Daily Grind", "Complete 3 tasks today", 
            ChallengeType.DAILY, {"target": 3, "type": "tasks_completed"},
            {"xp": 100, "coins": 25}, today, tomorrow
        ))
        
        self.challenges.append(Challenge(
            "Priority Focus", "Complete 2 high-priority tasks today", 
            ChallengeType.DAILY, {"target": 2, "type": "high_priority_tasks"},
            {"xp": 150, "coins": 35}, today, tomorrow
        ))

        # Weekly Challenges
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=7)
        
        self.challenges.append(Challenge(
            "Week Warrior", "Complete 20 tasks this week", 
            ChallengeType.WEEKLY, {"target": 20, "type": "tasks_completed"},
            {"xp": 500, "coins": 100}, week_start, week_end
        ))

    def _initialize_rewards(self):
        # Cosmetic Rewards
        self.rewards.append(Reward(
            "Golden Theme", "Unlock golden color scheme", 
            RewardType.COSMETIC, 100, {"theme": "golden"}, "uncommon"
        ))
        
        self.rewards.append(Reward(
            "Dark Mode Pro", "Unlock advanced dark mode", 
            RewardType.COSMETIC, 200, {"theme": "dark_pro"}, "rare"
        ))

        # Functional Rewards
        self.rewards.append(Reward(
            "Task Templates", "Unlock task templates feature", 
            RewardType.FUNCTIONAL, 300, {"feature": "templates"}, "rare"
        ))
        
        self.rewards.append(Reward(
            "Advanced Analytics", "Unlock detailed productivity analytics", 
            RewardType.FUNCTIONAL, 500, {"feature": "analytics"}, "epic"
        ))

        # Boost Rewards
        self.rewards.append(Reward(
            "XP Booster", "2x XP for 24 hours", 
            RewardType.BOOST, 150, {"boost": "xp_2x", "duration": 24}, "uncommon"
        ))
        
        self.rewards.append(Reward(
            "Coin Multiplier", "2x coins for 24 hours", 
            RewardType.BOOST, 200, {"boost": "coins_2x", "duration": 24}, "rare"
        ))

    def get_user_profile(self, user_id: str) -> Dict:
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {
                "level": 1,
                "xp": 0,
                "coins": 0,
                "achievements": [],
                "challenges_completed": [],
                "rewards_purchased": [],
                "daily_streak": 0,
                "last_activity": datetime.now(),
                "stats": {
                    "tasks_completed": 0,
                    "tasks_created": 0,
                    "ai_usage": 0,
                    "high_priority_tasks": 0
                }
            }
        return self.user_profiles[user_id]

    def add_xp(self, user_id: str, xp_amount: int) -> Dict:
        profile = self.get_user_profile(user_id)
        profile["xp"] += xp_amount
        
        # Check for level up
        new_level = self._calculate_level(profile["xp"])
        if new_level > profile["level"]:
            profile["level"] = new_level
            profile["coins"] += new_level * 10  # Bonus coins for level up
            return {
                "leveled_up": True,
                "new_level": new_level,
                "bonus_coins": new_level * 10,
                "total_xp": profile["xp"]
            }
        
        return {
            "leveled_up": False,
            "current_level": profile["level"],
            "total_xp": profile["xp"]
        }

    def _calculate_level(self, xp: int) -> int:
        # Simple level calculation: each level requires level * 100 XP
        level = 1
        required_xp = 100
        
        while xp >= required_xp:
            xp -= required_xp
            level += 1
            required_xp = level * 100
        
        return level

    def check_achievements(self, user_id: str, action: str, value: int = 1) -> List[Dict]:
        profile = self.get_user_profile(user_id)
        unlocked_achievements = []
        
        for achievement in self.achievements:
            if achievement.id in profile["achievements"]:
                continue  # Already unlocked
                
            if self._check_achievement_requirements(achievement, profile, action, value):
                achievement.unlocked_at = datetime.now()
                profile["achievements"].append(achievement.id)
                
                # Add rewards
                profile["xp"] += achievement.xp_reward
                profile["coins"] += achievement.coin_reward
                
                unlocked_achievements.append({
                    "id": achievement.id,
                    "name": achievement.name,
                    "description": achievement.description,
                    "rarity": achievement.rarity,
                    "xp_reward": achievement.xp_reward,
                    "coin_reward": achievement.coin_reward
                })
        
        return unlocked_achievements

    def _check_achievement_requirements(self, achievement: Achievement, profile: Dict, 
                                     action: str, value: int) -> bool:
        req_type = achievement.requirements.get("type")
        
        if req_type == "tasks_completed":
            profile["stats"]["tasks_completed"] += value
            return profile["stats"]["tasks_completed"] >= achievement.requirements["target"]
        
        elif req_type == "daily_streak":
            if action == "task_completed":
                profile["daily_streak"] += 1
            return profile["daily_streak"] >= achievement.requirements["target"]
        
        elif req_type == "tasks_per_day":
            # This would need daily tracking implementation
            return False
        
        elif req_type == "high_priority_tasks":
            if action == "high_priority_completed":
                profile["stats"]["high_priority_tasks"] += value
            return profile["stats"]["high_priority_tasks"] >= achievement.requirements["target"]
        
        elif req_type == "ai_usage":
            if action == "ai_used":
                profile["stats"]["ai_usage"] += value
            return profile["stats"]["ai_usage"] >= achievement.requirements["target"]
        
        return False

    def get_available_challenges(self, user_id: str) -> List[Challenge]:
        profile = self.get_user_profile(user_id)
        now = datetime.now()
        
        available_challenges = []
        for challenge in self.challenges:
            if (challenge.id not in profile["challenges_completed"] and
                now >= challenge.start_date and now <= challenge.end_date):
                available_challenges.append(challenge)
        
        return available_challenges

    def purchase_reward(self, user_id: str, reward_id: str) -> Dict:
        profile = self.get_user_profile(user_id)
        reward = next((r for r in self.rewards if r.id == reward_id), None)
        
        if not reward:
            return {"success": False, "error": "Reward not found"}
        
        if reward.purchased:
            return {"success": False, "error": "Reward already purchased"}
        
        if profile["coins"] < reward.cost:
            return {"success": False, "error": "Not enough coins"}
        
        profile["coins"] -= reward.cost
        profile["rewards_purchased"].append(reward_id)
        reward.purchased = True
        
        return {
            "success": True,
            "reward_name": reward.name,
            "coins_spent": reward.cost,
            "remaining_coins": profile["coins"]
        }

    def get_leaderboard(self, limit: int = 10) -> List[Dict]:
        sorted_profiles = sorted(
            self.user_profiles.items(),
            key=lambda x: (x[1]["level"], x[1]["xp"]),
            reverse=True
        )
        
        leaderboard = []
        for user_id, profile in sorted_profiles[:limit]:
            leaderboard.append({
                "user_id": user_id,
                "level": profile["level"],
                "xp": profile["xp"],
                "coins": profile["coins"],
                "achievements_count": len(profile["achievements"])
            })
        
        return leaderboard

# Global instance
gamification_service = GamificationService()
