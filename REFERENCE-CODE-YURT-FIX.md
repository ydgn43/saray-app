# 🔧 Fix: Reference Code Yurt Assignment

## Problem
When users signed up with a reference code created within a specific yurt, they were being assigned to the default yurt (Saray Yurdu) instead of the yurt where the reference code was created.

## Root Causes

### 1. Missing Yurt ID in Reference Code
- The `ReferenceCode` model didn't have a `yurtid` field
- When admins created reference codes, the yurt context wasn't stored
- Reference codes had no association with the yurt they belonged to

### 2. No Yurt Assignment During Signup
- The signup process didn't assign new users to any yurt in the `UserYurt` table
- Users were created without yurt membership
- Only the default yurt data was shown

### 3. No Yurt Data in Signup Response
- Signup response didn't include yurt information
- Frontend couldn't display the correct yurt after registration

## Solution Implemented

### 1. Backend Changes

#### A. Updated ReferenceCode Model
**File**: `backend/data/models/ReferenceCode.ts`

Added `yurtid` field:
```typescript
@Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Yurt ID that this reference code belongs to'
})
declare yurtid?: number;
```

#### B. Updated createReferenceCode Controller
**File**: `backend/controller/referenceCodeController.ts`

- Extract yurtid from request header: `req.headers['x-yurt-id']`
- Store yurtid when creating reference code
- Log yurtid for debugging

```typescript
const yurtid = req.headers['x-yurt-id'] ? Number(req.headers['x-yurt-id']) : null;

const referenceCode = await ReferenceCode.create({
    // ... other fields
    yurtid: yurtid,
});
```

#### C. Updated Signup Controller
**File**: `backend/controller/authController.ts`

Three major changes:

**1. Track yurtid from reference code or student:**
```typescript
let assignedYurtId = null;

// For student codes
if (student) {
    assignedYurtId = student.yurtid;
}

// For regular reference codes
if (refCode) {
    assignedYurtId = refCode.yurtid;
}
```

**2. Assign user to yurt in UserYurt table:**
```typescript
if (assignedYurtId) {
    await UserYurt.create({
        accountid: newUser.accountid,
        yurtid: assignedYurtId,
        is_primary: true,
        assigned_at: new Date()
    });
} else {
    // Fallback to default yurt (ID 1)
    await UserYurt.create({
        accountid: newUser.accountid,
        yurtid: 1,
        is_primary: true,
        assigned_at: new Date()
    });
}
```

**3. Include yurt data in signup response:**
```typescript
// Fetch user's yurts
const userYurts = await UserYurt.findAll({
    where: { accountid: newUser.accountid },
    include: [{ model: YurtSequelize, as: 'yurt' }]
});

const availableYurts = userYurts.map(uy => ({
    yurtId: uy.yurtid,
    yurtName: uy.yurt?.yurt_name,
    location: uy.yurt?.location,
    // ...
}));

const primaryYurt = availableYurts.find(y => y.isPrimary) || availableYurts[0];

// Return in response
res.status(201).json({
    // ...
    yurtName: primaryYurt?.yurtName,
    availableYurts: availableYurts,
    selectedYurt: primaryYurt
});
```

### 2. Frontend Changes

#### Updated Signup.tsx
**File**: `frontend/src/pages/Signup.tsx`

Store yurt data in localStorage after successful signup:
```typescript
if (res.ok) {
    const data = await res.json();
    
    // Store yurt information
    if (data.yurtName) {
        localStorage.setItem('yurtName', data.yurtName);
    }
    if (data.availableYurts) {
        localStorage.setItem('availableYurts', JSON.stringify(data.availableYurts));
    }
    if (data.selectedYurt) {
        localStorage.setItem('selectedYurt', JSON.stringify(data.selectedYurt));
    }
    
    login(data.user, data.token);
    navigate('/');
}
```

### 3. Database Migration

#### Migration Script
**File**: `db/migrations/add-yurtid-to-referencecodes.sql`

```sql
ALTER TABLE `ReferenceCodes` 
ADD COLUMN `yurtid` INT NULL 
COMMENT 'Yurt ID that this reference code belongs to' 
AFTER `description`;

ALTER TABLE `ReferenceCodes`
ADD CONSTRAINT `fk_referencecode_yurt`
FOREIGN KEY (`yurtid`) REFERENCES `Yurt` (`yurtid`)
ON DELETE SET NULL
ON UPDATE CASCADE;
```

## How It Works Now

### Flow: Creating a Reference Code

1. Admin logs in and switches to their yurt (e.g., "Test Yurt", ID: 9)
2. Admin creates a reference code from Settings
3. Frontend sends `x-yurt-id: 9` header with the request
4. Backend creates reference code with `yurtid: 9`
5. Reference code is now associated with "Test Yurt"

### Flow: Signing Up with Reference Code

1. User enters reference code on signup page
2. Backend validates the reference code
3. Backend extracts `yurtid` from reference code (e.g., 9)
4. Backend creates new user account
5. Backend creates UserYurt entry: `{accountid: newUserId, yurtid: 9, is_primary: true}`
6. Backend fetches user's yurts and returns in response
7. Frontend saves yurt data to localStorage
8. User sees correct yurt ("Test Yurt") after login
9. YurtSelector shows correct yurt name and location

### Example: Student Reference Code

For student-specific codes:
1. Student record has `reference_code` and `yurtid`
2. When signing up with student code:
   - User gets role: `talebe`
   - User gets linked to student record: `studentid: X`
   - User gets assigned to student's yurt: `yurtid: student.yurtid`
3. User sees their student's yurt immediately

## Files Modified

### Backend (5 files):
1. `backend/data/models/ReferenceCode.ts` - Added yurtid field
2. `backend/controller/referenceCodeController.ts` - Store yurtid when creating
3. `backend/controller/authController.ts` - Assign users to yurt, return yurt data
4. `db/migrations/add-yurtid-to-referencecodes.sql` - Database migration

### Frontend (1 file):
1. `frontend/src/pages/Signup.tsx` - Store yurt data in localStorage

## Testing Steps

### 1. Run Database Migration
```bash
mysql -u admin -p saraydb < db/migrations/add-yurtid-to-referencecodes.sql
```

### 2. Restart Backend
```bash
cd backend
npm start
```

### 3. Test the Flow

**A. Create Reference Code in Specific Yurt:**
1. Login as admin
2. Switch to a non-default yurt (e.g., "yurt1")
3. Go to Settings → Reference Codes
4. Create a new reference code for "hoca" role
5. Check database: 
   ```sql
   SELECT code, roleId, yurtid FROM ReferenceCodes ORDER BY createdAt DESC LIMIT 1;
   ```
   Should show correct yurtid

**B. Sign Up with Reference Code:**
1. Logout
2. Go to signup page
3. Enter the reference code you just created
4. Complete signup
5. After login, check:
   - Top-right YurtSelector should show "yurt1" (not "Saray Yurdu")
   - Location should be displayed if set
6. Check database:
   ```sql
   SELECT u.username, u.role_name, uy.yurtid, y.yurt_name 
   FROM User u
   JOIN UserYurt uy ON u.accountid = uy.accountid
   JOIN Yurt y ON uy.yurtid = y.yurtid
   WHERE u.username = 'test_user_name';
   ```

### 4. Test Student Code

**A. Create Student with Reference Code:**
1. Login as admin in a specific yurt
2. Add a new student
3. Generate reference code for student
4. Note the reference code

**B. Sign Up as Student:**
1. Logout
2. Go to signup page
3. Enter student reference code
4. Complete signup
5. Verify:
   - User role is "talebe"
   - User is linked to student record
   - User is in correct yurt
   - YurtSelector shows correct yurt

## Verification Queries

```sql
-- Check reference codes with yurt assignments
SELECT 
    rc.code,
    rc.roleId,
    rc.yurtid,
    y.yurt_name,
    rc.isUsed,
    rc.createdAt
FROM ReferenceCodes rc
LEFT JOIN Yurt y ON rc.yurtid = y.yurtid
ORDER BY rc.createdAt DESC;

-- Check user yurt assignments
SELECT 
    u.username,
    u.role_name,
    uy.yurtid,
    y.yurt_name,
    uy.is_primary,
    uy.assigned_at
FROM User u
JOIN UserYurt uy ON u.accountid = uy.accountid
JOIN Yurt y ON uy.yurtid = y.yurtid
ORDER BY u.accountid DESC;

-- Check students and their yurts
SELECT 
    s.studentid,
    s.first_name,
    s.last_name,
    s.reference_code,
    s.yurtid,
    y.yurt_name
FROM Student s
JOIN Yurt y ON s.yurtid = y.yurtid
WHERE s.reference_code IS NOT NULL;
```

## Backwards Compatibility

### Existing Reference Codes
- Old reference codes without yurtid will still work
- Users will be assigned to default yurt (ID 1)
- You can manually update old codes:
  ```sql
  UPDATE ReferenceCodes SET yurtid = 1 WHERE yurtid IS NULL;
  ```

### Existing Users
- Users created before this fix may not have UserYurt entries
- They should be migrated manually or on next login
- Check with:
  ```sql
  SELECT u.accountid, u.username 
  FROM User u
  LEFT JOIN UserYurt uy ON u.accountid = uy.accountid
  WHERE uy.user_yurt_id IS NULL;
  ```

## Future Enhancements

1. **Auto-assign to Creator's Yurt**: Reference codes could automatically inherit the yurtid from the admin who created them (already implemented via header)

2. **Multi-Yurt Reference Codes**: Allow a reference code to grant access to multiple yurts

3. **Yurt Transfer**: Allow admins to transfer users between yurts

4. **Yurt Invitation Links**: Generate shareable links that encode both the yurt and role

## Troubleshooting

### Issue: User still sees default yurt after signup
**Solution**: Check if:
1. Database migration ran successfully
2. Backend restarted after model change
3. Reference code has correct yurtid
4. Signup response includes yurt data
5. Browser localStorage has yurt data

### Issue: Reference codes show null yurtid
**Solution**: 
1. Ensure frontend sends `x-yurt-id` header
2. Check if `authFetch` utility includes the header
3. Verify admin is in a specific yurt when creating code

### Issue: Location not showing in YurtSelector
**Solution**:
1. Check if yurt has location set in database
2. Verify YurtSelector component displays location
3. Check if location is null for that yurt

---

**Status**: ✅ FIXED
**Date**: October 22, 2025
**Issues Fixed**:
1. Reference codes now store yurtid
2. Users are assigned to correct yurt during signup
3. Yurt data is returned in signup response
4. Frontend displays correct yurt after signup
