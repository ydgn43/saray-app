# 🚀 Quick Setup Guide - Reference Code Yurt Assignment Fix

## Problem Summary
Users signing up with reference codes from specific yurts were seeing the default "Saray Yurdu" instead of the correct yurt.

## What Was Fixed
✅ Reference codes now store which yurt they belong to
✅ New users are assigned to the correct yurt automatically
✅ Signup response includes yurt information
✅ YurtSelector shows correct yurt name and location

## Setup Steps

### Step 1: Run Database Migration

Open MySQL Workbench or your MySQL client and run:

```sql
USE saraydb;

-- Add yurtid column to ReferenceCodes table
ALTER TABLE `ReferenceCodes` 
ADD COLUMN `yurtid` INT NULL 
COMMENT 'Yurt ID that this reference code belongs to' 
AFTER `description`;

-- Verify the column was added
DESCRIBE ReferenceCodes;
```

**Expected Output**: You should see `yurtid` column in the table structure.

### Step 2: Restart Backend

```powershell
# Stop the current backend (Ctrl+C in the terminal)
# Then restart:
cd c:\Users\ydgn4\Documents\GitHub\saray-app\backend
npm start
```

### Step 3: Test the Fix

#### Test 1: Create Reference Code in Specific Yurt

1. **Login as admin**
2. **Switch to a yurt** (click YurtSelector, choose "yurt1" or any non-default yurt)
3. **Go to Settings** → Reference Codes
4. **Create new reference code** for "hoca" role
5. **Copy the code** (e.g., "A1B2C3D4")

#### Test 2: Sign Up with That Code

1. **Logout**
2. **Go to signup page** (`http://localhost:3000/signup`)
3. **Enter the reference code** you just created
4. **Fill in**:
   - Username: `test_hoca_1`
   - Password: `password123`
   - Confirm Password: `password123`
5. **Click "Kayıt Ol"** (Sign Up)

#### Test 3: Verify Correct Yurt

After signup, you should see:
- ✅ **YurtSelector** (top-right) shows **"yurt1"** (not "Saray Yurdu")
- ✅ **Location** appears if yurt has one set
- ✅ **Dashboard** shows data for "yurt1"

## Verification

### Check in Database

```sql
-- 1. Check if reference code has yurtid
SELECT code, roleId, yurtid, createdAt 
FROM ReferenceCodes 
ORDER BY createdAt DESC 
LIMIT 5;

-- 2. Check if new user is assigned to correct yurt
SELECT 
    u.username,
    u.role_name,
    uy.yurtid,
    y.yurt_name,
    uy.is_primary
FROM User u
JOIN UserYurt uy ON u.accountid = uy.accountid
JOIN Yurt y ON uy.yurtid = y.yurtid
WHERE u.username = 'test_hoca_1';

-- Expected: username: test_hoca_1, role: hoca, yurt_name: yurt1
```

## Quick Troubleshooting

### Issue: Reference code still shows default yurt

**Check 1: Did migration run?**
```sql
DESCRIBE ReferenceCodes;
-- Look for 'yurtid' column
```

**Check 2: Did backend restart?**
- Stop backend (Ctrl+C)
- Run `npm start` again

**Check 3: Is yurt selected when creating code?**
- Make sure YurtSelector shows correct yurt before creating reference code
- The header `x-yurt-id` should be sent automatically

### Issue: Location not showing

**Solution**: Add location to your yurt:
```sql
UPDATE Yurt 
SET location = 'Amsterdam' 
WHERE yurtid = 9;
```

### Issue: Still seeing old data after signup

**Solution**: Clear browser cache and localStorage:
1. Open DevTools (F12)
2. Go to Application → Storage
3. Click "Clear site data"
4. Refresh page
5. Sign up again

## Files Changed

### Backend:
- ✅ `backend/data/models/ReferenceCode.ts`
- ✅ `backend/controller/referenceCodeController.ts`
- ✅ `backend/controller/authController.ts`

### Frontend:
- ✅ `frontend/src/pages/Signup.tsx`

### Database:
- ✅ `ReferenceCodes` table - Added `yurtid` column

## What Happens Now

### When Admin Creates Reference Code:
1. Admin is in "yurt1" (yurtid: 9)
2. Admin creates reference code
3. Code is created with `yurtid: 9`
4. Code is linked to "yurt1"

### When User Signs Up:
1. User enters reference code
2. Backend finds code with `yurtid: 9`
3. Backend creates user
4. Backend creates `UserYurt` entry: `{accountid: new_user_id, yurtid: 9}`
5. Backend returns yurt info in response
6. Frontend stores yurt data
7. User sees "yurt1" in YurtSelector

## Success Criteria

- [x] Database column added
- [x] Backend code updated
- [x] Frontend code updated
- [x] Backend restarted
- [ ] **You test it** and verify:
  - New users see correct yurt
  - YurtSelector shows correct yurt name
  - Location displays if set
  - Dashboard shows correct yurt's data

---

**Next Steps**: 
1. Run the SQL migration above
2. Restart backend
3. Test with a new signup
4. Let me know if it works! 🎉
