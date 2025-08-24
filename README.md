# Task Manager API

Complete and clean FastAPI application for task management with web interface.

## Quick Start (Windows)

**Double-click: `start_app.bat`**
- This will free ports, install dependencies, and launch the complete application
- FastAPI backend on port 8000
- Web frontend on port 3000

## Project Structure

```
task_manager_project/
├── app/
│   ├── main.py             # Main FastAPI application (full version)
│   ├── models.py           # Data models
│   ├── database.py         # Database operations
│   ├── ai_assistant.py     # AI assistant functionality
│   ├── analytics.py        # Analytics and reporting
│   ├── collaboration.py    # Collaboration features
│   ├── gamification.py     # Gamification system
│   ├── integrations.py     # Third-party integrations
│   ├── smart_notifications.py # Smart notifications
│   ├── themes.py           # Theme customization
│   └── voice_control.py    # Voice control features
├── mobile-app/web/
│   └── index.html          # Complete web application
├── start.py                 # FastAPI launcher
├── start_web.py            # Web app launcher
├── start_app.bat           # Complete application launcher
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

## Complete API Endpoints

### Root & Health
- `GET /` - API information
- `GET /health` - Health check

### Task Management (CRUD)
- `POST /tasks/` - Create new task
- `GET /tasks/` - Get all tasks (with filters)
- `GET /tasks/{task_id}` - Get specific task
- `PUT /tasks/{task_id}` - Update task
- `DELETE /tasks/{task_id}` - Delete task

### Task Queries
- `GET /tasks/stats` - Task statistics
- `GET /tasks/search` - Search tasks by query
- `GET /tasks/status/{status}` - Filter tasks by status
- `GET /tasks/priority/{priority}` - Filter tasks by priority

### AI Assistant
- `POST /ai/assist` - Get AI assistance
- `POST /ai/create-task` - AI-powered task creation
- `POST /ai/subtasks` - Generate subtasks
- `POST /ai/productivity-analysis` - Productivity insights

### Gamification
- `GET /gamification/profile` - User profile
- `GET /gamification/achievements` - User achievements
- `GET /gamification/challenges` - Available challenges
- `GET /gamification/rewards` - User rewards
- `GET /gamification/leaderboard` - Leaderboard

### Notifications
- `POST /notifications/send` - Send notification
- `GET /notifications` - Get user notifications

### Themes
- `GET /themes` - Available themes
- `POST /themes` - Set user theme

### Voice Control
- `POST /voice/command` - Process voice command

### Analytics
- `GET /analytics/productivity` - Productivity metrics
- `GET /analytics/tasks` - Task analytics

## Web Application Features

**Complete Application (index.html):**
- Modern, responsive interface
- Dark/light theme switching
- Real-time notifications
- Complete task management (CRUD)
- AI assistant integration
- Gamification system
- Advanced analytics
- Voice control support
- Theme customization

## How It Works

1. **FastAPI Backend** (port 8000) - Provides REST API with all features
2. **Web Frontend** (port 3000) - HTML/JavaScript interface
3. **Real-time Connection** - Frontend calls backend API
4. **Full CRUD Operations** - Complete task management
5. **Advanced Features** - AI, gamification, analytics, voice control

## What Was Cleaned Up

1. Removed all unnecessary batch files
2. Removed unused Python modules
3. Removed all emojis from the interface
4. Simplified project structure
5. Kept only essential dependencies
6. Single launcher script (`start_app.bat`)

## Troubleshooting

**Problem: Port already in use**
**Solution: `start_app.bat` automatically frees ports**

**Problem: Dependencies missing**
**Solution: `start_app.bat` automatically installs dependencies**

**Problem: Functions not working**
**Solution: Ensure both API (port 8000) and web app (port 3000) are running**

## Next Steps

1. **Launch everything**: Double-click `start_app.bat`
2. **Open web app**: http://localhost:3000
3. **View API docs**: http://localhost:8000/docs

## Features

- **Task Management**: Full CRUD operations
- **AI Assistant**: Intelligent task creation and analysis
- **Gamification**: Points, achievements, challenges
- **Smart Notifications**: Context-aware alerts
- **Advanced Analytics**: Productivity insights
- **Voice Control**: Voice commands for tasks
- **Theme Customization**: Multiple visual themes
- **Real-time Updates**: Live data synchronization