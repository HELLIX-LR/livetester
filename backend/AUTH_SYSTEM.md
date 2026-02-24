# Authentication System Documentation

## Overview

The authentication system provides secure admin access to the LIVE RUSSIA Tester Dashboard using bcrypt password hashing and Redis-backed sessions.

## Components

### 1. Admin Model (`models/Admin.model.js`)
Handles database operations for admin users:
- `findByUsername(username)` - Find admin by username
- `findById(id)` - Find admin by ID
- `create(adminData)` - Create new admin
- `updateLastLogin(id)` - Update last login timestamp
- `findAll()` - Get all admins (without passwords)

### 2. Authentication Service (`services/auth.service.js`)
Core authentication logic:
- `hashPassword(password)` - Hash password with bcrypt (10 salt rounds minimum)
- `verifyPassword(password, hash)` - Verify password against hash
- `authenticate(username, password)` - Authenticate admin credentials
- `createSession(req, admin)` - Create authenticated session
- `destroySession(req)` - Destroy session (logout)
- `isSessionValid(req)` - Check if session is valid
- `getCurrentAdmin(req)` - Get current admin from session

### 3. Authentication Routes (`routes/auth.routes.js`)
API endpoints:
- `POST /api/auth/login` - Login with username and password
- `POST /api/auth/logout` - Logout and destroy session
- `GET /api/auth/session` - Check current session status

### 4. Authentication Middleware (`middleware/auth.middleware.js`)
Route protection:
- `requireAuth` - Require authentication (401 or redirect to login)
- `optionalAuth` - Attach admin info if authenticated
- `redirectIfAuthenticated` - Redirect to dashboard if already logged in

## Usage

### Creating Initial Admin

Run the seed script to create the default admin user:

```bash
npm run seed
```

Default credentials:
- Username: `admin`
- Password: `admin123`

**IMPORTANT:** Change the default password after first login!

You can customize the admin credentials using environment variables:
```bash
ADMIN_USERNAME=myadmin ADMIN_PASSWORD=securepass123 ADMIN_EMAIL=admin@example.com npm run seed
```

### API Usage Examples

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  -c cookies.txt
```

Response:
```json
{
  "success": true,
  "data": {
    "adminId": 1,
    "username": "admin",
    "loginTime": "2024-01-15T10:30:00.000Z",
    "expiresIn": 86400000
  }
}
```

#### Check Session
```bash
curl http://localhost:3000/api/auth/session \
  -b cookies.txt
```

Response:
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "admin": {
      "id": 1,
      "username": "admin",
      "email": "admin@liverussia.com",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

Response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Protecting Routes

Use the `requireAuth` middleware to protect routes:

```javascript
const { requireAuth } = require('./middleware/auth.middleware');

// Protect all routes in a router
router.use(requireAuth);

// Or protect specific routes
router.get('/api/testers', requireAuth, (req, res) => {
  // Only authenticated admins can access this
});
```

For HTML pages, add middleware in server.js:

```javascript
const { requireAuth } = require('./middleware/auth.middleware');

// Protect dashboard page
app.get('/dashboard.html', requireAuth, (req, res, next) => {
  next();
});
```

### Frontend Integration

The frontend should:

1. **Login Page** - Submit credentials to `/api/auth/login`
2. **Check Session** - Call `/api/auth/session` on page load
3. **Redirect** - Redirect to `/login.html` if not authenticated
4. **Logout** - Call `/api/auth/logout` when user clicks logout

Example JavaScript:

```javascript
// Login
async function login(username, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include' // Important for cookies
  });
  
  const data = await response.json();
  
  if (data.success) {
    window.location.href = '/dashboard.html';
  } else {
    alert(data.error.message);
  }
}

// Check session on page load
async function checkSession() {
  const response = await fetch('/api/auth/session', {
    credentials: 'include'
  });
  
  const data = await response.json();
  
  if (!data.data.authenticated) {
    window.location.href = '/login.html';
  }
}

// Logout
async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  
  window.location.href = '/login.html';
}
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with minimum 10 salt rounds
2. **Session Management**: Sessions stored in Redis with 24-hour TTL
3. **Secure Cookies**: HttpOnly, SameSite=lax cookies (secure in production)
4. **Session Regeneration**: New session ID created on login
5. **No Password Exposure**: Password hashes never returned in API responses

## Session Configuration

Sessions are configured in `server.js`:

- **Store**: Redis (prefix: `sess:`)
- **TTL**: 24 hours (86400 seconds)
- **Cookie Name**: `sessionId`
- **Cookie Settings**:
  - `httpOnly: true` - Prevents JavaScript access
  - `secure: true` (production only) - HTTPS only
  - `sameSite: 'lax'` - CSRF protection
  - `maxAge: 24 hours`

## Error Handling

The authentication system returns standardized error responses:

### 400 Bad Request
Missing username or password:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Username and password are required",
    "details": [
      { "field": "username", "message": "Username is required" }
    ]
  }
}
```

### 401 Unauthorized
Invalid credentials or no session:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid username or password"
  }
}
```

### 500 Internal Server Error
Server error:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred during login"
  }
}
```

## Requirements Validation

This implementation satisfies the following requirements:

- **11.1**: Login form with username and password ✓
- **11.2**: Valid credentials create authenticated session ✓
- **11.3**: Invalid credentials display error and deny access ✓
- **11.4**: Passwords hashed with bcrypt (minimum 10 salt rounds) ✓
- **11.5**: Unauthenticated users redirected to login page ✓
- **11.6**: Session maintained for 24 hours or until logout ✓
- **11.7**: Logout function terminates session ✓

## Testing

To test the authentication system:

1. Start the server: `npm start`
2. Create admin user: `npm run seed`
3. Test login endpoint with valid credentials
4. Test login endpoint with invalid credentials
5. Test session endpoint with and without authentication
6. Test logout endpoint
7. Test protected routes with and without authentication

## Troubleshooting

### "Redis error" on startup
- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check Redis connection URL in `.env` file

### "Failed to create session"
- Check Redis connection
- Verify session secret is set in `.env`

### "Admin user already exists"
- This is normal if you've already run the seed script
- To reset, delete the admin from the database and run seed again

### Session not persisting
- Ensure cookies are enabled in browser
- Check that `credentials: 'include'` is set in fetch requests
- Verify CORS settings allow credentials
