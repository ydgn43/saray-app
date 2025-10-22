# Enhanced Multi-Yurt Management System - Phase 1 Progress

## Overview
This document tracks the progress of implementing enhanced multi-yurt management that allows admins to access and switch between multiple yurts.

## Completed Tasks ✅

### 1. Database Schema
- ✅ Created `UserYurt` junction table (db/UserYurtAccess-Migration.sql)
  - Fields: user_yurt_id, accountid, yurtid, is_primary, assigned_by, assigned_at
  - Indexes: idx_user_yurt_access, idx_yurt_users
  - Migration script includes:
    * Migrating existing users to UserYurt with is_primary=TRUE
    * Granting super-admins access to ALL yurts
- ✅ Created `AdminSignupRequest` table for approval workflow
  - Fields: request_id, username, password_hash, requested_yurtid, status, reviewed_by, reviewed_at, notes
  - Index: idx_signup_status

### 2. Backend Models
- ✅ backend/data/models/UserYurt.ts
  - Sequelize-typescript model
  - BelongsTo relationships to User and Yurt
- ✅ backend/data/models/AdminSignupRequest.ts
  - Sequelize-typescript model for admin signup workflow
  - Status enum: pending, approved, rejected

### 3. Backend Data Layer
- ✅ backend/data/userYurtData.ts (8 functions)
  - getUserYurts(accountid): Get all yurts a user can access
  - getPrimaryYurt(accountid): Get user's primary/default yurt
  - hasAccessToYurt(accountid, yurtid): Check if user has access
  - assignUserToYurt(...): Assign user to yurt
  - removeUserFromYurt(...): Remove user from yurt
  - setPrimaryYurt(...): Set a yurt as primary
  - getYurtUsers(yurtid): Get all users assigned to a yurt
  - getUserYurtCount(accountid): Count yurts for a user

### 4. Backend Business Layer
- ✅ backend/business/services/yurtManagementService.ts
  - Wrapper service for yurt management operations
  - Transforms data for business logic

### 5. Backend Controllers
- ✅ backend/controller/yurtManagementController.ts (6 endpoints)
  - GET /yurt-management/my-yurts
  - GET /yurt-management/my-primary-yurt
  - PUT /yurt-management/my-primary-yurt
  - POST /yurt-management/assign-user (admin/super-admin)
  - POST /yurt-management/remove-user (admin/super-admin)
  - GET /yurt-management/:yurtid/users (admin/super-admin)

### 6. Backend Routes
- ✅ backend/routes/yurtManagementRoute.ts
  - Registered in app.ts as /yurt-management
  - Proper authentication and authorization middleware

### 7. Backend Middleware
- ✅ backend/middleware/validateYurtAccess.ts
  - validateYurtAccess: Validates user has access to requested yurt
  - Sets req.selectedYurtId based on X-Yurt-Id header
  - Super-admin: Access all yurts
  - Admin: Access only assigned yurts
  - Other roles: Access only their default yurt
  - requireYurtSelection: Ensures yurt is selected

### 8. Backend App Configuration
- ✅ app.ts updated to import and register yurtManagementRouter

## Pending Tasks ⏳

### 1. Backend Route Updates
Need to apply validateYurtAccess middleware to all protected routes:
- ⏳ studentRoute.ts (all routes)
- ⏳ attendanceRoute.ts (all routes)
- ⏳ classRoute.ts (all routes)
- ⏳ seasonRoute.ts (all routes)
- ⏳ programRoute.ts (all routes)
- ⏳ userRoute.ts (all routes)

### 2. Backend Controller Updates
Need to change from `req.user!.yurtid` to `req.selectedYurtId!`:
- ⏳ studentController.ts (8 occurrences)
- ⏳ attendanceController.ts (7 occurrences)
- ⏳ classController.ts (3 occurrences)
- ⏳ seasonController.ts (3 occurrences)
- ⏳ programController.ts (4 occurrences)
- ⏳ userController.ts (1 occurrence)

**Total: 26 replacements needed**

### 3. Frontend - AuthContext Enhancement
- ⏳ Update AuthContext.tsx to include:
  - availableYurts: YurtInfo[]
  - selectedYurt: YurtInfo | null
  - loadUserYurts() function
  - switchYurt(yurt) function
  - Store selectedYurt in localStorage
  - Load on app init

### 4. Frontend - API Communication
- ⏳ Update utils/authFetch.ts (or similar)
  - Add X-Yurt-Id header from selectedYurt
  - Include in all authenticated requests

### 5. Frontend - Yurt Selector Component
- ⏳ Create components/YurtSelector.tsx
  - Dropdown in navbar/header
  - Show only for users with multiple yurts
  - Call switchYurt() on selection
  - Reload page after switch

### 6. Frontend - Yurt Management Page
- ⏳ Create pages/YurtManagement.tsx
  - Admin/super-admin only
  - CRUD operations for yurts
  - Assign users to yurts
  - View yurt users
  - View yurt statistics

### 7. Admin Signup System
- ⏳ Create backend/data/adminSignupData.ts
- ⏳ Create backend/business/services/adminSignupService.ts
- ⏳ Create backend/controller/adminSignupController.ts
- ⏳ Create backend/routes/adminSignupRoute.ts
- ⏳ Frontend: Public admin signup page
- ⏳ Frontend: Super-admin approval dashboard

### 8. Database Migration
- ⏳ Execute db/UserYurtAccess-Migration.sql on database

### 9. Testing
- ⏳ Test admin yurt switching
- ⏳ Test data isolation after switching
- ⏳ Test access control (non-admins cannot switch)
- ⏳ Test super-admin access to all yurts
- ⏳ Test admin signup approval workflow

## Architecture Changes

### Before (Fixed Yurt per User)
```
Login → JWT with yurtid → req.user.yurtid → Filter data
```

### After (Dynamic Yurt Switching)
```
Login → JWT with default yurtid → req.user.yurtid (primary yurt)
↓
Request → X-Yurt-Id header → validateYurtAccess middleware
↓
Check UserYurt table → req.selectedYurtId → Filter data
```

## Access Control Model

| Role | Yurt Access | Can Switch |
|------|------------|-----------|
| super-admin | All yurts | Yes |
| admin | Multiple yurts (via UserYurt) | Yes |
| hoca | One yurt (primary) | No |
| yoklamaci | One yurt (primary) | No |
| talebe | One yurt (primary) | No |

## API Endpoints Added

### Yurt Management
- `GET /yurt-management/my-yurts` - Get user's accessible yurts
- `GET /yurt-management/my-primary-yurt` - Get primary yurt
- `PUT /yurt-management/my-primary-yurt` - Set primary yurt
- `POST /yurt-management/assign-user` - Assign user to yurt (admin)
- `POST /yurt-management/remove-user` - Remove user from yurt (admin)
- `GET /yurt-management/:yurtid/users` - Get yurt users (admin)

## Frontend Requirements

### 1. Yurt Selector UI
Location: Navbar/Header (next to user profile)
- Show dropdown for users with availableYurts.length > 1
- Display currently selected yurt name
- On change: call switchYurt(), reload page

### 2. API Request Headers
All authenticated requests must include:
```
X-Yurt-Id: <selectedYurtId>
```

### 3. localStorage Keys
```javascript
{
  "selectedYurt": { yurtId, yurtName, isPrimary, ... },
  "availableYurts": [{ yurtId, yurtName, ... }]
}
```

## Next Steps

1. **Run Migration Script**
   ```bash
   mysql -u root -p SarayDb < db/UserYurtAccess-Migration.sql
   ```

2. **Update Controllers** (bulk replacement)
   - Replace all `req.user!.yurtid` with `req.selectedYurtId!`
   - Verify compilation with `npx tsc`

3. **Update Routes** (add middleware)
   - Add validateYurtAccess to all protected routes
   - Test with Postman/curl

4. **Implement Frontend**
   - Update AuthContext
   - Create YurtSelector
   - Update API client
   - Create YurtManagement page

5. **Implement Admin Signup**
   - Backend: Request/approval system
   - Frontend: Signup form + approval dashboard

6. **Testing**
   - Create test users with different roles
   - Test yurt switching
   - Verify data isolation
   - Test admin signup workflow

## Files Created (This Session)

1. db/UserYurtAccess-Migration.sql
2. backend/data/models/UserYurt.ts
3. backend/data/models/AdminSignupRequest.ts
4. backend/data/userYurtData.ts
5. backend/business/services/yurtManagementService.ts
6. backend/controller/yurtManagementController.ts
7. backend/routes/yurtManagementRoute.ts
8. backend/middleware/validateYurtAccess.ts
9. backend/app.ts (updated)

**Total: 9 files**

## Estimated Remaining Work

- Backend updates: ~2-3 hours (controller + route updates)
- Frontend implementation: ~4-5 hours (context, components, pages)
- Admin signup system: ~3-4 hours (backend + frontend)
- Testing: ~2-3 hours
- **Total: ~11-15 hours**

## Notes

- The UserYurt migration script is idempotent (can be run multiple times safely)
- All existing users will get access to their current yurt when migration runs
- Super-admins will automatically get access to all yurts
- The system maintains backward compatibility (users without multiple yurts work as before)
