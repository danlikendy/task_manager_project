# Enhanced Gamification System

## Overview

The enhanced gamification system provides a comprehensive reward and achievement system for the Task Manager application, encouraging user engagement and productivity through game-like mechanics.

## Features

### Achievement System
- **10 Achievement Types**: Task completion, streaks, productivity, quality, learning, and more
- **Rarity Levels**: Common, Uncommon, Rare, Epic
- **Progress Tracking**: Real-time progress monitoring for each achievement
- **Automatic Unlocking**: Achievements unlock automatically when requirements are met

### Challenge System
- **Daily Challenges**: New challenges every day
- **Weekly Challenges**: Longer-term goals
- **Special Events**: Time-limited challenges
- **Reward System**: XP and coins for completing challenges

### Reward System
- **Cosmetic Rewards**: Themes, color schemes, visual enhancements
- **Functional Rewards**: Feature unlocks, advanced capabilities
- **Boost Rewards**: Temporary XP and coin multipliers
- **Purchase System**: Spend coins to unlock rewards

### Level System
- **Progressive XP**: Each level requires more XP than the previous
- **Level Bonuses**: Bonus coins for leveling up
- **Unlimited Growth**: No level cap

## Achievement Types

### Task Completion
- **First Steps**: Complete your first task (50 XP, 10 coins)
- **Task Master**: Complete 100 tasks (500 XP, 100 coins)
- **Productivity Guru**: Complete 1000 tasks (2000 XP, 500 coins)

### Streaks
- **Consistent**: Complete tasks for 7 days in a row (200 XP, 50 coins)
- **Unstoppable**: Complete tasks for 30 days in a row (1000 XP, 250 coins)

### Productivity
- **Speed Demon**: Complete 5 tasks in one day (150 XP, 30 coins)
- **Overachiever**: Complete 10 tasks in one day (400 XP, 80 coins)

### Quality
- **Perfectionist**: Complete 50 high-priority tasks (300 XP, 60 coins)

### Learning
- **Explorer**: Use AI assistant 10 times (100 XP, 20 coins)

## Challenge Types

### Daily Challenges
- **Daily Grind**: Complete 3 tasks today (100 XP, 25 coins)
- **Priority Focus**: Complete 2 high-priority tasks today (150 XP, 35 coins)

### Weekly Challenges
- **Week Warrior**: Complete 20 tasks this week (500 XP, 100 coins)

## Reward Types

### Cosmetic Rewards
- **Golden Theme**: Unlock golden color scheme (100 coins)
- **Dark Mode Pro**: Unlock advanced dark mode (200 coins)

### Functional Rewards
- **Task Templates**: Unlock task templates feature (300 coins)
- **Advanced Analytics**: Unlock detailed productivity analytics (500 coins)

### Boost Rewards
- **XP Booster**: 2x XP for 24 hours (150 coins)
- **Coin Multiplier**: 2x coins for 24 hours (200 coins)

## API Endpoints

### Profile
- `GET /gamification/profile` - Get user's gamification profile

### Achievements
- `GET /gamification/achievements` - Get all achievements with progress

### Challenges
- `GET /gamification/challenges` - Get available challenges
- `POST /gamification/complete-challenge/{challenge_id}` - Complete a challenge

### Rewards
- `GET /gamification/rewards` - Get available rewards
- `POST /gamification/purchase-reward/{reward_id}` - Purchase a reward

### Leaderboard
- `GET /gamification/leaderboard?limit=10` - Get top users

### Events
- `POST /gamification/trigger-event` - Trigger gamification events

## Integration

### Automatic Triggers
- **Task Creation**: +10 XP, achievement check
- **Task Completion**: +20 XP, +10 XP for high priority, achievement check
- **AI Usage**: Achievement progress tracking

### Manual Triggers
- **Challenge Completion**: XP and coin rewards
- **Reward Purchase**: Feature unlocks and boosts

## Usage Examples

### Complete a Challenge
```bash
curl -X POST "http://localhost:8000/gamification/complete-challenge/{challenge_id}" \
  -H "Authorization: Bearer {token}"
```

### Purchase a Reward
```bash
curl -X POST "http://localhost:8000/gamification/purchase-reward/{reward_id}" \
  -H "Authorization: Bearer {token}"
```

### Trigger an Event
```bash
curl -X POST "http://localhost:8000/gamification/trigger-event" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "ai_used",
    "event_data": {
      "value": 1,
      "xp": 5
    }
  }'
```

## Testing

Run the enhanced gamification test:
```bash
python test_gamification_enhanced.py
```

## Future Enhancements

- **Team Challenges**: Collaborative goals and rewards
- **Seasonal Events**: Special time-limited content
- **Custom Achievements**: User-defined goals
- **Social Features**: Share achievements, compare progress
- **Mobile Notifications**: Achievement and challenge alerts
