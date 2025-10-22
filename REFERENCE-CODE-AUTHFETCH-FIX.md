# ✅ Fixed: Reference Code Yurt Assignment

## Problem
Reference codes were being created without yurt association, even though the user was in a specific yurt.

## Root Cause
The `ReferenceCodeManagement.tsx` component was using plain `fetch()` instead of `authFetch()`, so the `X-Yurt-Id` header wasn't being sent to the backend.

## Solution

### Changed in `frontend/src/pages/ReferenceCodeManagement.tsx`:

**Before:**
```typescript
const response = await fetch(`${API_BASE_URL}/reference-codes`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(formData)
});
```

**After:**
```typescript
import { authFetch } from '../utils/authFetch';

const response = await authFetch(`${API_BASE_URL}/reference-codes`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
});
```

### What `authFetch` Does:

The `authFetch` utility automatically adds:
1. ✅ Authorization header with token
2. ✅ **`X-Yurt-Id` header** with current yurt ID from localStorage

```typescript
// From utils/authFetch.ts
const selectedYurt = JSON.parse(localStorage.getItem('selectedYurt'));
options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    'X-Yurt-Id': selectedYurt.yurtId.toString() // ← THIS IS THE KEY!
};
```

### Backend Receives and Stores:

```typescript
// From backend/controller/referenceCodeController.ts
const yurtid = req.headers['x-yurt-id'] ? Number(req.headers['x-yurt-id']) : null;

const referenceCode = await ReferenceCode.create({
    code,
    roleId: dbRoleName,
    createdBy: user.accountid,
    yurtid: yurtid, // ← Stored in database
    // ...
});
```

## Testing Steps

### 1. Restart Backend
```powershell
cd c:\Users\ydgn4\Documents\GitHub\saray-app\backend
npm start
```

Watch the console for these logs when creating a reference code:
```
📝 Creating reference code:
   - x-yurt-id header: 9
   - Parsed yurtid: 9
   - roleId from body: Teacher
   - Mapped role: Teacher → hoca
✅ Reference code created successfully:
   - Code: A1B2C3D4
   - Role: hoca
   - Yurt ID: 9
```

### 2. Test in Browser

1. **Login as admin**
2. **Switch to a yurt** (e.g., "yurt1" with ID 9)
3. **Go to Settings** → Reference Codes
4. **Open DevTools** (F12) → Network tab
5. **Create a reference code**
6. **Check the request**:
   - Look for POST to `/reference-codes`
   - Check Request Headers
   - Should see: `X-Yurt-Id: 9`

### 3. Verify in Database

```sql
-- Check the newly created reference code
SELECT 
    code,
    roleId,
    yurtid,
    createdAt
FROM ReferenceCodes
ORDER BY createdAt DESC
LIMIT 5;
```

**Expected**: The `yurtid` column should show `9` (or whatever yurt you're in).

### 4. Test Signup Flow

1. **Copy the reference code** you just created
2. **Logout**
3. **Go to signup page**
4. **Sign up with that code**
5. **After login, check YurtSelector** → Should show "yurt1" (not "Saray Yurdu")

## Files Modified

### Frontend:
- ✅ `frontend/src/pages/ReferenceCodeManagement.tsx`
  - Imported `authFetch`
  - Replaced all `fetch()` calls with `authFetch()`
  - Removed manual Authorization headers (authFetch handles it)

### Backend:
- ✅ `backend/controller/referenceCodeController.ts`
  - Added detailed logging for yurt ID
  - Confirms header reception and storage

## How It Works Now

### Flow: Admin Creates Reference Code

1. **Admin switches to "yurt1"** (ID: 9)
   - YurtSelector updates `localStorage.selectedYurt`
2. **Admin clicks "Create Reference Code"**
   - Frontend calls `authFetch()`
3. **authFetch reads localStorage**
   - Gets `selectedYurt.yurtId = 9`
   - Adds `X-Yurt-Id: 9` to request headers
4. **Backend receives request**
   - Reads `req.headers['x-yurt-id']` = "9"
   - Parses to number: `yurtid = 9`
5. **Backend creates reference code**
   - Saves to database with `yurtid: 9`
6. **User signs up with this code**
   - Backend reads `yurtid: 9` from reference code
   - Creates `UserYurt` entry with `yurtid: 9`
7. **User sees "yurt1"** in YurtSelector ✅

## Console Output Examples

### Browser Console (authFetch):
```
authFetch {
  url: 'http://localhost:3001/reference-codes',
  token: 'eyJhbGciOiJIUzI1NiIs...',
  yurtId: 9,
  headers: {
    'Authorization': 'Bearer eyJhbGci...',
    'Content-Type': 'application/json',
    'X-Yurt-Id': '9'
  }
}
```

### Backend Console:
```
📝 Creating reference code:
   - x-yurt-id header: 9
   - Parsed yurtid: 9
   - roleId from body: Teacher
   - Mapped role: Teacher → hoca
Role found: hoca
✅ Reference code created successfully:
   - Code: A1B2C3D4
   - Role: hoca
   - Yurt ID: 9
```

## Troubleshooting

### Issue: Still seeing yurtid as null

**Check 1: Is a yurt selected?**
```javascript
// In browser console
console.log(localStorage.getItem('selectedYurt'));
// Should show: {"yurtId":9,"yurtName":"yurt1",...}
```

**Check 2: Is authFetch being used?**
```javascript
// Check Network tab in DevTools
// Look for X-Yurt-Id header in request
```

**Check 3: Did backend restart?**
- After code changes, backend must restart to pick up new code

### Issue: authFetch not found

**Solution**: Make sure the import is correct:
```typescript
import { authFetch } from '../utils/authFetch';
```

## Summary

The fix was simple but critical:
- **Problem**: Using `fetch()` → No yurt header sent
- **Solution**: Using `authFetch()` → Yurt header automatically included
- **Result**: Reference codes now remember which yurt they belong to ✅

---

**Status**: ✅ FIXED
**Date**: October 22, 2025
**Files Modified**: 2 (frontend ReferenceCodeManagement, backend referenceCodeController)
