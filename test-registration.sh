#!/bin/bash
# Quick Registration Test Script

echo "╔════════════════════════════════════════════════════╗"
echo "║   Brand Connect Hub - Registration Test Guide     ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

echo "1️⃣  Checking Backend Server..."
if netstat -an | grep -q "5000.*LISTEN"; then
    echo "✅ Backend running on port 5000"
else
    echo "❌ Backend NOT running on port 5000"
    echo "   → Run: cd backend && npm run dev"
fi

echo ""
echo "2️⃣  Checking Frontend Server..."
if netstat -an | grep -q "5173.*LISTEN"; then
    echo "✅ Frontend running on port 5173"
else
    echo "❌ Frontend NOT running on port 5173"
    echo "   → Run: cd frontend && npm run dev"
fi

echo ""
echo "3️⃣  Database Check..."
if command -v psql &> /dev/null; then
    if psql -U postgres -d brand_connect_hub -c "\dt users" &>/dev/null; then
        echo "✅ Database 'brand_connect_hub' exists"
        echo "✅ Table 'users' found"
    else
        echo "❌ Database or tables not found"
        echo "   → Run: psql -U postgres -f database/schema.sql"
    fi
else
    echo "❌ PostgreSQL not installed or psql not in PATH"
fi

echo ""
echo "4️⃣  Environment Variables Check..."

# Check backend .env
if grep -q "JWT_SECRET" backend/.env; then
    echo "✅ Backend .env exists with JWT_SECRET"
else
    echo "❌ Backend .env missing JWT_SECRET"
fi

echo ""
echo "5️⃣  Test Registration Steps:"
echo ""
echo "🔐 Password Requirements (MUST have ALL):"
echo "   ✓ At least 8 characters"
echo "   ✓ One uppercase letter (A-Z)"
echo "   ✓ One lowercase letter (a-z)"
echo "   ✓ One number (0-9)"
echo "   ✓ One special character (@\$!%*?&)"
echo ""
echo "📝 Example Valid Password: MyPassword123@"
echo ""
echo "📧 Email OTP Verification:"
echo "   • If email is configured: Check your inbox"
echo "   • If NOT configured: Check backend console for OTP"
echo ""
echo "🚀 Now visit: http://localhost:5173/register"
echo ""
