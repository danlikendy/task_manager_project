import http.server
import socketserver
import webbrowser
import os

PORT = 3000

class SimpleHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/test.html'
        return super().do_GET()

def run_server():
    print("Запуск веб-версии Task Manager Mobile...")
    print(f"Откройте браузер: http://localhost:{PORT}")
    
    with socketserver.TCPServer(("", PORT), SimpleHTTPRequestHandler) as httpd:
        print(f"Сервер запущен на порту {PORT}")
        print("Автоматически открываю браузер...")
        
        # Открываем браузер
        webbrowser.open(f'http://localhost:{PORT}')
        
        print("Нажмите Ctrl+C для остановки")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nСервер остановлен")

if __name__ == "__main__":
    run_server()
