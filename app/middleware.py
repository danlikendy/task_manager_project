import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.logger import log_request, log_error, log_security_event

class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, logger):
        super().__init__(app)
        self.logger = logger
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        try:
            response = await call_next(request)
            duration = time.time() - start_time
            
            user = "anonymous"
            if hasattr(request.state, "user"):
                user = request.state.user.username
            
            log_request(
                self.logger,
                method=request.method,
                path=str(request.url.path),
                status_code=response.status_code,
                duration=duration,
                user=user
            )
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            log_error(self.logger, e, f"Request to {request.url.path}")
            raise

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, logger):
        super().__init__(app)
        self.logger = logger
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        if self._is_suspicious_request(request, client_ip, user_agent):
            log_security_event(
                self.logger,
                "suspicious_request",
                details=f"IP: {client_ip}, User-Agent: {user_agent}, Path: {request.url.path}"
            )
        
        response = await call_next(request)
        return response
    
    def _is_suspicious_request(self, request: Request, client_ip: str, user_agent: str) -> bool:
        suspicious_paths = ["/admin", "/config", "/.env", "/wp-admin"]
        suspicious_user_agents = ["sqlmap", "nikto", "nmap", "scanner"]
        
        if any(path in str(request.url.path) for path in suspicious_paths):
            return True
        
        if any(agent.lower() in user_agent.lower() for agent in suspicious_user_agents):
            return True
        
        return False

class PerformanceMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, logger):
        super().__init__(app)
        self.logger = logger
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        response = await call_next(request)
        
        duration = time.time() - start_time
        
        if duration > 1.0:
            log_performance(
                self.logger,
                f"{request.method} {request.url.path}",
                duration,
                f"Slow request from {request.client.host if request.client else 'unknown'}"
            )
        
        return response
