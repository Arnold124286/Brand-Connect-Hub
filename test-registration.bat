@echo off
REM Brand Connect Hub - Registration Test Guide (Windows)

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   Brand Connect Hub - Registration Test Guide     ║
echo ╚════════════════════════════════════════════════════╝
echo.

echo 1️⃣  Checking Backend Server...
netstat -an | find "5000" >nul && (
    echo ✅ Backend running on port 5000
) || (
    echo ❌ Backend NOT running on port 5000
    echo    Run: cd backend ^&^& npm run dev
)

echo.
echo 2️⃣  Checking Frontend Server...
netstat -an | find "5173" >nul && (
    echo ✅ Frontend running on port 5173
) || (
    echo ❌ Frontend NOT running on port 5173
    echo    Run: cd frontend ^&^& npm run dev
)

echo.
echo 3️⃣  Database Check...
psql -U postgres -d brand_connect_hub -c "\dt users" >nul 2>&1 && (
    echo ✅ Database 'brand_connect_hub' exists
    echo ✅ Table 'users' found
) || (
    echo ❌ Database or tables not found
    echo    Run: psql -U postgres -f database/schema.sql
)

echo.
echo 4️⃣  Environment Variables Check...

findstr "JWT_SECRET" backend\.env >nul && (
    echo ✅ Backend .env exists with JWT_SECRET
) || (
    echo ❌ Backend .env missing JWT_SECRET
)

echo.
echo 5️⃣  Test Registration Steps:
echo.
echo 🔐 Password Requirements (MUST have ALL):
echo    ✓ At least 8 characters
echo    ✓ One uppercase letter (A-Z)
echo    ✓ One lowercase letter (a-z)
echo    ✓ One number (0-9)
echo    ✓ One special character (@$!%%*?^&)
echo.
echo 📝 Example Valid Password: MyPassword123@
echo.
echo 📧 Email OTP Verification:
echo    - If email is configured: Check your inbox
echo    - If NOT configured: Check backend console for OTP
echo.
echo 🚀 Now visit: http://localhost:5173/register
echo.
pause
