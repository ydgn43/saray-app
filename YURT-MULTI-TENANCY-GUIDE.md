# Multi-Tenancy (Yurt) Implementation Guide

## 🎯 Overview
This document describes the multi-tenancy architecture where each "Yurt" (dormitory) operates as an isolated tenant with separate students, teachers, attendance records, and all related data.

## 📋 Implementation Status

### ✅ Phase 1: Database Schema & Models (COMPLETED)

#### Created Files:
1. **backend/data/models/Yurt.ts** - Yurt model with fields:
   - `yurtid` (PK, auto-increment)
   - `yurt_name` (unique, required)
   - `description` (optional)
   - `location` (optional)
   - `is_active` (boolean, default true)
   - `created_at` (timestamp)

2. **db/YurtMultiTenancyMigration.sql** - Complete migration script:
   - Creates Yurt table
   - Inserts default "Saray Yurdu" (yurtid = 1)
   - Adds `yurtid` foreign key to all tables:
     * User
     * Student
     * Class
     * Season
     * Program
     * AttendanceType
     * Attendance
     * ActivityLog
   - Creates indexes for performance
   - Assigns all existing data to default yurt
   - Creates 'super-admin' role

#### Updated Models:
All models now include:
```typescript
@ForeignKey(() => Yurt)
@Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1
})
declare yurtid: number;

@BelongsTo(() => Yurt)
yurt!: Yurt;
```

### ✅ Phase 2: Backend Infrastructure (COMPLETED)

#### Created Files:
1. **backend/data/yurtData.ts** - Data access layer with methods:
   - `createYurt(yurt_name, description, location)`
   - `getAllYurts()` - Returns all yurts
   - `getActiveYurts()` - Returns only active yurts
   - `getYurtById(yurtid)`
   - `getYurtByName(yurt_name)`
   - `updateYurt(yurtid, updates)`
   - `deleteYurt(yurtid)` - Soft delete (sets is_active = false)
   - `hardDeleteYurt(yurtid)` - Permanent delete
   - `getYurtStats(yurtid)` - For dashboard statistics

2. **backend/business/services/yurtService.ts** - Business logic layer:
   - Validates unique yurt names
   - Prevents deletion of default yurt (yurtid = 1)
   - Handles error cases

3. **backend/controller/yurtController.ts** - HTTP request handlers:
   - All CRUD operations
   - Proper error handling and validation
   - Status codes (200, 201, 400, 404, 500)

4. **backend/routes/yurtRoute.ts** - API endpoints:
   ```
   GET    /yurts/active          - Get active yurts (all users)
   GET    /yurts                 - Get all yurts (super-admin only)
   GET    /yurts/:yurtid         - Get yurt by ID (super-admin only)
   GET    /yurts/:yurtid/stats   - Get yurt stats (super-admin, admin)
   POST   /yurts                 - Create yurt (super-admin only)
   PUT    /yurts/:yurtid         - Update yurt (super-admin only)
   DELETE /yurts/:yurtid         - Delete yurt (super-admin only)
   ```

5. **backend/app.ts** - Registered yurt routes:
   ```typescript
   app.use('/yurts', yurtRouter);
   ```

---

## 🚧 Phase 3: Authentication & Authorization (TODO)

### Next Steps:

#### 1. Update authMiddleware.ts
Add yurtid to JWT token and req.user:
```typescript
// Decode token and extract yurtid
const decoded = jwt.verify(token, secret);
req.user = {
    accountid: decoded.accountid,
    username: decoded.username,
    role: decoded.role,
    yurtid: decoded.yurtid  // ✨ ADD THIS
};
```

#### 2. Update authController.ts Login
Include yurtid in JWT token:
```typescript
const token = jwt.sign(
    {
        accountid: user.accountid,
        username: user.username,
        role: user.role_name,
        yurtid: user.yurtid  // ✨ ADD THIS
    },
    JWT_SECRET
);
```

#### 3. Create Super-Admin Role
- Super-admin can manage all yurts
- Super-admin can view/edit data across yurts
- Regular admin only manages their own yurt

---

## 🔐 Phase 4: Data Isolation (TODO)

### Critical: All Data Access Must Filter by yurtid

#### Example: Update studentData.ts
**Before:**
```typescript
async getAllStudents() {
    return await Student.findAll();
}
```

**After:**
```typescript
async getAllStudents(yurtid: number) {
    return await Student.findAll({
        where: { yurtid }
    });
}
```

#### Files to Update:
1. **backend/data/studentData.ts**
   - getAllStudents → add yurtid filter
   - getStudentById → verify yurtid matches
   - createStudent → include yurtid
   - updateStudent → verify yurtid matches
   - deleteStudent → verify yurtid matches

2. **backend/data/attendanceData.ts**
   - All methods must filter by yurtid
   - Prevent cross-yurt attendance access

3. **backend/data/activityLogData.ts**
   - Logs must be scoped to yurtid
   - Super-admin can query all logs

4. **backend/data/seedUsers.ts**
   - Assign yurtid to seed users

#### Controller Updates:
All controllers must extract yurtid from req.user:
```typescript
async getStudents(req: Request, res: Response) {
    const { yurtid, role } = req.user;
    
    // Super-admin can optionally query all yurts
    const targetYurtId = role === 'super-admin' && req.query.yurtid
        ? Number(req.query.yurtid)
        : yurtid;
    
    const students = await studentService.getAllStudents(targetYurtId);
    res.json(students);
}
```

---

## 🎨 Phase 5: Frontend Implementation (TODO)

### 1. Yurt Management Page (Super-Admin Only)

**File:** `frontend/src/pages/YurtManagement.tsx`

Features:
- Table showing all yurts (name, location, status, created date)
- Create new yurt button → Opens modal
- Edit button per row → Opens edit modal
- Activate/Deactivate toggle
- View stats button → Shows dashboard

### 2. Update AuthContext

**File:** `frontend/src/auth/AuthContext.tsx`

Add yurt to context:
```typescript
interface AuthContextType {
    user: {
        accountid: number;
        username: string;
        role: string;
        yurtid: number;  // ✨ ADD THIS
    } | null;
    currentYurt: {
        yurtid: number;
        yurt_name: string;
    } | null;  // ✨ ADD THIS
    login: (credentials) => Promise<void>;
    logout: () => void;
}
```

### 3. Store Yurt in localStorage

After login, store yurt info:
```typescript
localStorage.setItem('user', JSON.stringify({
    accountid,
    username,
    role,
    yurtid
}));
localStorage.setItem('yurt', JSON.stringify({
    yurtid,
    yurt_name
}));
```

### 4. Add Yurt Selector (Future Enhancement)

For super-admins, add a dropdown to switch between yurts:
```tsx
<Select value={currentYurtId} onChange={handleYurtChange}>
    {yurts.map(yurt => (
        <option key={yurt.yurtid} value={yurt.yurtid}>
            {yurt.yurt_name}
        </option>
    ))}
</Select>
```

---

## 📊 Phase 6: Testing & Verification (TODO)

### Test Scenarios:

#### 1. Create Multiple Yurts
```sql
-- Via API or directly:
INSERT INTO Yurt (yurt_name, description, location) 
VALUES 
    ('Test Yurt A', 'Test yurt for verification', 'Location A'),
    ('Test Yurt B', 'Another test yurt', 'Location B');
```

#### 2. Create Users in Different Yurts
```sql
-- User in Yurt A (yurtid = 2)
INSERT INTO User (username, password, role_name, yurtid) 
VALUES ('admin_yurt_a', 'hashed_password', 'admin', 2);

-- User in Yurt B (yurtid = 3)
INSERT INTO User (username, password, role_name, yurtid) 
VALUES ('admin_yurt_b', 'hashed_password', 'admin', 3);
```

#### 3. Create Students in Different Yurts
```sql
-- Student in Yurt A
INSERT INTO Student (first_name, last_name, yurtid, season_year, class_name) 
VALUES ('Ahmet', 'Test', 2, '2024-2025', 'ilkokul');

-- Student in Yurt B
INSERT INTO Student (first_name, last_name, yurtid, season_year, class_name) 
VALUES ('Mehmet', 'Test', 3, '2024-2025', 'ilkokul');
```

#### 4. Verify Data Isolation
- Login as admin_yurt_a
- Fetch students → Should ONLY see students from Yurt A
- Try to access Yurt B student by ID → Should return 404 or unauthorized
- Verify attendance, classes, seasons are also isolated

#### 5. Super-Admin Tests
- Login as super-admin
- Should be able to view all yurts
- Should be able to query students from any yurt
- Should be able to create/edit/delete yurts

---

## 🔄 Migration Steps

### Step-by-Step Deployment:

1. **Backup Database**
   ```bash
   mysqldump -u admin -p saraydb > saraydb_backup_$(date +%Y%m%d).sql
   ```

2. **Run Migration Script**
   ```bash
   mysql -u admin -p saraydb < db/YurtMultiTenancyMigration.sql
   ```

3. **Verify Migration**
   ```sql
   -- Check Yurt table created
   SELECT * FROM Yurt;
   
   -- Check all tables have yurtid column
   SHOW COLUMNS FROM User LIKE 'yurtid';
   SHOW COLUMNS FROM Student LIKE 'yurtid';
   
   -- Verify existing data assigned to default yurt
   SELECT yurtid, COUNT(*) FROM Student GROUP BY yurtid;
   SELECT yurtid, COUNT(*) FROM User GROUP BY yurtid;
   ```

4. **Compile TypeScript**
   ```bash
   cd backend
   npx tsc
   ```

5. **Restart Backend**
   ```bash
   npm start
   ```

6. **Test API Endpoints**
   ```bash
   # Get active yurts
   curl http://localhost:3001/yurts/active
   
   # Create new yurt (super-admin only)
   curl -X POST http://localhost:3001/yurts \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"yurt_name":"Test Yurt","description":"Test","location":"Test Location"}'
   ```

---

## 🎯 Benefits of This Architecture

1. **Complete Data Isolation**: Each yurt's data is completely separate
2. **Scalability**: Easy to add new yurts without code changes
3. **Security**: Users cannot access other yurt's data
4. **Flexibility**: Super-admin can manage multiple yurts
5. **Backward Compatibility**: Existing data assigned to default yurt
6. **Performance**: Indexed yurtid fields for fast queries

---

## ⚠️ Important Notes

### DO NOT SKIP:
1. **Always filter by yurtid** in data access layer
2. **Validate yurtid** in controllers
3. **Test data isolation** thoroughly
4. **Backup before migration**
5. **Update all existing queries** to include yurtid

### Security Considerations:
1. Never trust yurtid from client
2. Always use yurtid from authenticated user's token
3. Super-admin privilege should be carefully managed
4. Audit log all yurt management actions
5. Prevent accidental cross-yurt data access

---

## 📝 Next Immediate Actions

1. ✅ Run `db/YurtMultiTenancyMigration.sql`
2. ✅ Compile backend: `cd backend && npx tsc`
3. ✅ Restart backend server
4. ⏳ Update authMiddleware.ts and authController.ts
5. ⏳ Update all data access methods with yurtid filtering
6. ⏳ Update all controllers to use yurtid
7. ⏳ Create YurtManagement.tsx frontend page
8. ⏳ Test data isolation thoroughly

---

**Created:** October 22, 2025  
**Status:** Phase 1 & 2 Complete, Ready for Migration  
**Next Step:** Run database migration script
