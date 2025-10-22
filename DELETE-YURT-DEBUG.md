# 🐛 Delete Yurt - Debugging Guide

## What I Added

### Frontend Logging (`YurtSelector.tsx`):
```javascript
console.log('🗑️ Deleting yurt:', yurtId, yurtName);
console.log('DELETE URL:', url);
console.log('Token exists:', !!token);
console.log('Response status:', response.status);
console.log('Response ok:', response.ok);
console.log('Response data:', data);
```

### Backend Logging (`yurtController.ts`):
```typescript
console.log('🗑️ DELETE yurt request:', { yurtid, userId, userRole });
console.log('   Admin has access:', hasAccess);
console.log('   Admin yurt count:', yurtCount);
console.log('   Proceeding with deletion...');
console.log('   ✅ Yurt deleted successfully');
```

## How to Test

### Step 1: Restart Backend
```bash
cd backend
npm start
# or
node app.js
```

### Step 2: Open Browser
1. Open your app
2. Open DevTools (F12)
3. Go to Console tab
4. Clear the console (Ctrl+L or click clear button)

### Step 3: Try to Delete a Yurt
1. Click YurtSelector (building icon)
2. Click the red trash icon on any yurt (not your last one)
3. Watch the console output

## Expected Console Output

### Frontend (Browser Console):
```
🗑️ Deleting yurt: 7 Test Yurt
DELETE URL: http://localhost:3001/yurts/7
Token exists: true
Response status: 200
Response ok: true
Response data: {message: "Yurt deleted successfully", success: true}
```

### Backend (Terminal):
```
🗑️ DELETE yurt request: { yurtid: '7', userId: 1, userRole: 'admin' }
   Admin has access: true
   Admin yurt count: 5
   Proceeding with deletion...
   ✅ Yurt deleted successfully
```

## Common Issues & Solutions

### Issue 1: No console log appears
**Problem:** Click handler not being called

**Check:**
- Is the trash icon visible?
- Try clicking directly on the trash icon, not the yurt row
- Check browser console for JavaScript errors

**Solution:** Event propagation issue - the parent div's onClick might be blocking it

---

### Issue 2: "Token exists: false"
**Problem:** User not authenticated

**Check:**
```javascript
localStorage.getItem('token')
```

**Solution:** 
- Logout and login again
- Token might have expired

---

### Issue 3: "Response status: 403"
**Problem:** "You do not have permission to delete this yurt"

**Backend Log:**
```
Admin has access: false
```

**Solution:**
- You don't have access to this yurt
- Check UserYurt table:
  ```sql
  SELECT * FROM UserYurt WHERE accountid = YOUR_ID AND yurtid = YURT_ID;
  ```

---

### Issue 4: "Response status: 400"
**Problem:** "Cannot delete your last yurt"

**Backend Log:**
```
Admin yurt count: 1
```

**Solution:**
- This is correct behavior - you must keep at least one yurt
- Delete button should be hidden if you only have 1 yurt
- Check: How many yurts do you have?

---

### Issue 5: "Response status: 404"
**Problem:** Route not found

**Check:**
- Is backend running?
- Check backend logs for the request
- Try accessing: http://localhost:3001/yurts manually

**Solution:**
- Restart backend server
- Check that `yurtRoute.ts` is properly registered in `app.ts`

---

### Issue 6: "Response status: 500"
**Problem:** Server error

**Backend Log:**
```
❌ Delete yurt error: [error details]
```

**Solution:**
- Check backend terminal for full error
- Likely database connection issue or yurtService error

---

### Issue 7: CORS Error
**Problem:** "Access to fetch has been blocked by CORS policy"

**Solution:**
- Backend CORS not configured for frontend origin
- Check `app.ts` CORS configuration

---

### Issue 8: Network Error
**Problem:** "Failed to fetch"

**Check:**
- Is backend running on port 3001?
- Check `config.js` API_BASE_URL

**Solution:**
```javascript
// In browser console
console.log('API URL:', config.API_BASE_URL);
```

## Manual API Test

If delete still doesn't work, test the API directly in browser console:

```javascript
const token = localStorage.getItem('token');
const yurtId = 7; // Change to your yurt ID

fetch('http://localhost:3001/yurts/' + yurtId, {
    method: 'DELETE',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    }
})
.then(r => {
    console.log('Status:', r.status);
    return r.json();
})
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

## What to Share

If delete still doesn't work, please share:

1. **Frontend Console Output** (all logs when clicking delete)
2. **Backend Terminal Output** (logs from backend)
3. **Network Tab** (the DELETE request details)
4. **Any error messages**

## Quick Checks

```javascript
// Check your yurts
console.log('Available yurts:', JSON.parse(localStorage.getItem('availableYurts')));

// Check your token
console.log('Token:', localStorage.getItem('token')?.substring(0, 50) + '...');

// Check backend URL
console.log('API Base URL:', config.API_BASE_URL);

// Check if you have access to delete
const yurtId = 7; // Your yurt ID
fetch('http://localhost:3001/yurt-management/my-yurts', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(d => {
    console.log('Your yurts:', d.data);
    console.log('Can delete yurt ' + yurtId + '?', 
        d.data.some(y => y.yurtId === yurtId) && d.data.length > 1
    );
});
```

---

**Next Step:** Try deleting a yurt and share the console output from both frontend and backend!
