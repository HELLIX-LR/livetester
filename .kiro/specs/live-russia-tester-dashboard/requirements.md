# Requirements Document

## Introduction

Веб-сайт для управления тестировщиками мобильного проекта LIVE RUSSIA. Система предоставляет функционал регистрации тестеров с автоматическим добавлением данных в общий дашборд, интеграцию с существующей Google Таблицей, и административную панель для мониторинга активности тестеров, статистики серверов и онлайн-метрик.

## Glossary

- **Tester_Registration_System**: Подсистема регистрации новых тестеров
- **Dashboard**: Административная панель с визуализацией данных тестеров
- **Google_Sheets_Integration**: Модуль интеграции с Google Таблицами
- **Tester**: Пользователь, проходящий регистрацию для тестирования мобильного приложения
- **Admin_Panel**: Интерфейс администратора с боковым меню и статистикой
- **Server_Statistics**: Модуль отображения статистики серверов
- **Online_Players_Chart**: Компонент графиков онлайн игроков
- **Auth_System**: Система авторизации и аутентификации администраторов
- **Bug**: Дефект или проблема, найденная тестером в приложении
- **Bug_Management_System**: Подсистема управления багами
- **Tester_Rating_System**: Система рейтинга тестеров
- **Export_Module**: Модуль экспорта отчетов
- **Notification_System**: Система уведомлений
- **Activity_History**: История активности тестера
- **Comment_System**: Система комментариев к багам

## Requirements

### Requirement 1: Регистрация тестера

**User Story:** Как тестер, я хочу зарегистрироваться в системе, чтобы получить доступ к тестированию мобильного проекта LIVE RUSSIA

#### Acceptance Criteria

1. THE Tester_Registration_System SHALL provide a registration form with fields for name, email, device type, and operating system version
2. WHEN a Tester submits the registration form, THE Tester_Registration_System SHALL validate all required fields
3. WHEN registration data is valid, THE Tester_Registration_System SHALL create a new tester record
4. IF any required field is empty, THEN THE Tester_Registration_System SHALL display an error message indicating which fields are missing
5. IF the email format is invalid, THEN THE Tester_Registration_System SHALL display an email validation error message

### Requirement 2: Автоматическое добавление данных в дашборд

**User Story:** Как администратор, я хочу видеть данные новых тестеров сразу после регистрации, чтобы отслеживать активность в реальном времени

#### Acceptance Criteria

1. WHEN a Tester completes registration, THE Dashboard SHALL display the new tester data within 5 seconds
2. THE Dashboard SHALL show tester name, registration date, device type, and status
3. THE Dashboard SHALL update the total tester count automatically
4. THE Dashboard SHALL sort testers by registration date with newest first

### Requirement 3: Интеграция с Google Таблицей

**User Story:** Как администратор, я хочу синхронизировать данные тестеров с существующей Google Таблицей, чтобы сохранить единый источник данных

#### Acceptance Criteria

1. WHEN a Tester completes registration, THE Google_Sheets_Integration SHALL append a new row to the Google Spreadsheet
2. THE Google_Sheets_Integration SHALL write tester data to columns matching the existing spreadsheet structure
3. IF the Google Sheets API is unavailable, THEN THE Google_Sheets_Integration SHALL store the data locally and retry within 60 seconds
4. THE Google_Sheets_Integration SHALL authenticate using OAuth 2.0 credentials
5. WHEN data is successfully written, THE Google_Sheets_Integration SHALL log the operation with timestamp

### Requirement 4: Административная панель с боковым меню

**User Story:** Как администратор, я хочу использовать панель с боковым меню, чтобы легко навигировать между разделами системы

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a sidebar menu on the left side of the screen
2. THE Admin_Panel SHALL include menu items for Dashboard, Testers, Server Statistics, and Online Players
3. WHEN an administrator clicks a menu item, THE Admin_Panel SHALL navigate to the corresponding section
4. THE Admin_Panel SHALL highlight the currently active menu item
5. THE Admin_Panel SHALL maintain the LIVE RUSSIA branding and color scheme

### Requirement 5: Дашборд со статистикой

**User Story:** Как администратор, я хочу видеть общую статистику на главном экране, чтобы быстро оценить состояние системы

#### Acceptance Criteria

1. THE Dashboard SHALL display the total number of registered testers
2. THE Dashboard SHALL display the number of active testers in the last 24 hours
3. THE Dashboard SHALL display the number of testers by device type
4. THE Dashboard SHALL display the number of testers by operating system
5. THE Dashboard SHALL refresh statistics every 30 seconds

### Requirement 6: Статистика серверов

**User Story:** Как администратор, я хочу видеть статистику серверов, чтобы мониторить их состояние и нагрузку

#### Acceptance Criteria

1. THE Server_Statistics SHALL display server name, status, and current load
2. THE Server_Statistics SHALL use color coding for server status: green for online, yellow for warning, red for offline
3. THE Server_Statistics SHALL display response time for each server
4. THE Server_Statistics SHALL update server data every 15 seconds
5. IF a server status changes to offline, THEN THE Server_Statistics SHALL display a notification

### Requirement 7: Графики онлайн игроков

**User Story:** Как администратор, я хочу видеть графики онлайн игроков, чтобы анализировать динамику активности

#### Acceptance Criteria

1. THE Online_Players_Chart SHALL display a line chart showing player count over time
2. THE Online_Players_Chart SHALL show data for the last 24 hours by default
3. THE Online_Players_Chart SHALL allow filtering by time period: 1 hour, 6 hours, 24 hours, 7 days
4. THE Online_Players_Chart SHALL update data every 60 seconds
5. THE Online_Players_Chart SHALL display peak player count and timestamp

### Requirement 8: Таблица данных тестеров

**User Story:** Как администратор, я хочу видеть детальную таблицу всех тестеров, чтобы управлять их данными

#### Acceptance Criteria

1. THE Dashboard SHALL display a table with columns for tester ID, name, email, device, OS, registration date, and status
2. THE Dashboard SHALL support sorting by any column
3. THE Dashboard SHALL support filtering by device type and operating system
4. THE Dashboard SHALL support search by tester name or email
5. THE Dashboard SHALL display 20 testers per page with pagination controls

### Requirement 9: Адаптивный дизайн

**User Story:** Как администратор, я хочу использовать систему на разных устройствах, чтобы иметь доступ к данным в любое время

#### Acceptance Criteria

1. THE Admin_Panel SHALL adapt layout for screen widths below 768 pixels
2. WHEN screen width is below 768 pixels, THE Admin_Panel SHALL collapse the sidebar menu into a hamburger menu
3. THE Dashboard SHALL maintain readability on mobile devices
4. THE Online_Players_Chart SHALL scale proportionally on smaller screens

### Requirement 10: Чтение данных из Google Таблицы

**User Story:** Как администратор, я хочу загружать существующие данные из Google Таблицы, чтобы отображать полную историю тестеров

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Google_Sheets_Integration SHALL fetch all existing tester records from the Google Spreadsheet
2. THE Google_Sheets_Integration SHALL parse spreadsheet data into tester objects
3. THE Google_Sheets_Integration SHALL handle empty cells and missing data gracefully
4. IF the spreadsheet structure does not match expected format, THEN THE Google_Sheets_Integration SHALL log an error and display a warning message
5. FOR ALL valid tester records, reading from Google Sheets then displaying in Dashboard SHALL preserve all data fields (round-trip property)

### Requirement 11: Авторизация администраторов

**User Story:** Как администратор, я хочу войти в систему с логином и паролем, чтобы защитить доступ к административной панели

#### Acceptance Criteria

1. THE Auth_System SHALL provide a login form with fields for username and password
2. WHEN an administrator submits valid credentials, THE Auth_System SHALL create an authenticated session
3. WHEN an administrator submits invalid credentials, THE Auth_System SHALL display an error message and deny access
4. THE Auth_System SHALL hash passwords using bcrypt with minimum 10 salt rounds
5. WHEN an administrator is not authenticated, THE Admin_Panel SHALL redirect to the login page
6. THE Auth_System SHALL maintain session for 24 hours or until logout
7. THE Auth_System SHALL provide a logout function that terminates the session

### Requirement 12: Расширенная таблица тестеров

**User Story:** Как администратор, я хочу видеть детальную информацию о тестерах включая их баги, чтобы эффективно управлять процессом тестирования

#### Acceptance Criteria

1. THE Dashboard SHALL display tester nickname in the testers table
2. THE Dashboard SHALL display Telegram username or Telegram ID for each tester
3. THE Dashboard SHALL display the count of bugs found by each tester
4. THE Dashboard SHALL display activity status for each tester: active, inactive, or suspended
5. WHEN an administrator clicks on a tester row, THE Dashboard SHALL display the list of bugs found by that tester
6. THE Dashboard SHALL allow updating tester activity status
7. THE Dashboard SHALL calculate and display total bugs found across all testers

### Requirement 13: Управление багами

**User Story:** Как администратор, я хочу управлять багами найденными тестерами, чтобы отслеживать процесс исправления дефектов

#### Acceptance Criteria

1. THE Bug_Management_System SHALL allow adding a new bug with fields: title, description, tester, priority, and status
2. THE Bug_Management_System SHALL support bug statuses: new, in_progress, fixed, closed
3. THE Bug_Management_System SHALL support bug priorities: low, medium, high, critical
4. WHEN an administrator clicks on a bug, THE Bug_Management_System SHALL display full bug details
5. THE Bug_Management_System SHALL allow updating bug status and priority
6. THE Bug_Management_System SHALL assign a unique ID to each bug
7. THE Bug_Management_System SHALL record creation date and last update date for each bug
8. THE Bug_Management_System SHALL associate each bug with exactly one tester

### Requirement 14: Система рейтинга тестеров

**User Story:** Как администратор, я хочу видеть рейтинг тестеров, чтобы поощрять наиболее эффективных участников

#### Acceptance Criteria

1. THE Tester_Rating_System SHALL calculate rating based on number of bugs found
2. THE Tester_Rating_System SHALL apply weight multipliers: critical bugs ×4, high ×3, medium ×2, low ×1
3. THE Tester_Rating_System SHALL display top 10 testers on the Dashboard
4. THE Tester_Rating_System SHALL update ratings when bug priority changes
5. THE Tester_Rating_System SHALL display rating score next to each tester in the table
6. THE Tester_Rating_System SHALL sort testers by rating in descending order

### Requirement 15: Фильтрация и поиск багов

**User Story:** Как администратор, я хочу фильтровать и искать баги, чтобы быстро находить нужную информацию

#### Acceptance Criteria

1. THE Bug_Management_System SHALL provide filters for bug status, priority, and tester
2. THE Bug_Management_System SHALL provide search by bug title and description
3. WHEN an administrator applies filters, THE Bug_Management_System SHALL display only matching bugs
4. THE Bug_Management_System SHALL allow combining multiple filters
5. THE Bug_Management_System SHALL display the count of bugs matching current filters
6. THE Bug_Management_System SHALL allow clearing all filters with one action

### Requirement 16: Экспорт отчетов

**User Story:** Как администратор, я хочу экспортировать отчеты, чтобы анализировать данные в других инструментах

#### Acceptance Criteria

1. THE Export_Module SHALL export tester data to CSV format
2. THE Export_Module SHALL export tester data to PDF format
3. THE Export_Module SHALL export bug data to CSV format
4. THE Export_Module SHALL export bug data to PDF format
5. WHEN an administrator requests export, THE Export_Module SHALL generate the file within 10 seconds
6. THE Export_Module SHALL include all visible columns based on current filters
7. THE Export_Module SHALL name exported files with timestamp: report_YYYY-MM-DD_HH-MM-SS.csv

### Requirement 17: Система уведомлений

**User Story:** Как администратор, я хочу получать уведомления о важных событиях, чтобы оперативно реагировать на изменения

#### Acceptance Criteria

1. WHEN a new tester registers, THE Notification_System SHALL display a notification in the Admin_Panel
2. WHEN a critical priority bug is created, THE Notification_System SHALL display a notification in the Admin_Panel
3. THE Notification_System SHALL display notifications in the top-right corner of the screen
4. THE Notification_System SHALL auto-dismiss notifications after 10 seconds
5. THE Notification_System SHALL allow manual dismissal of notifications
6. THE Notification_System SHALL maintain a notification history accessible from the Admin_Panel
7. THE Notification_System SHALL display unread notification count in the header

### Requirement 18: История активности тестера

**User Story:** Как администратор, я хочу видеть историю активности тестера, чтобы понимать его вклад в проект

#### Acceptance Criteria

1. THE Activity_History SHALL record when a tester registers
2. THE Activity_History SHALL record when a tester finds a bug
3. THE Activity_History SHALL record when a tester's status changes
4. WHEN an administrator views a tester profile, THE Activity_History SHALL display all activity events in chronological order
5. THE Activity_History SHALL display event type, timestamp, and description for each activity
6. THE Activity_History SHALL allow filtering by event type
7. THE Activity_History SHALL display the last activity date for each tester in the main table

### Requirement 19: Комментарии к багам

**User Story:** Как администратор, я хочу добавлять комментарии к багам, чтобы документировать процесс исправления и общаться с командой

#### Acceptance Criteria

1. THE Comment_System SHALL allow adding comments to any bug
2. THE Comment_System SHALL display comment author and timestamp
3. THE Comment_System SHALL display comments in chronological order
4. THE Comment_System SHALL allow editing own comments within 15 minutes of posting
5. THE Comment_System SHALL allow deleting own comments
6. THE Comment_System SHALL display comment count for each bug in the bug list
7. WHEN a comment is added, THE Comment_System SHALL update the bug's last update timestamp

### Requirement 20: Прикрепление скриншотов к багам

**User Story:** Как администратор, я хочу прикреплять скриншоты к багам, чтобы визуально документировать проблемы

#### Acceptance Criteria

1. THE Bug_Management_System SHALL allow uploading image files to a bug
2. THE Bug_Management_System SHALL support image formats: PNG, JPG, JPEG, GIF
3. THE Bug_Management_System SHALL limit image file size to 5 MB
4. THE Bug_Management_System SHALL display thumbnails of attached images in bug details
5. WHEN an administrator clicks on a thumbnail, THE Bug_Management_System SHALL display the full-size image
6. THE Bug_Management_System SHALL allow attaching up to 10 images per bug
7. THE Bug_Management_System SHALL allow deleting attached images
8. IF an uploaded file exceeds size limit, THEN THE Bug_Management_System SHALL display an error message

### Requirement 21: Статистика по типам багов

**User Story:** Как администратор, я хочу видеть статистику по типам багов, чтобы выявлять проблемные области приложения

#### Acceptance Criteria

1. THE Bug_Management_System SHALL categorize bugs by type: UI, functionality, performance, crash, security, other
2. THE Dashboard SHALL display a chart showing bug distribution by type
3. THE Dashboard SHALL display a chart showing bug distribution by status
4. THE Dashboard SHALL display a chart showing bug distribution by priority
5. THE Dashboard SHALL calculate and display average time to fix bugs by priority
6. THE Dashboard SHALL display the total number of bugs by status
7. THE Dashboard SHALL update bug statistics when bug data changes
