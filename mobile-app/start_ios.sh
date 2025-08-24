#!/bin/bash

echo "Запуск iOS приложения Task Manager..."

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "Ошибка: package.json не найден. Убедитесь, что вы в директории mobile-app"
    exit 1
fi

# Проверяем Node.js
if ! command -v node &> /dev/null; then
    echo "Ошибка: Node.js не установлен. Установите Node.js и попробуйте снова"
    exit 1
fi

# Проверяем npm
if ! command -v npm &> /dev/null; then
    echo "Ошибка: npm не установлен. Установите npm и попробуйте снова"
    exit 1
fi

# Проверяем macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "Ошибка: iOS разработка возможна только на macOS"
    exit 1
fi

# Проверяем Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "Ошибка: Xcode не установлен. Установите Xcode из App Store"
    exit 1
fi

echo "Проверки пройдены успешно!"

# Устанавливаем зависимости
echo "Установка зависимостей..."
npm install

# Очищаем кэш
echo "Очистка кэша..."
npx react-native start --reset-cache &

# Ждем запуска Metro Bundler
sleep 5

# Запускаем iOS приложение
echo "Запуск iOS приложения..."
npx react-native run-ios --simulator="iPhone 14"

if [ $? -eq 0 ]; then
    echo "iOS приложение запущено!"
else
    echo "Ошибка запуска iOS приложения"
    exit 1
fi

echo "Для остановки Metro Bundler нажмите Ctrl+C"
wait
