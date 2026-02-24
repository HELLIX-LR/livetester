# Implementation Plan: LIVE RUSSIA Tester Dashboard

## Overview

Реализация веб-приложения для управления тестировщиками мобильного проекта LIVE RUSSIA. Система включает регистрацию тестеров, административную панель с авторизацией, управление багами, систему рейтинга, интеграцию с Google Sheets, статистику серверов и графики онлайн игроков.

**Технологический стек:**
- Frontend: HTML5, CSS3, vanilla JavaScript (ES6+)
- Backend: Node.js + Express.js
- Database: PostgreSQL
- Cache: Redis
- Integration: Google Sheets API v4
- Auth: bcrypt + express-session

## Tasks

- [x] 1. Инициализация проекта и настройка окружения
  - Создать структуру проекта (backend, frontend, config)
  - Инициализировать package.json с зависимостями (express, pg, redis, bcrypt, express-session, googleapis)
  - Настроить .env файл для конфигурации (DB_HOST, DB_PORT, REDIS_URL, SESSION_SECRET, GOOGLE_SHEETS_CREDENTIALS)
  - Создать .gitignore для node_modules, .env, logs
  - _Requirements: 11.4, 3.4_

- [ ] 2. Настройка базы данных PostgreSQL
  - [x] 2.1 Создать SQL миграции для всех таблиц
    - Создать таблицу testers (id, name, email, nickname, telegram, device_type, os, os_version, status, registration_date, last_activity_date, bugs_count, rating)
    - Создать таблицу bugs (id, title, description, tester_id, priority, status, type, created_at, updated_at, fixed_at)
    - Создать таблицу screenshots (id, bug_id, filename, file_path, file_size, mime_type, uploaded_at)
    - Создать таблицу comments (id, bug_id, author_id, author_name, content, created_at, updated_at, is_edited)
    - Создать таблицу activity_history (id, tester_id, event_type, description, metadata, created_at)
    - Создать таблицу admins (id, username, password_hash, email, created_at, last_login)
    - Создать таблицу notifications (id, type, title, message, is_read, created_at, metadata)
    - Добавить индексы для оптимизации запросов
    - _Requirements: 1.3, 13.1, 20.1, 19.1, 18.1, 11.2, 17.1_


  - [ ]* 2.2 Написать property test для валидации схемы базы данных
    - **Property 3: Valid registration creates tester record**
    - **Validates: Requirements 1.3**

- [x] 3. Настройка Redis для кэширования и сессий
  - Создать модуль подключения к Redis (config/redis.js)
  - Настроить express-session с Redis store
  - Реализовать функции кэширования статистики (TTL: 30s для dashboard, 15s для servers, 60s для online players)
  - _Requirements: 11.6, 5.5, 6.4, 7.4_

- [x] 4. Реализация системы авторизации администраторов
  - [x] 4.1 Создать модель Admin и сервис аутентификации
    - Реализовать функцию хеширования паролей с bcrypt (минимум 10 salt rounds)
    - Создать функцию проверки учетных данных
    - Реализовать создание и управление сессиями (TTL: 24 часа)
    - _Requirements: 11.4, 11.2, 11.6_

  - [x] 4.2 Создать API endpoints для авторизации
    - POST /api/auth/login - вход в систему
    - POST /api/auth/logout - выход из системы
    - GET /api/auth/session - проверка активной сессии
    - _Requirements: 11.2, 11.7_

  - [x] 4.3 Создать middleware для защиты маршрутов
    - Реализовать auth.middleware.js для проверки сессии
    - Добавить редирект на /login для неавторизованных запросов
    - _Requirements: 11.5_

  - [ ]* 4.4 Написать unit tests для системы авторизации
    - Тест валидных учетных данных
    - Тест невалидных учетных данных
    - Тест истечения сессии
    - _Requirements: 11.2, 11.3, 11.6_


- [x] 5. Реализация регистрации тестеров
  - [x] 5.1 Создать модель Tester и сервис регистрации
    - Реализовать валидацию полей (name, email, deviceType, os обязательны)
    - Реализовать проверку формата email
    - Создать функцию создания записи тестера в БД
    - Установить начальные значения (status: 'active', bugs_count: 0, rating: 0)
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.3_

  - [ ]* 5.2 Написать property test для валидации регистрации
    - **Property 1: Registration validation rejects invalid data**
    - **Validates: Requirements 1.2, 1.4**

  - [ ]* 5.3 Написать property test для создания записи тестера
    - **Property 3: Valid registration creates tester record**
    - **Validates: Requirements 1.3**

  - [x] 5.4 Создать API endpoint для регистрации
    - POST /api/testers - регистрация нового тестера
    - Возвращать созданный объект тестера с id
    - _Requirements: 1.3_

  - [ ]* 5.5 Написать unit tests для edge cases
    - Тест дублирующегося email
    - Тест пустых обязательных полей
    - Тест невалидного формата email
    - _Requirements: 1.4, 1.5_

- [x] 6. Интеграция с Google Sheets API
  - [x] 6.1 Настроить OAuth 2.0 аутентификацию
    - Создать сервис googleSheets.service.js
    - Настроить credentials из Google Cloud Console
    - Реализовать функцию аутентификации
    - _Requirements: 3.4_

  - [x] 6.2 Реализовать запись данных в Google Sheets
    - Создать функцию appendTester для добавления строки
    - Маппинг полей в колонки (ID→A, Name→B, Email→C, Nickname→D, Telegram→E, DeviceType→F, OS→G, OSVersion→H, RegistrationDate→I, Status→J)
    - Добавить логирование операций с timestamp
    - _Requirements: 3.1, 3.2, 3.5_


  - [x] 6.3 Реализовать чтение данных из Google Sheets
    - Создать функцию fetchTesters для загрузки всех записей
    - Парсинг строк в объекты тестеров
    - Обработка пустых ячеек
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 6.4 Написать property test для round-trip integrity
    - **Property 19: Google Sheets round-trip integrity**
    - **Validates: Requirements 10.5**

  - [x] 6.5 Реализовать retry механизм при недоступности API
    - Создать таблицу google_sheets_queue для очереди операций
    - Реализовать retry logic с экспоненциальной задержкой (60s, 120s, 240s)
    - Автоматическая повторная попытка при восстановлении соединения
    - _Requirements: 3.3_

  - [ ]* 6.6 Написать unit tests для Google Sheets интеграции
    - Тест успешной записи
    - Тест недоступности API и постановки в очередь
    - Тест парсинга данных с пустыми ячейками
    - _Requirements: 3.3, 10.3_

- [x] 7. Checkpoint - Базовая функциональность
  - Убедиться, что регистрация тестеров работает
  - Проверить синхронизацию с Google Sheets
  - Проверить авторизацию администраторов
  - Спросить пользователя, если возникли вопросы

- [x] 8. Реализация управления багами
  - [x] 8.1 Создать модель Bug и сервис управления
    - Реализовать валидацию полей (title, description, testerId, priority, status, type обязательны)
    - Создать функции CRUD операций (create, read, update, delete)
    - Реализовать проверку enum значений (status, priority, type)
    - Автоматическое обновление updated_at при изменениях
    - _Requirements: 13.1, 13.2, 13.3, 13.5, 13.7, 21.1_


  - [ ]* 8.2 Написать property test для создания бага
    - **Property 28: Bug creation with valid data**
    - **Validates: Requirements 13.1, 13.6, 13.7**

  - [ ]* 8.3 Написать property test для валидации enum значений
    - **Property 29: Bug status validity**
    - **Property 30: Bug priority validity**
    - **Property 67: Bug type validity**
    - **Validates: Requirements 13.2, 13.3, 21.1**

  - [x] 8.4 Создать API endpoints для управления багами
    - POST /api/bugs - создание нового бага
    - GET /api/bugs - получение списка багов с фильтрами
    - GET /api/bugs/:id - получение деталей бага
    - PUT /api/bugs/:id - обновление бага
    - DELETE /api/bugs/:id - удаление бага
    - PATCH /api/bugs/:id/status - изменение статуса
    - PATCH /api/bugs/:id/priority - изменение приоритета
    - _Requirements: 13.1, 13.4, 13.5_

  - [ ]* 8.5 Написать unit tests для edge cases багов
    - Тест создания бага с невалидным testerId
    - Тест обновления несуществующего бага
    - Тест невалидных enum значений
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 9. Реализация системы комментариев к багам
  - [x] 9.1 Создать модель Comment и сервис
    - Реализовать создание комментария с author_id и author_name
    - Реализовать редактирование комментария (только в течение 15 минут)
    - Реализовать удаление комментария
    - Установка флага is_edited при редактировании
    - _Requirements: 19.1, 19.4, 19.5_

  - [x] 9.2 Создать API endpoints для комментариев
    - POST /api/bugs/:id/comments - добавление комментария
    - GET /api/bugs/:id/comments - получение комментариев (сортировка по created_at)
    - PUT /api/bugs/:id/comments/:commentId - редактирование комментария
    - DELETE /api/bugs/:id/comments/:commentId - удаление комментария
    - _Requirements: 19.1, 19.3, 19.4, 19.5_


  - [x] 9.3 Реализовать обновление bug.updated_at при добавлении комментария
    - Триггер или логика в сервисе для обновления timestamp бага
    - _Requirements: 19.7_

  - [ ]* 9.4 Написать property test для комментариев
    - **Property 57: Comment creation**
    - **Property 59: Comment deletion**
    - **Validates: Requirements 19.1, 19.2, 19.5**

  - [ ]* 9.5 Написать unit tests для комментариев
    - Тест редактирования в течение 15 минут
    - Тест запрета редактирования после 15 минут
    - Тест отображения комментариев в хронологическом порядке
    - _Requirements: 19.3, 19.4_

- [x] 10. Реализация загрузки скриншотов к багам
  - [x] 10.1 Настроить multer для загрузки файлов
    - Создать middleware для обработки multipart/form-data
    - Настроить ограничения (max 5 MB, форматы: PNG, JPG, JPEG, GIF)
    - Создать директорию для хранения файлов (uploads/screenshots/)
    - _Requirements: 20.2, 20.3_

  - [x] 10.2 Создать модель Screenshot и сервис
    - Реализовать сохранение метаданных в БД (filename, file_path, file_size, mime_type)
    - Реализовать проверку лимита (максимум 10 скриншотов на баг)
    - Реализовать удаление скриншота (файл + запись в БД)
    - _Requirements: 20.1, 20.6, 20.7_

  - [x] 10.3 Создать API endpoints для скриншотов
    - POST /api/bugs/:id/screenshots - загрузка скриншота
    - DELETE /api/bugs/:id/screenshots/:screenshotId - удаление скриншота
    - GET /api/bugs/:id/screenshots - получение списка скриншотов
    - _Requirements: 20.1, 20.7_

  - [ ]* 10.4 Написать property test для загрузки скриншотов
    - **Property 62: Image upload with valid format**
    - **Validates: Requirements 20.1, 20.2, 20.3**


  - [ ]* 10.5 Написать unit tests для скриншотов
    - Тест отклонения файла > 5 MB
    - Тест отклонения 11-го скриншота
    - Тест отклонения неподдерживаемого формата
    - _Requirements: 20.3, 20.6, 20.8_

- [x] 11. Реализация системы рейтинга тестеров
  - [x] 11.1 Создать сервис расчета рейтинга
    - Реализовать функцию calculateRating с весами (critical: 4, high: 3, medium: 2, low: 1)
    - Реализовать автоматическое обновление рейтинга при создании/изменении бага
    - Реализовать обновление поля bugs_count у тестера
    - _Requirements: 14.1, 14.2, 14.4_

  - [ ]* 11.2 Написать property test для расчета рейтинга
    - **Property 34: Rating calculation with weights**
    - **Validates: Requirements 14.1, 14.2**

  - [x] 11.3 Создать API endpoint для топ-10 тестеров
    - GET /api/testers/top - получение топ-10 тестеров по рейтингу
    - Сортировка по rating DESC
    - _Requirements: 14.3, 14.6_

  - [ ]* 11.4 Написать unit tests для рейтинговой системы
    - Тест обновления рейтинга при изменении приоритета бага
    - Тест корректности сортировки топ-10
    - _Requirements: 14.4, 14.6_

- [x] 12. Реализация истории активности тестеров
  - [x] 12.1 Создать сервис Activity History
    - Реализовать запись событий (registration, bug_found, status_changed)
    - Автоматическое создание записей при соответствующих действиях
    - _Requirements: 18.1, 18.2, 18.3_

  - [x] 12.2 Создать API endpoints для истории активности
    - GET /api/testers/:id/activity - получение истории (сортировка по timestamp DESC)
    - Поддержка фильтрации по event_type
    - _Requirements: 18.4, 18.6_


  - [ ]* 12.3 Написать property test для истории активности
    - **Property 50: Activity recording for registration**
    - **Property 51: Activity recording for bug creation**
    - **Property 52: Activity recording for status change**
    - **Validates: Requirements 18.1, 18.2, 18.3**

  - [ ]* 12.4 Написать unit tests для истории активности
    - Тест хронологической сортировки
    - Тест фильтрации по типу события
    - _Requirements: 18.4, 18.6_

- [x] 13. Реализация системы уведомлений
  - [x] 13.1 Создать сервис Notification
    - Реализовать создание уведомлений (new_tester, critical_bug, server_down)
    - Реализовать автоматическое создание при регистрации тестера
    - Реализовать автоматическое создание при создании critical бага
    - _Requirements: 17.1, 17.2_

  - [x] 13.2 Создать API endpoints для уведомлений
    - GET /api/notifications - получение списка уведомлений
    - GET /api/notifications/unread - получение непрочитанных
    - PATCH /api/notifications/:id/read - отметить как прочитанное
    - DELETE /api/notifications/:id - удалить уведомление
    - _Requirements: 17.6, 17.7_

  - [ ]* 13.3 Написать property test для уведомлений
    - **Property 45: New tester notification**
    - **Property 46: Critical bug notification**
    - **Validates: Requirements 17.1, 17.2**

  - [ ]* 13.4 Написать unit tests для уведомлений
    - Тест подсчета непрочитанных уведомлений
    - Тест удаления уведомления
    - _Requirements: 17.5, 17.7_

- [x] 14. Checkpoint - Backend API завершен
  - Проверить все API endpoints
  - Убедиться, что все тесты проходят
  - Проверить интеграцию между модулями
  - Спросить пользователя, если возникли вопросы


- [x] 15. Создание базовой структуры Frontend
  - [x] 15.1 Создать HTML структуру страниц
    - Создать index.html (главная страница с редиректом на login)
    - Создать login.html (страница авторизации)
    - Создать dashboard.html (административная панель)
    - Подключить CSS и JavaScript файлы
    - _Requirements: 11.1, 4.1_

  - [x] 15.2 Создать базовые CSS стили
    - Создать styles/main.css (общие стили, переменные цветов LIVE RUSSIA)
    - Создать styles/sidebar.css (стили бокового меню)
    - Создать styles/dashboard.css (стили дашборда)
    - Создать styles/tables.css (стили таблиц)
    - Реализовать адаптивный дизайн (media queries для < 768px)
    - _Requirements: 4.5, 9.1, 9.2_

  - [x] 15.3 Создать базовую JavaScript архитектуру
    - Создать js/api.js (модуль для HTTP запросов)
    - Создать js/auth.js (модуль авторизации)
    - Создать js/utils.js (вспомогательные функции)
    - Создать js/notifications.js (модуль уведомлений)
    - _Requirements: 11.1, 17.3_

- [x] 16. Реализация страницы авторизации
  - [x] 16.1 Создать форму входа
    - HTML форма с полями username и password
    - Валидация на стороне клиента
    - Обработка отправки формы
    - _Requirements: 11.1_

  - [x] 16.2 Реализовать логику авторизации (js/auth.js)
    - Функция login(username, password)
    - Сохранение сессии в sessionStorage
    - Редирект на dashboard при успешной авторизации
    - Отображение ошибок при неверных учетных данных
    - _Requirements: 11.2, 11.3_

  - [x] 16.3 Реализовать проверку сессии
    - Функция checkSession() для проверки активной сессии
    - Автоматический редирект на login при отсутствии сессии
    - _Requirements: 11.5_


- [x] 17. Реализация бокового меню административной панели
  - [x] 17.1 Создать HTML структуру sidebar
    - Боковое меню с пунктами: Dashboard, Testers, Bugs, Server Statistics, Online Players
    - Логотип LIVE RUSSIA
    - Кнопка Logout
    - _Requirements: 4.1, 4.2_

  - [x] 17.2 Реализовать навигацию (js/sidebar.js)
    - Функция setActiveMenuItem(itemId)
    - Обработчики кликов для навигации между разделами
    - Подсветка активного пункта меню
    - _Requirements: 4.3, 4.4_

  - [x] 17.3 Реализовать адаптивное меню
    - Hamburger menu для экранов < 768px
    - Функция toggleMobileMenu()
    - Анимация открытия/закрытия
    - _Requirements: 9.2_

- [x] 18. Реализация Dashboard со статистикой
  - [x] 18.1 Создать HTML структуру дашборда
    - Карточки метрик (total testers, active 24h, total bugs)
    - Секция топ-10 тестеров
    - Секция графиков распределения багов
    - _Requirements: 5.1, 5.2, 14.3_

  - [x] 18.2 Реализовать загрузку статистики (js/dashboard.js)
    - Функция loadDashboardStats() с запросом к /api/statistics/dashboard
    - Функция loadTopTesters() с запросом к /api/testers/top
    - Отображение данных в карточках
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 14.3_

  - [x] 18.3 Реализовать автообновление статистики
    - setInterval для обновления каждые 30 секунд
    - _Requirements: 5.5_

  - [x] 18.4 Интегрировать Chart.js для графиков
    - Подключить библиотеку Chart.js
    - Создать графики распределения багов (по статусу, приоритету, типу)
    - _Requirements: 21.2, 21.3, 21.4_


- [x] 19. Реализация таблицы тестеров
  - [x] 19.1 Создать HTML структуру таблицы
    - Таблица с колонками: ID, Name, Email, Nickname, Telegram, Device, OS, Bugs Count, Rating, Status, Registration Date
    - Панель фильтров (device type, OS, status)
    - Поле поиска
    - Элементы пагинации
    - _Requirements: 8.1, 12.1, 12.2, 12.3, 12.4_

  - [x] 19.2 Реализовать загрузку и отображение тестеров (js/testers.js)
    - Функция loadTesters(page, filters, sort) с запросом к /api/testers
    - Функция renderTestersTable(testers)
    - Отображение 20 тестеров на странице
    - _Requirements: 8.1, 8.5_

  - [x] 19.3 Реализовать сортировку
    - Обработчики кликов на заголовки колонок
    - Функция sortByColumn(column, direction)
    - Визуальная индикация направления сортировки
    - _Requirements: 8.2_

  - [x] 19.4 Реализовать фильтрацию и поиск
    - Функция applyFilters(deviceType, os, status)
    - Функция searchTesters(query) для поиска по имени и email
    - Обновление таблицы при изменении фильтров
    - _Requirements: 8.3, 8.4_

  - [x] 19.5 Реализовать пагинацию
    - Функция changePage(page)
    - Кнопки Previous/Next
    - Отображение текущей страницы и общего количества
    - _Requirements: 8.5_

  - [x] 19.6 Реализовать просмотр деталей тестера
    - Обработчик клика на строку таблицы
    - Модальное окно с деталями тестера
    - Отображение списка багов тестера
    - Возможность изменения статуса тестера
    - _Requirements: 12.5, 12.6_


- [x] 20. Реализация управления багами в UI
  - [x] 20.1 Создать HTML структуру страницы багов
    - Таблица багов с колонками: ID, Title, Tester, Priority, Status, Type, Created, Comments, Screenshots
    - Панель фильтров (status, priority, type, tester)
    - Поле поиска
    - Кнопка "Create Bug"
    - _Requirements: 13.4, 15.1_

  - [x] 20.2 Реализовать загрузку и отображение багов (js/bugs.js)
    - Функция loadBugs(filters) с запросом к /api/bugs
    - Функция renderBugsTable(bugs)
    - Цветовая индикация приоритетов
    - _Requirements: 13.4, 15.3_

  - [x] 20.3 Реализовать фильтрацию и поиск багов
    - Функция applyBugFilters(status, priority, type, testerId)
    - Функция searchBugs(query) для поиска по title и description
    - Отображение количества найденных багов
    - Кнопка "Clear Filters"
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [x] 20.4 Реализовать создание бага
    - Модальное окно с формой создания бага
    - Поля: title, description, tester (select), priority, status, type
    - Валидация полей
    - Отправка POST /api/bugs
    - _Requirements: 13.1_

  - [x] 20.5 Реализовать просмотр деталей бага
    - Модальное окно с полной информацией о баге
    - Отображение комментариев
    - Отображение скриншотов (thumbnails)
    - Возможность редактирования status и priority
    - _Requirements: 13.4, 13.5_

  - [x] 20.6 Реализовать загрузку скриншотов
    - Кнопка "Upload Screenshot" в деталях бага
    - Input type="file" с ограничениями (PNG, JPG, JPEG, GIF, max 5MB)
    - Отображение thumbnails загруженных скриншотов
    - Клик на thumbnail открывает полноразмерное изображение
    - Кнопка удаления скриншота
    - _Requirements: 20.1, 20.4, 20.5, 20.6, 20.7_


  - [x] 20.7 Реализовать систему комментариев в UI
    - Секция комментариев в деталях бага
    - Форма добавления комментария
    - Отображение комментариев в хронологическом порядке
    - Кнопки редактирования и удаления (только для своих комментариев, в течение 15 минут)
    - Индикация отредактированных комментариев
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 21. Реализация статистики серверов
  - [x] 21.1 Создать HTML структуру страницы серверов
    - Карточки серверов с информацией: name, status, load, response time
    - Цветовая индикация статуса (green/yellow/red)
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 21.2 Реализовать загрузку статистики серверов (js/servers.js)
    - Функция loadServerStats() с запросом к /api/servers
    - Функция renderServerCards(servers)
    - Автообновление каждые 15 секунд
    - _Requirements: 6.1, 6.4_

  - [ ]* 21.3 Написать unit tests для отображения серверов
    - Тест цветовой индикации статусов
    - Тест автообновления
    - _Requirements: 6.2, 6.4_

- [x] 22. Реализация графиков онлайн игроков
  - [x] 22.1 Создать HTML структуру страницы онлайн игроков
    - Canvas элемент для Chart.js
    - Кнопки фильтрации по периодам (1h, 6h, 24h, 7d)
    - Отображение пикового значения
    - _Requirements: 7.1, 7.3, 7.5_

  - [x] 22.2 Реализовать график онлайн игроков (js/online-players.js)
    - Функция loadOnlinePlayersData(period) с запросом к /api/online-players
    - Функция renderChart(data) с использованием Chart.js
    - Отображение по умолчанию: 24 часа
    - Автообновление каждые 60 секунд
    - _Requirements: 7.1, 7.2, 7.4_


  - [x] 22.3 Реализовать фильтрацию по периодам
    - Обработчики кликов на кнопки периодов
    - Функция setPeriod(period)
    - Обновление графика при смене периода
    - _Requirements: 7.3_

  - [x] 22.4 Реализовать отображение пикового значения
    - Функция calculatePeak(data)
    - Отображение peak count и timestamp
    - _Requirements: 7.5_

- [x] 23. Реализация системы уведомлений в UI
  - [x] 23.1 Создать компонент уведомлений (js/notifications.js)
    - HTML структура для отображения уведомлений (правый верхний угол)
    - Функция showNotification(title, message, type)
    - Автоматическое скрытие через 10 секунд
    - Кнопка ручного закрытия
    - _Requirements: 17.3, 17.4, 17.5_

  - [x] 23.2 Реализовать историю уведомлений
    - Иконка с счетчиком непрочитанных в header
    - Модальное окно с историей уведомлений
    - Функция loadNotificationHistory()
    - Функция markAsRead(notificationId)
    - _Requirements: 17.6, 17.7_

  - [x] 23.3 Интегрировать уведомления с событиями
    - Показывать уведомление при регистрации нового тестера
    - Показывать уведомление при создании critical бага
    - Показывать уведомление при изменении статуса сервера на offline
    - _Requirements: 17.1, 17.2, 6.5_

- [x] 24. Реализация экспорта отчетов
  - [x] 24.1 Создать кнопки экспорта в UI
    - Кнопки "Export to CSV" и "Export to PDF" на страницах Testers и Bugs
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [x] 24.2 Реализовать логику экспорта (js/export.js)
    - Функция exportToCSV(type, filters) с запросом к /api/export/{type}/csv
    - Функция exportToPDF(type, filters) с запросом к /api/export/{type}/pdf
    - Автоматическая загрузка файла
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.6_


  - [x] 24.3 Реализовать backend для экспорта CSV
    - Создать сервис export.service.js
    - Функция generateTestersCSV(filters)
    - Функция generateBugsCSV(filters)
    - Формат имени файла: report_YYYY-MM-DD_HH-MM-SS.csv
    - _Requirements: 16.1, 16.3, 16.6, 16.7_

  - [x] 24.4 Реализовать backend для экспорта PDF
    - Подключить библиотеку pdfkit или puppeteer
    - Функция generateTestersPDF(filters)
    - Функция generateBugsPDF(filters)
    - Формат имени файла: report_YYYY-MM-DD_HH-MM-SS.pdf
    - _Requirements: 16.2, 16.4, 16.6, 16.7_

  - [ ]* 24.5 Написать unit tests для экспорта
    - Тест генерации CSV с корректными данными
    - Тест генерации PDF с корректными данными
    - Тест формата имени файла
    - _Requirements: 16.7_

- [x] 25. Реализация страницы регистрации тестеров (публичная)
  - [x] 25.1 Создать HTML страницу регистрации
    - Создать register.html (публичная страница без авторизации)
    - Форма с полями: name, email, nickname, telegram, deviceType, os, osVersion
    - Валидация на стороне клиента
    - _Requirements: 1.1_

  - [x] 25.2 Реализовать логику регистрации (js/register.js)
    - Функция submitRegistration(data)
    - Отправка POST /api/testers
    - Отображение сообщения об успешной регистрации
    - Отображение ошибок валидации
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 25.3 Реализовать автоматическое обновление дашборда
    - При успешной регистрации обновить статистику дашборда (если открыт)
    - Показать уведомление администратору о новом тестере
    - _Requirements: 2.1, 2.3, 17.1_

- [x] 26. Checkpoint - Frontend завершен
  - Проверить все страницы и компоненты
  - Проверить адаптивность на разных экранах
  - Проверить интеграцию с backend API
  - Спросить пользователя, если возникли вопросы


- [x] 27. Реализация mock данных для серверов и онлайн игроков
  - [x] 27.1 Создать сервис для генерации mock данных серверов
    - Создать servers.service.js с функцией getMockServers()
    - Генерация случайных данных (status, load, response time)
    - API endpoint GET /api/servers
    - _Requirements: 6.1_

  - [x] 27.2 Создать сервис для генерации mock данных онлайн игроков
    - Создать onlinePlayers.service.js с функцией generateMockData(period)
    - Генерация временных рядов с количеством игроков
    - API endpoint GET /api/online-players
    - _Requirements: 7.1_

- [x] 28. Обработка ошибок и валидация
  - [x] 28.1 Реализовать централизованную обработку ошибок на backend
    - Создать error.middleware.js
    - Обработка различных типов ошибок (400, 401, 403, 404, 409, 500, 502, 503)
    - Форматирование ответов об ошибках
    - Логирование ошибок
    - _Requirements: Error Handling section_

  - [x] 28.2 Реализовать валидацию входных данных
    - Создать validation.middleware.js
    - Валидация для регистрации тестеров
    - Валидация для создания багов
    - Валидация для загрузки файлов
    - _Requirements: 1.2, 1.4, 1.5, 13.1, 20.3, 20.8_

  - [x] 28.3 Реализовать обработку ошибок на frontend
    - Функция handleApiError(response) в js/api.js
    - Отображение пользовательских сообщений об ошибках
    - Редирект на login при 401
    - _Requirements: Error Handling section_

- [x] 29. Оптимизация и кэширование
  - [x] 29.1 Реализовать кэширование статистики в Redis
    - Кэширование dashboard stats (TTL: 30s)
    - Кэширование server stats (TTL: 15s)
    - Кэширование online players data (TTL: 60s)
    - _Requirements: 5.5, 6.4, 7.4_


  - [x] 29.2 Добавить индексы в базу данных
    - Индексы уже определены в миграциях (задача 2.1)
    - Проверить производительность запросов
    - _Requirements: Database Schema section_

  - [x] 29.3 Оптимизировать запросы к базе данных
    - Использовать JOIN вместо множественных запросов
    - Добавить LIMIT для больших выборок
    - Использовать COUNT для подсчета без загрузки данных
    - _Requirements: Performance considerations_

- [x] 30. Документация и развертывание
  - [x] 30.1 Создать README.md с инструкциями
    - Описание проекта
    - Требования к окружению (Node.js, PostgreSQL, Redis)
    - Инструкции по установке зависимостей
    - Инструкции по настройке .env файла
    - Инструкции по запуску миграций
    - Инструкции по запуску приложения
    - _Requirements: Deployment considerations_

  - [x] 30.2 Создать скрипты для развертывания
    - Скрипт инициализации базы данных (init-db.sql)
    - Скрипт создания первого администратора (seed-admin.js)
    - Скрипт для запуска миграций (npm run migrate)
    - Скрипт для запуска приложения (npm start)
    - _Requirements: Deployment considerations_

  - [x] 30.3 Создать docker-compose.yml для локального запуска
    - Сервис PostgreSQL
    - Сервис Redis
    - Сервис Node.js приложения
    - Volumes для персистентности данных
    - _Requirements: Deployment considerations_

- [x] 31. Финальное тестирование и интеграция
  - [x] 31.1 Провести интеграционное тестирование
    - Тест полного flow регистрации тестера
    - Тест создания бага с комментариями и скриншотами
    - Тест обновления рейтинга при изменении приоритета бага
    - Тест синхронизации с Google Sheets
    - _Requirements: Integration Tests section_


  - [ ]* 31.2 Запустить все property-based тесты
    - Выполнить все property tests с минимум 100 итерациями
    - Проверить coverage (минимум 80%)
    - _Requirements: Testing Strategy section_

  - [ ]* 31.3 Запустить все unit тесты
    - Выполнить все unit tests
    - Проверить edge cases
    - Проверить error handling
    - _Requirements: Testing Strategy section_

  - [x] 31.4 Проверить адаптивность UI
    - Тестирование на разных разрешениях экрана
    - Проверка hamburger menu на мобильных устройствах
    - Проверка читаемости таблиц на маленьких экранах
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 31.5 Проверить производительность
    - Время загрузки дашборда < 2 секунд
    - Время ответа API < 200ms (p95)
    - Время рендеринга графиков < 500ms
    - Время генерации экспорта < 10 секунд
    - _Requirements: Performance Testing section_

- [x] 32. Финальный checkpoint - Система готова к использованию
  - Убедиться, что все основные функции работают
  - Проверить интеграцию всех компонентов
  - Проверить обработку ошибок
  - Проверить безопасность (хеширование паролей, защита маршрутов)
  - Убедиться, что документация актуальна
  - Спросить пользователя, если возникли вопросы

## Notes

- Задачи, отмеченные `*`, являются опциональными и могут быть пропущены для более быстрого MVP
- Каждая задача ссылается на конкретные требования для отслеживаемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные свойства корректности
- Unit tests валидируют конкретные примеры и edge cases
- Все задачи предполагают реализацию на localhost для разработки и тестирования
