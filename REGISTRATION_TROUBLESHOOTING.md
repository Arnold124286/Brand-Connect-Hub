# Registration Troubleshooting Guide

## Issues Found & Fixed

### 1. **Password Validation Mismatch** ✅ FIXED
**Problem**: Backend required passwords with uppercase, lowercase, number, AND special character, but frontend only checked length.

**Solution**: 
- Updated frontend Register.jsx with password strength checker
- Now shows real-time feedback on password requirements:
  - ✓ At least 8 characters
  - ✓ Uppercase letter (A-Z)
  - ✓ Lowercase letter (a-z)
  - ✓ Number (0-9)
  - ✓ Special character (@$!%*?&)

**Example Valid Password**: `MyPassword123@`

---

## What To Check Next

### 2. **Email Configuration** (Check before testing)
The registration process generates an OTP and sends it via email. 

**Current Status**: Your `.env` has placeholder values:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**To Enable Email Verification:**

1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Windows Computer" (or your device)
5. Google will show you a 16-character password
6. Copy and update `.env`:
   ```
   EMAIL_USER=your.actual.email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   ```

**Without Email Setup**: 
- Registration will still complete and return a token
- The OTP will be logged to server console (development mode)
- You can find the OTP in backend terminal output

---

## Testing Registration Flow

### Step 1: Ensure Backend is Running
```bash
cd backend
npm run dev
```

### Step 2: Ensure Frontend is Running
```bash
cd frontend
npm run dev
```

### Step 3: Test Registration

**Use a password like**: `Test@Password123`

The form will now validate:
- ✅ Length check
- ✅ Uppercase check
- ✅ Lowercase check  
- ✅ Number check
- ✅ Special character check

### Step 4: OTP Verification

After successful registration, you'll be taken to `/verify-otp`

**If email is configured**: Check your email inbox for the OTP

**If email is NOT configured**: 
- Check backend terminal for log like:
  ```
  --------------------------------------------------
  Email to: user@example.com
  Subject: Verify your Brand Connect Hub account
  Body: ...
  OTP: 123456
  --------------------------------------------------
  ```

---

## Common Errors & Solutions

### Error: "Password must include uppercase, lowercase, number, and special character"
**Cause**: Password doesn't meet requirements
**Solution**: Use password like `Test@123` (has uppercase, lowercase, number, special char)

### Error: "Email already registered"
**Cause**: Email already exists in database
**Solution**: Use a different email or reset database if testing

### Error: "Registration failed" 
**Cause**: Usually database connection issue
**Solution**: 
1. Verify PostgreSQL is running: `psql -U postgres`
2. Check database exists: `psql -U postgres -l | grep brand_connect_hub`
3. If not created, run: `psql -U postgres -f database/schema.sql`

### Error: "Invalid or expired OTP"
**Cause**: OTP is wrong or older than 10 minutes
**Solution**: 
- OTP expires in 10 minutes
- Request new registration to get new OTP
- Check the correct OTP from console or email

---

## Database Check

Make sure the database has required tables:

```bash
# Connect to database
psql -U postgres -d brand_connect_hub

# Check if otp_codes table exists
\dt otp_codes

# Check if users table exists
\dt users
```

If tables don't exist, initialize schema:
```bash
psql -U postgres -d brand_connect_hub -f database/schema.sql
```

---

## Frontend Environment Variables

Check `frontend/.env` (if exists) or `vite.config.js` for API_URL:

Should match your backend:
```
VITE_API_URL=http://localhost:5000
```

---

## Full Registration Checklist

- [ ] Backend `.env` has correct DB credentials
- [ ] PostgreSQL database is running
- [ ] Database schema initialized (`schema.sql` applied)
- [ ] Backend running on port 5000: `npm run dev` from `/backend`
- [ ] Frontend running on port 5173: `npm run dev` from `/frontend`
- [ ] Frontend VITE_API_URL points to `http://localhost:5000`
- [ ] Password meets requirements (8+ chars, uppercase, lowercase, number, special)
- [ ] Email is valid format
- [ ] OTP received (via email or backend console)
- [ ] OTP entered correctly (6 digits, within 10 minutes)

---

## Email Setup (Optional but Recommended)

Without proper email configuration:
- Users won't receive OTP via email
- Development OTP prints to server console
- Not suitable for production

To enable for testing with Gmail:
1. Create Google App Password (steps above)
2. Update `.env` with credentials
3. Restart backend server
4. Test registration again

---

## Still Having Issues?

1. **Check backend logs**: Look for error messages in terminal
2. **Check browser console**: Open DevTools (F12) → Console tab
3. **Check network requests**: Open DevTools → Network tab → look for `/api/auth/register` response
4. **Verify database**: Run `psql` commands to check tables exist
5. **Restart services**: Kill and restart both backend and frontend servers

