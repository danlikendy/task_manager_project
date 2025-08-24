#!/usr/bin/env python3
"""
Web Application Launcher for Task Manager
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import time

PORT = 3000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    web_dir = os.path.join(os.path.dirname(__file__), 'mobile-app', 'web')
    if not os.path.exists(web_dir):
        print(f"Error: Web directory not found: {web_dir}")
        return
    
    os.chdir(web_dir)
    
    print("=" * 60)
    print("TASK MANAGER WEB APPLICATION")
    print("=" * 60)
    print(f"Web directory: {os.getcwd()}")
    print(f"Web server: http://localhost:{PORT}")
    print(f"FastAPI backend: http://localhost:8000")
    print(f"API docs: http://localhost:8000/docs")
    print("=" * 60)
    print("Press Ctrl+C to stop")
    print("=" * 60)
    
    def open_browser():
        time.sleep(2)
        webbrowser.open(f'http://localhost:{PORT}')
    
    import threading
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    try:
        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            print(f"Web server started on port {PORT}")
            print("Opening browser...")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nWeb server stopped")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
