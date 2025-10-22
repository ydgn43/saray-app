# Quick Guide: Complete Enhanced Multi-Yurt System

## Phase 1: Database Migration ✅ READY
```bash
# Run this on your MySQL database
mysql -u root -p SarayDb < db/UserYurtAccess-Migration.sql
```

**What it does:**
- Creates UserYurt junction table
- Creates AdminSignupRequest table
- Migrates existing users to UserYurt
- Grants super-admins access to all yurts

## Phase 2: Backend Controller Updates ⏳ IN PROGRESS

### Option A: Use PowerShell Script (Recommended)
```powershell
cd backend
.\update-controllers-yurtid.ps1
```

### Option B: Manual Updates
Replace in these files:
- studentController.ts (8 times)
- attendanceController.ts (7 times)
- classController.ts (3 times)
- seasonController.ts (3 times)
- programController.ts (4 times)
- userController.ts (1 time)

**Change:**
```typescript
const yurtid = req.user!.yurtid;  // OLD
```
**To:**
```typescript
const yurtid = req.selectedYurtId!;  // NEW
```

### Verify Compilation
```bash
cd backend
npx tsc
```

## Phase 3: Backend Route Updates ⏳ PENDING

Add `validateYurtAccess` middleware to all protected routes.

### Example for studentRoute.ts:
```typescript
import { validateYurtAccess } from '../middleware/validateYurtAccess';

// Apply to all routes that need yurt filtering
router.get('/all', authenticateJWT, validateYurtAccess, studentController.getAllStudents);
```

**Files to update:**
1. routes/studentRoute.ts
2. routes/attendanceRoute.ts
3. routes/classRoute.ts
4. routes/seasonRoute.ts
5. routes/programRoute.ts
6. routes/userRoute.ts

## Phase 4: Frontend Updates ⏳ PENDING

### A. Update AuthContext.tsx

Add new state:
```typescript
const [availableYurts, setAvailableYurts] = useState<YurtInfo[]>([]);
const [selectedYurt, setSelectedYurt] = useState<YurtInfo | null>(null);

// Load user's yurts on login
const loadUserYurts = async () => {
  const response = await authFetch('/yurt-management/my-yurts');
  setAvailableYurts(response.data);
  
  // Load from localStorage or use primary
  const storedYurt = localStorage.getItem('selectedYurt');
  if (storedYurt) {
    setSelectedYurt(JSON.parse(storedYurt));
  } else {
    const primary = response.data.find(y => y.isPrimary);
    setSelectedYurt(primary || response.data[0]);
  }
};

// Switch yurt
const switchYurt = (yurt: YurtInfo) => {
  setSelectedYurt(yurt);
  localStorage.setItem('selectedYurt', JSON.stringify(yurt));
  window.location.reload(); // Reload to fetch new data
};
```

### B. Create YurtSelector Component

```typescript
// components/YurtSelector.tsx
import { useAuth } from '../auth/AuthContext';

export const YurtSelector: React.FC = () => {
  const { availableYurts, selectedYurt, switchYurt, user } = useAuth();
  
  if (!user || availableYurts.length <= 1) return null;
  
  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-primary">
        📍 {selectedYurt?.yurtName || 'Select Yurt'}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {availableYurts.map(yurt => (
          <Dropdown.Item 
            key={yurt.yurtId}
            active={yurt.yurtId === selectedYurt?.yurtId}
            onClick={() => switchYurt(yurt)}
          >
            {yurt.yurtName}
            {yurt.isPrimary && ' (Primary)'}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};
```

### C. Update API Fetch Function

```typescript
// utils/authFetch.ts or similar
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const selectedYurt = localStorage.getItem('selectedYurt');
  const yurtId = selectedYurt ? JSON.parse(selectedYurt).yurtId : null;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(yurtId && { 'X-Yurt-Id': yurtId.toString() }),
    ...options.headers
  };
  
  const response = await fetch(API_BASE_URL + url, { ...options, headers });
  return response.json();
};
```

### D. Add YurtSelector to Navbar

```typescript
// In your Navbar/Header component
import { YurtSelector } from './YurtSelector';

<Navbar>
  {/* Other navbar items */}
  <YurtSelector />
  {/* User profile dropdown */}
</Navbar>
```

### E. Create Yurt Management Page (Optional - Admin Only)

```typescript
// pages/YurtManagement.tsx
// Full CRUD for yurts
// User assignment interface
// Yurt statistics dashboard
```

## Phase 5: Admin Signup System ⏳ OPTIONAL

### Backend
1. Create data/adminSignupData.ts
2. Create services/adminSignupService.ts
3. Create controller/adminSignupController.ts
4. Create routes/adminSignupRoute.ts

### Frontend
1. Public admin signup page (no auth required)
2. Super-admin approval dashboard

## Testing Checklist

### Backend Tests
```bash
# 1. Get user's yurts (should work for all users)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/yurt-management/my-yurts

# 2. Admin switching yurts
curl -H "Authorization: Bearer <admin_token>" \
  -H "X-Yurt-Id: 2" \
  http://localhost:3001/student/all

# 3. Non-admin cannot switch
curl -H "Authorization: Bearer <hoca_token>" \
  -H "X-Yurt-Id: 2" \
  http://localhost:3001/student/all
# Should get 403 Forbidden

# 4. Super-admin accesses any yurt
curl -H "Authorization: Bearer <super_admin_token>" \
  -H "X-Yurt-Id: 3" \
  http://localhost:3001/student/all
```

### Frontend Tests
1. Login as admin with multiple yurts
2. Verify YurtSelector dropdown appears
3. Switch between yurts
4. Verify data changes (students, attendance, etc.)
5. Login as hoca
6. Verify YurtSelector does NOT appear
7. Login as super-admin
8. Verify can switch to any yurt

## Common Issues & Solutions

### Issue: "User does not have access to this yurt"
- **Solution:** Assign user to yurt via `/yurt-management/assign-user`

### Issue: YurtSelector not showing
- **Solution:** User only has one yurt. Assign more yurts or check availableYurts array

### Issue: Data not changing after yurt switch
- **Solution:** Check X-Yurt-Id header is being sent. Check validateYurtAccess middleware is applied

### Issue: 401 Unauthorized on yurt-management routes
- **Solution:** Check JWT token is valid and included in Authorization header

## API Endpoints Reference

### Yurt Management
- `GET /yurt-management/my-yurts` - Get accessible yurts
- `GET /yurt-management/my-primary-yurt` - Get primary yurt
- `PUT /yurt-management/my-primary-yurt` - Set primary (body: {yurtid})
- `POST /yurt-management/assign-user` - Assign user (admin, body: {accountid, yurtid, isPrimary})
- `POST /yurt-management/remove-user` - Remove user (admin, body: {accountid, yurtid})
- `GET /yurt-management/:yurtid/users` - Get yurt users (admin)

### Original Yurt CRUD (Super-admin only)
- `GET /yurts/all` - All yurts
- `GET /yurts/active` - Active yurts
- `POST /yurts` - Create yurt
- `PUT /yurts/:id` - Update yurt
- `DELETE /yurts/:id` - Soft delete
- `DELETE /yurts/:id/hard` - Hard delete
- `GET /yurts/:id/stats` - Yurt statistics

## Current Status

✅ **Completed:**
- Database migration script
- UserYurt & AdminSignupRequest models
- Data access layer (userYurtData.ts)
- Service layer (yurtManagementService.ts)
- Controller (yurtManagementController.ts)
- Routes (yurtManagementRoute.ts)
- Middleware (validateYurtAccess.ts)
- Documentation

⏳ **In Progress:**
- Controller updates (use PowerShell script)

⏳ **Pending:**
- Route middleware updates
- Frontend AuthContext
- Frontend YurtSelector component
- Frontend API client updates
- Admin signup system (optional)
- Testing

## Estimated Time

- Backend completion: 1-2 hours
- Frontend implementation: 3-4 hours
- Testing: 1-2 hours
- **Total: 5-8 hours**

## Questions?

Check the detailed documentation:
- `ENHANCED-YURT-MANAGEMENT-PROGRESS.md` - Detailed progress tracking
- `MULTI-TENANCY-IMPLEMENTATION-COMPLETE.md` - Original multi-tenancy guide
- `API-CONFIGURATION.md` - API configuration guide
