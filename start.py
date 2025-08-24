#!/usr/bin/env python3
"""
Task Manager API - Original Full Version Launcher
"""

import uvicorn
from app.main import app

if __name__ == "__main__":
    print("Starting ORIGINAL Full Task Manager API...")
    print("API will be available at: http://localhost:8000")
    print("Documentation: http://localhost:8000/docs")
    print("Features: AI Assistant, Gamification, Notifications, Analytics, Voice Control, Themes")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
