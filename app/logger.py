import logging
import sys
from datetime import datetime
from pathlib import Path
from logging.handlers import RotatingFileHandler

def setup_logger(name: str = "task_manager", log_level: str = "INFO"):
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, log_level.upper()))
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    file_handler = RotatingFileHandler(
        logs_dir / "task_manager.log",
        maxBytes=10*1024*1024,
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

def log_request(logger, method: str, path: str, status_code: int, duration: float, user: str = None):
    log_data = {
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration": f"{duration:.3f}s",
        "user": user or "anonymous",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if status_code >= 400:
        logger.warning(f"Request failed: {log_data}")
    else:
        logger.info(f"Request completed: {log_data}")

def log_error(logger, error: Exception, context: str = None):
    logger.error(f"Error in {context or 'unknown context'}: {str(error)}", exc_info=True)

def log_security_event(logger, event_type: str, user: str = None, details: str = None):
    security_data = {
        "event_type": event_type,
        "user": user or "unknown",
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    }
    logger.warning(f"Security event: {security_data}")

def log_performance(logger, operation: str, duration: float, details: str = None):
    perf_data = {
        "operation": operation,
        "duration": f"{duration:.3f}s",
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    }
    logger.info(f"Performance metric: {perf_data}")
