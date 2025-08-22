import subprocess
import sys

def run_tests_with_coverage():
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/", 
            "--cov=app", 
            "--cov-report=html", 
            "--cov-report=term-missing",
            "-v"
        ], capture_output=True, text=True)
        
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
            
        return result.returncode == 0
        
    except Exception as e:
        print(f"Ошибка при запуске тестов: {e}")
        return False

if __name__ == "__main__":
    success = run_tests_with_coverage()
    sys.exit(0 if success else 1)
