@echo off
REM ========================================
REM LIVE RUSSIA Dashboard - GitHub Upload Script
REM ========================================
REM This script automates uploading your project to GitHub
REM Perfect for beginners who are new to Git!
REM ========================================

echo.
echo ========================================
echo   LIVE RUSSIA - GitHub Upload Tool
echo ========================================
echo.

REM Check if Git is installed
echo [1/6] Checking if Git is installed...
git --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Git is not installed!
    echo.
    echo Please install Git first:
    echo 1. Go to: https://git-scm.com/download/win
    echo 2. Download and install Git
    echo 3. Restart your computer
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)
echo ✅ Git is installed!
echo.

REM Check if already a git repository
if exist ".git" (
    echo [2/6] Git repository already initialized
    echo ✅ Skipping initialization
) else (
    echo [2/6] Initializing Git repository...
    git init
    if errorlevel 1 (
        echo ❌ ERROR: Failed to initialize Git repository
        pause
        exit /b 1
    )
    echo ✅ Git repository initialized!
)
echo.

REM Check if remote origin exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [3/6] Setting up GitHub connection...
    echo.
    echo Please enter your GitHub repository URL
    echo Example: https://github.com/username/live-russia-tester-dashboard.git
    echo.
    set /p REPO_URL="Repository URL: "
    
    if "!REPO_URL!"=="" (
        echo ❌ ERROR: No URL provided
        pause
        exit /b 1
    )
    
    git remote add origin !REPO_URL!
    if errorlevel 1 (
        echo ❌ ERROR: Failed to add remote repository
        pause
        exit /b 1
    )
    echo ✅ GitHub repository connected!
) else (
    echo [3/6] GitHub repository already connected
    for /f "delims=" %%i in ('git remote get-url origin') do set CURRENT_REMOTE=%%i
    echo ✅ Connected to: !CURRENT_REMOTE!
)
echo.

REM Add all files
echo [4/6] Adding all files to Git...
git add .
if errorlevel 1 (
    echo ❌ ERROR: Failed to add files
    pause
    exit /b 1
)
echo ✅ All files added!
echo.

REM Check if there are changes to commit
git diff-index --quiet HEAD -- >nul 2>&1
if errorlevel 1 (
    echo [5/6] Creating commit...
    git commit -m "Update: LIVE RUSSIA Tester Dashboard - %date% %time%"
    if errorlevel 1 (
        echo ❌ ERROR: Failed to create commit
        pause
        exit /b 1
    )
    echo ✅ Commit created!
) else (
    echo [5/6] No changes to commit
    echo ✅ Everything is up to date!
)
echo.

REM Push to GitHub
echo [6/6] Uploading to GitHub...
echo.
echo ⏳ This may take a minute...
echo.

REM Try to push, handle different scenarios
git push -u origin master 2>error.log
if errorlevel 1 (
    REM Try main branch if master fails
    git push -u origin main 2>error.log
    if errorlevel 1 (
        echo.
        echo ⚠️  Push failed. Trying to pull first...
        git pull origin master --allow-unrelated-histories 2>error.log
        if errorlevel 1 (
            git pull origin main --allow-unrelated-histories 2>error.log
        )
        
        echo Trying to push again...
        git push -u origin master 2>error.log
        if errorlevel 1 (
            git push -u origin main 2>error.log
            if errorlevel 1 (
                echo.
                echo ❌ ERROR: Failed to upload to GitHub
                echo.
                echo Common issues:
                echo 1. Wrong repository URL
                echo 2. No internet connection
                echo 3. Authentication failed
                echo.
                echo Error details:
                type error.log
                echo.
                echo Solutions:
                echo - Check your internet connection
                echo - Verify your GitHub repository URL
                echo - Make sure you have access to the repository
                echo - Use a Personal Access Token instead of password
                echo.
                echo To create a Personal Access Token:
                echo 1. Go to: https://github.com/settings/tokens
                echo 2. Click "Generate new token (classic)"
                echo 3. Select "repo" scope
                echo 4. Copy the token and use it as your password
                echo.
                del error.log 2>nul
                pause
                exit /b 1
            )
        )
    )
)

REM Clean up error log
del error.log 2>nul

echo.
echo ========================================
echo   ✅ SUCCESS!
echo ========================================
echo.
echo Your LIVE RUSSIA Tester Dashboard has been uploaded to GitHub!
echo.
echo Next steps:
echo 1. Go to your GitHub repository in your browser
echo 2. Refresh the page to see your files
echo 3. Check that all files are there
echo.
echo To update your project in the future:
echo - Just run this script again!
echo - Or use: git add . ^&^& git commit -m "message" ^&^& git push
echo.
echo Want to deploy your dashboard online?
echo - Check out the GITHUB_GUIDE.md file
echo - Section: "Next Steps - Deploy Your Dashboard Online"
echo.
pause
