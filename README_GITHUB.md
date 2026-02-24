# 🎯 LIVE RUSSIA Tester Dashboard

> A comprehensive admin dashboard for managing testers, bug reports, and payments for the LIVE RUSSIA project.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## 🌐 Live Demo

**🚀 Live Application:** [Coming Soon - Deploy to see your dashboard live!]

> **Note:** After deploying to Render, Railway, or Heroku, update this link with your live URL.

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 📖 About the Project

The **LIVE RUSSIA Tester Dashboard** is a full-stack web application designed to streamline the management of software testers, bug tracking, and payment processing. Built with modern web technologies, it provides an intuitive interface for administrators to efficiently handle all aspects of the testing workflow.

### Why This Project?

- **Centralized Management:** All tester information, bug reports, and payments in one place
- **Real-time Updates:** Instant data synchronization across all modules
- **User-Friendly:** Clean, modern interface that's easy to navigate
- **Secure:** Built-in authentication and data validation
- **Scalable:** Designed to handle growing teams and increasing data

---

## ✨ Features

### 👥 Tester Management
- ✅ Add, edit, and delete tester profiles
- ✅ Track tester status (Active/Inactive)
- ✅ Store contact information and specializations
- ✅ View tester performance metrics
- ✅ Export tester data to CSV/Excel

### 🐛 Bug Tracking
- ✅ Create and manage bug reports
- ✅ Assign bugs to specific testers
- ✅ Track bug status (Open, In Progress, Resolved, Closed)
- ✅ Set priority levels (Low, Medium, High, Critical)
- ✅ Add detailed descriptions and reproduction steps
- ✅ Filter and search bugs by multiple criteria
- ✅ Bug statistics and analytics

### 💰 Payment Management
- ✅ Record tester payments
- ✅ Track payment status (Pending, Paid, Failed)
- ✅ Generate payment reports
- ✅ Calculate total payments per tester
- ✅ Payment history and audit trail

### 🔐 Authentication & Security
- ✅ Secure login system
- ✅ Session management
- ✅ Password encryption
- ✅ Protected API endpoints
- ✅ Input validation and sanitization

### 📊 Dashboard & Analytics
- ✅ Overview of key metrics
- ✅ Visual charts and graphs
- ✅ Real-time statistics
- ✅ Quick access to all modules

---

## 📸 Screenshots

### Dashboard Overview
![Dashboard Screenshot](screenshots/dashboard.png)
> *Main dashboard showing key metrics and quick access to all modules*

### Tester Management
![Testers Screenshot](screenshots/testers.png)
> *Comprehensive tester management interface with search and filter options*

### Bug Tracking
![Bugs Screenshot](screenshots/bugs.png)
> *Bug tracking system with status indicators and priority levels*

### Payment Management
![Payments Screenshot](screenshots/payments.png)
> *Payment tracking and management interface*

> **Note:** Add screenshots to the `screenshots/` folder after deployment to showcase your dashboard.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Flexbox/Grid
- **JavaScript (ES6+)** - Interactive functionality
- **Fetch API** - Asynchronous data handling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **SQLite3** - Lightweight database
- **bcrypt** - Password hashing
- **express-session** - Session management
- **cors** - Cross-origin resource sharing

### Development Tools
- **Git** - Version control
- **npm** - Package management
- **dotenv** - Environment variable management

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`

- **npm** (comes with Node.js)
  - Verify installation: `npm --version`

- **Git** (for cloning the repository)
  - Download from: https://git-scm.com/
  - Verify installation: `git --version`

---

## 📥 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/live-russia-tester-dashboard.git
cd live-russia-tester-dashboard
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

### Step 3: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and configure your settings:
   ```env
   PORT=3000
   SESSION_SECRET=your-super-secret-key-change-this
   NODE_ENV=development
   ```

### Step 4: Initialize the Database

The database will be automatically created when you first run the server. It includes:
- Testers table
- Bugs table
- Payments table
- Users table (for authentication)

### Step 5: Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Step 6: Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

**Default login credentials:**
- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ **Important:** Change the default password immediately after first login!

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Session Configuration
SESSION_SECRET=your-super-secret-key-minimum-32-characters-long

# Database Configuration
DB_PATH=./database/dashboard.db

# Security
BCRYPT_ROUNDS=10

# CORS Settings (for production)
ALLOWED_ORIGINS=https://yourdomain.com
```

### Database Configuration

The application uses SQLite3 by default. The database file is stored in:
```
./database/dashboard.db
```

To reset the database:
```bash
rm database/dashboard.db
npm start
```

---

## 💻 Usage

### Adding a New Tester

1. Navigate to the **Testers** page
2. Click **"Add New Tester"** button
3. Fill in the tester details:
   - Full Name
   - Email
   - Phone Number
   - Specialization
   - Status (Active/Inactive)
4. Click **"Save"**

### Creating a Bug Report

1. Go to the **Bugs** page
2. Click **"Report New Bug"**
3. Enter bug details:
   - Title
   - Description
   - Steps to reproduce
   - Priority level
   - Assign to tester
4. Click **"Submit"**

### Recording a Payment

1. Open the **Payments** page
2. Click **"Add Payment"**
3. Select tester and enter:
   - Amount
   - Payment date
   - Payment method
   - Notes (optional)
4. Click **"Record Payment"**

---

## 🌍 Deployment

### Deploy to Render (Recommended)

1. **Create a Render account:** https://render.com
2. **Connect your GitHub repository**
3. **Create a new Web Service:**
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Add environment variables** in Render dashboard
5. **Deploy!** Your app will be live in minutes

### Deploy to Railway

1. **Sign up at:** https://railway.app
2. **Click "New Project"** → "Deploy from GitHub repo"
3. **Select your repository**
4. **Add environment variables**
5. Railway will automatically detect and deploy your Node.js app

### Deploy to Heroku

1. **Install Heroku CLI:** https://devcenter.heroku.com/articles/heroku-cli
2. **Login to Heroku:**
   ```bash
   heroku login
   ```
3. **Create a new app:**
   ```bash
   heroku create your-app-name
   ```
4. **Set environment variables:**
   ```bash
   heroku config:set SESSION_SECRET=your-secret-key
   ```
5. **Deploy:**
   ```bash
   git push heroku master
   ```

### Environment Variables for Production

Make sure to set these in your hosting platform:

```env
NODE_ENV=production
SESSION_SECRET=your-production-secret-key
PORT=3000
```

---

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Login to the dashboard

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

### Tester Endpoints

#### GET `/api/testers`
Get all testers

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "specialization": "Mobile Testing",
      "status": "active"
    }
  ]
}
```

#### POST `/api/testers`
Create a new tester

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567891",
  "specialization": "Web Testing",
  "status": "active"
}
```

### Bug Endpoints

#### GET `/api/bugs`
Get all bugs

#### POST `/api/bugs`
Create a new bug report

#### PUT `/api/bugs/:id`
Update a bug

#### DELETE `/api/bugs/:id`
Delete a bug

### Payment Endpoints

#### GET `/api/payments`
Get all payments

#### POST `/api/payments`
Record a new payment

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

### How to Contribute

1. **Fork the Project**
2. **Create your Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your Changes**
   ```bash
   git commit -m "Add some AmazingFeature"
   ```
4. **Push to the Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Coding Standards

- Use meaningful variable and function names
- Comment complex logic
- Follow existing code style
- Test your changes before submitting
- Update documentation if needed

---

## 📄 License

Distributed under the MIT License. See `LICENSE` file for more information.

**MIT License Summary:**
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use

---

## 📞 Contact

**Project Maintainer:** [Your Name]

- **Email:** your.email@example.com
- **GitHub:** [@your-username](https://github.com/your-username)
- **LinkedIn:** [Your LinkedIn](https://linkedin.com/in/your-profile)

**Project Link:** [https://github.com/your-username/live-russia-tester-dashboard](https://github.com/your-username/live-russia-tester-dashboard)

---

## 🙏 Acknowledgments

- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Express.js](https://expressjs.com/) - Web framework
- [SQLite](https://www.sqlite.org/) - Database engine
- [Font Awesome](https://fontawesome.com/) - Icons (if used)
- [GitHub](https://github.com/) - Code hosting

---

## 📈 Project Status

**Current Version:** 1.0.0  
**Status:** Active Development  
**Last Updated:** 2024

### Roadmap

- [ ] Add email notifications for bug assignments
- [ ] Implement advanced analytics dashboard
- [ ] Add export functionality for reports
- [ ] Multi-language support
- [ ] Mobile app version
- [ ] Integration with popular bug tracking tools

---

## 🐛 Known Issues

- None at the moment

If you find a bug, please [open an issue](https://github.com/your-username/live-russia-tester-dashboard/issues).

---

## ⭐ Show Your Support

If this project helped you, please give it a ⭐️ on GitHub!

---

**Made with ❤️ for the LIVE RUSSIA project**
