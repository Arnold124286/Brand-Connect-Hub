# ✅ Registration Fix Verification Checklist

Use this checklist to verify all fixes are working.

## Pre-Flight Checks

- [ ] PostgreSQL is running
- [ ] Database `brand_connect_hub` exists
- [ ] Backend dependencies installed: `cd backend && npm install`
- [ ] Frontend dependencies installed: `cd frontend && npm install`
- [ ] Backend `.env` file exists with required variables
- [ ] Backend `.env` has `JWT_SECRET` set
- [ ] Backend `.env` has `DB_PASSWORD` matching your PostgreSQL password

## Service Startup

- [ ] **Backend**: Run `cd backend && npm run dev`
  - Should show: "Server running on port 5000"
  - Should show successful DB connection
  
- [ ] **Frontend**: Run `cd frontend && npm run dev` (new terminal)
  - Should show: "VITE v5... ready in X ms"
  - Should mention port 5173

## Port Verification

- [ ] Backend accessible: http://localhost:5000
- [ ] Frontend accessible: http://localhost:5173
- [ ] No "port already in use" errors

## Registration Page

- [ ] Visit: http://localhost:5173/register
- [ ] Page loads without errors
- [ ] Form displays all fields:
  - [ ] Full Name
  - [ ] Email
  - [ ] Password (with visibility toggle)
  - [ ] Repeat Password
  - [ ] User Type selector (Brand/Vendor)
  - [ ] Next/Back navigation buttons

## Password Validation UI

When filling password field, verify:
- [ ] Checklist appears below password input
- [ ] Shows 5 requirements:
  - [ ] ✓/❌ At least 8 characters
  - [ ] ✓/❌ Uppercase letter
  - [ ] ✓/❌ Lowercase letter
  - [ ] ✓/❌ Number
  - [ ] ✓/❌ Special character (@$!%*?&)
- [ ] Checkmarks turn green when met
- [ ] X marks turn red when not met
- [ ] Real-time updates as you type

## Test Registration Flow

### Test Case 1: Invalid Password
- [ ] Use password: `password`
- [ ] See: "Password needs: uppercase letter, number, special character..."
- [ ] Submit button disabled or form shows error

### Test Case 2: Valid Password
- [ ] Use password: `MyPassword123@`
- [ ] All 5 checkmarks show green ✓
- [ ] Enter email: `test@example.com`
- [ ] Select user type: Brand or Vendor
- [ ] Click "Complete Sign Up"
- [ ] Should succeed (or show "Email already registered" if used before)

### Test Case 3: Password Mismatch
- [ ] Password: `MyPassword123@`
- [ ] Repeat: `MyPassword123` (different)
- [ ] Try to submit
- [ ] See error: "Passwords do not match"

## Backend Verification

- [ ] Check backend console after registration attempt
- [ ] Should see log: "Registration failed:" or "Registration successful"
- [ ] If email not configured, should see OTP printed:
  ```
  --------------------------------------------------
  Email to: test@example.com
  Subject: Verify your Brand Connect Hub account
  ...
  OTP: 123456
  --------------------------------------------------
  ```

## Database Verification

After successful registration:
```sql
-- Check if user was created
psql -U postgres -d brand_connect_hub
SELECT email, full_name, user_type FROM users WHERE email='test@example.com';
```

- [ ] User record exists
- [ ] user_type is correct (brand or vendor)
- [ ] full_name is saved correctly

## OTP Page

After registration:
- [ ] Redirected to: http://localhost:5173/verify-otp
- [ ] Page shows email field (pre-filled with registration email)
- [ ] Page shows OTP input field (6 digits)
- [ ] Instructions to check email or console

## OTP Verification

- [ ] Find OTP from:
  - [ ] Email (if configured), OR
  - [ ] Backend console output
- [ ] Enter OTP on verification page
- [ ] OTP should be valid for 10 minutes
- [ ] Click verify
- [ ] Should see success message

## Browser Console Check

Open DevTools (F12) and check Console tab:
- [ ] No red error messages
- [ ] No 404s for `/api/auth/register`
- [ ] Network request shows `POST /api/auth/register`
- [ ] Response status: 201 (Created)
- [ ] Response includes: `token`, `user`, `message`

## Network Tab Check

In DevTools Network tab:
- [ ] Find request: `/api/auth/register`
- [ ] Method: POST
- [ ] Status: 201 Created
- [ ] Request Payload shows:
  ```json
  {
    "email": "test@example.com",
    "password": "MyPassword123@",
    "fullName": "Test User",
    "userType": "brand",
    "phone": "+254..."
  }
  ```
- [ ] Response shows:
  ```json
  {
    "token": "eyJhbGc...",
    "user": { "uid": "...", "email": "..." },
    "message": "Registration successful..."
  }
  ```

## LocalStorage Verification

In DevTools Console:
```javascript
// Should show token and user data saved
console.log(localStorage.getItem('bch_token'));
console.log(localStorage.getItem('bch_user'));
```

- [ ] Both values are non-empty
- [ ] User object has: uid, email, fullName, userType

## Email Configuration (Optional)

If you want to enable email OTP delivery:

- [ ] Go to: https://myaccount.google.com/security
- [ ] Enable "2-Step Verification"
- [ ] Go to: https://myaccount.google.com/apppasswords
- [ ] Create app password
- [ ] Update `backend/.env`:
  ```
  EMAIL_USER=your.email@gmail.com
  EMAIL_PASS=xxxx xxxx xxxx xxxx
  ```
- [ ] Restart backend server
- [ ] Test registration again
- [ ] Should receive OTP email

## Full End-to-End Test

Complete flow without external email:

1. [ ] Start backend: `npm run dev` (port 5000)
2. [ ] Start frontend: `npm run dev` (port 5173)
3. [ ] Visit: http://localhost:5173/register
4. [ ] Fill form with valid data:
   - Name: `Test User`
   - Email: `test+$(date +%s)@example.com` (unique)
   - Password: `MyPassword123@`
   - User Type: Brand
   - Phone: `+254700000000`
5. [ ] Submit registration
6. [ ] Verify redirected to `/verify-otp`
7. [ ] Get OTP from backend console
8. [ ] Enter OTP and verify
9. [ ] Check user created in database
10. [ ] Check localStorage has token

## Success Criteria

- ✅ All form validations work correctly
- ✅ Password strength checker shows real-time feedback
- ✅ Registration submits without errors
- ✅ User record created in database
- ✅ OTP generated (received via email or console)
- ✅ OTP verification works
- ✅ Redirect happens correctly
- ✅ No console errors
- ✅ Backend logs show no exceptions

## If Any Check Fails

1. **Review the logs**:
   - Backend console for errors
   - Browser console (DevTools F12)
   - Browser Network tab for API responses

2. **Check environment**:
   - Verify `.env` values are correct
   - Verify database is running and accessible
   - Verify ports 5000 and 5173 are available

3. **Review documentation**:
   - See: `REGISTRATION_TROUBLESHOOTING.md`
   - See: `REGISTRATION_FIX_SUMMARY.md`

---

**🎉 If all checks pass, registration is fixed and working!**
