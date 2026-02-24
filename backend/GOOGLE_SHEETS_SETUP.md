# Google Sheets Integration Setup Guide

This guide explains how to set up Google Sheets API integration for the LIVE RUSSIA Tester Dashboard.

## Prerequisites

1. Google Cloud Console account
2. Google Sheets spreadsheet for storing tester data

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted
4. Choose "Desktop application" as the application type
5. Name your OAuth 2.0 client (e.g., "LIVE RUSSIA Dashboard")
6. Download the credentials JSON file

## Step 3: Get Refresh Token

You need to obtain a refresh token for server-to-server authentication:

1. Install Google's OAuth 2.0 Playground or use a script
2. Use the following scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
3. Exchange the authorization code for a refresh token

### Using OAuth 2.0 Playground

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon and check "Use your own OAuth credentials"
3. Enter your Client ID and Client Secret
4. In Step 1, enter: `https://www.googleapis.com/auth/spreadsheets`
5. Click "Authorize APIs"
6. In Step 2, click "Exchange authorization code for tokens"
7. Copy the refresh token

## Step 4: Create Google Spreadsheet

1. Create a new Google Spreadsheet
2. Set up the header row in the first row:
   ```
   A1: ID
   B1: Name  
   C1: Email
   D1: Nickname
   E1: Telegram
   F1: Device Type
   G1: OS
   H1: OS Version
   I1: Registration Date
   J1: Status
   ```
3. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```

## Step 5: Configure Environment Variables

Add the following to your `.env` file:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

## Step 6: Alternative Configuration (JSON File)

Instead of environment variables, you can create a credentials file:

1. Create `backend/config/google-credentials.json`:
   ```json
   {
     "client_id": "your-google-client-id.googleusercontent.com",
     "client_secret": "your-google-client-secret",
     "redirect_uri": "urn:ietf:wg:oauth:2.0:oob",
     "refresh_token": "your-refresh-token"
   }
   ```

2. Make sure to add this file to `.gitignore` to keep credentials secure

## Step 7: Test the Integration

1. Start your server
2. Register a new tester through the API
3. Check that the data appears in your Google Spreadsheet
4. Use the API endpoints to test functionality:

### Test Endpoints

```bash
# Check connection status
GET /api/testers/google-sheets/status

# Load testers from Google Sheets
GET /api/testers/google-sheets/load

# Sync testers from Google Sheets to database
POST /api/testers/google-sheets/sync

# Retry failed operations
POST /api/testers/google-sheets/retry
```

## Features

### Automatic Synchronization
- New tester registrations are automatically added to Google Sheets
- Tester updates are synced to Google Sheets
- Failed operations are queued for retry

### Retry Mechanism
- Failed operations are automatically retried after 60 seconds
- Exponential backoff: 60s, 120s, 240s (max 5 minutes)
- Maximum 3 retry attempts per operation
- Manual retry trigger available via API

### Error Handling
- Graceful handling of API unavailability
- Empty cell handling in spreadsheet parsing
- Validation of spreadsheet structure
- Detailed error logging with timestamps

### Data Mapping

| Spreadsheet Column | Database Field | Description |
|-------------------|----------------|-------------|
| A (ID) | id | Tester ID |
| B (Name) | name | Full name |
| C (Email) | email | Email address |
| D (Nickname) | nickname | Optional nickname |
| E (Telegram) | telegram | Telegram username/ID |
| F (Device Type) | deviceType | smartphone/tablet |
| G (OS) | os | Android/iOS |
| H (OS Version) | osVersion | OS version string |
| I (Registration Date) | registrationDate | ISO timestamp |
| J (Status) | status | active/inactive/suspended |

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check that your credentials are correct
   - Ensure the Google Sheets API is enabled
   - Verify the refresh token is valid

2. **Spreadsheet Not Found**
   - Check the spreadsheet ID in your configuration
   - Ensure the service account has access to the spreadsheet

3. **Permission Denied**
   - Make sure the OAuth client has the correct scopes
   - Check that the spreadsheet is accessible

4. **Rate Limiting**
   - Google Sheets API has rate limits
   - The retry mechanism handles temporary rate limit errors

### Logs

Check the server logs for detailed error messages:
- Authentication success/failure
- Sync operation results
- Retry queue status
- API connection status

### Manual Testing

You can test the Google Sheets service directly:

```javascript
const googleSheetsService = require('./services/googleSheets.service');

// Test connection
googleSheetsService.checkConnection()
  .then(connected => console.log('Connected:', connected))
  .catch(error => console.error('Error:', error));

// Test fetching data
googleSheetsService.fetchTesters()
  .then(testers => console.log('Testers:', testers.length))
  .catch(error => console.error('Error:', error));
```

## Security Notes

- Never commit credentials to version control
- Use environment variables or secure credential files
- Regularly rotate OAuth tokens
- Monitor API usage and access logs
- Restrict spreadsheet access to necessary users only