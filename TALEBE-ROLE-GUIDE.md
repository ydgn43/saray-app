# New "Talebe" (Student) Role Implementation Guide

## Overview
A new user role "talebe" (student) has been added to the system. This role is separate from "yoklamaci" (tracker/attendance taker).

## Role Definitions

### 1. **Admin** (admin)
- Full system access
- Can manage users
- Can manage reference codes
- Can manage seasons and programs
- Can view all statistics
- Can take attendance
- Can manage students

### 2. **Hoca** (Teacher) (hoca)
- Can take attendance
- Can view statistics
- Can view İzinli Talebeler (excused students)
- Cannot manage users or system settings

### 3. **Yoklamacı** (Tracker/Attendance Taker) (yoklamaci)
- Can take attendance
- Can view statistics
- Can view İzinli Talebeler (excused students)
- Same permissions as Hoca

### 4. **Talebe** (Student) (talebe) - **NEW**
- Can only view their own statistics
- Access to Student Portal page
- Can view İzinli Talebeler
- Cannot take attendance
- Cannot view other students' data

## Database Setup

### Step 1: Add the new role to the database
Run the SQL script: `db/ADD-TALEBE-ROLE.sql`

```sql
USE saraydb;

INSERT INTO Role (role_name)
SELECT 'talebe'
WHERE NOT EXISTS (
    SELECT 1 FROM Role WHERE role_name = 'talebe'
);
```

### Step 2: Verify the role
```sql
SELECT * FROM Role;
```

You should see:
- admin
- hoca
- yoklamaci
- talebe

## Backend Changes

### 1. Reference Code Controller (`backend/controller/referenceCodeController.ts`)
Updated role mapping:
```typescript
const roleMapping: { [key: string]: string } = {
    'Teacher': 'hoca',
    'Tracker': 'yoklamaci',
    'Student': 'talebe',    // NEW
    'Admin': 'admin'
};
```

## Frontend Changes

### 1. Reference Code Management (`frontend/src/pages/ReferenceCodeManagement.tsx`)
Added "Student" option to the roles array:
```typescript
const roles = ['Teacher', 'Tracker', 'Student', 'Admin'];
```

### 2. App Routes (`frontend/src/App.tsx`)
Student Portal route now requires 'talebe' role:
```typescript
<Route path="/student-portal" element={
  <RequireRole roles={['talebe']}>
    <StudentPortal />
  </RequireRole>
} />
```

### 3. Sidebar (`frontend/src/components/AppSidebar.tsx`)
- Added 'talebe' to role display names
- Student Portal menu item only visible to 'talebe' role
- Yoklamaci restored to normal permissions (can access Yoklama, İstatistik pages)

Menu visibility by role:
- **Talebe**: Ana Sayfa, İstatistiklerim, İzinli Talebeler
- **Yoklamacı**: Ana Sayfa, Yoklama, İstatistik, İzinli Talebeler
- **Hoca**: Ana Sayfa, Yoklama, İstatistik, İzinli Talebeler
- **Admin**: All menu items

### 4. User Management (`frontend/src/pages/UserManagement.tsx`)
Added "Talebe" option in role dropdown

## How to Create Student Accounts

### Option 1: Using Reference Codes (Recommended)
1. Login as Admin
2. Go to "Referans Kodları"
3. Click "Yeni Referans Kodu Oluştur"
4. Select role: **Student**
5. Set expiration date and max uses
6. Share the generated code with the student
7. Student goes to `/signup` page
8. Student enters the reference code
9. Creates account with 'talebe' role automatically

### Option 2: Manual User Creation
1. Login as Admin
2. Go to "Ayarlar" → "Kullanıcı Yönetimi"
3. Click "Yeni Kullanıcı Ekle"
4. Fill in username and password
5. Select role: **Talebe**
6. Click "Kaydet"

## Student Portal Features

When a student (talebe) logs in:
1. They see "İstatistiklerim" in the sidebar
2. Clicking it opens the Student Portal
3. They select their name from dropdown
4. Choose date range
5. View their personal statistics:
   - Overall percentage
   - Breakdown by program (Sabah Namazı, Öğle Namazı, etc.)
   - Color-coded performance indicators

## Testing the Changes

### 1. Test Student Signup with Reference Code
```bash
# 1. Create a reference code for Student role
# 2. Go to http://localhost:3000/signup
# 3. Use the reference code
# 4. Verify new user has 'talebe' role in database
```

### 2. Test Student Portal Access
```bash
# 1. Login as a student (talebe role)
# 2. Verify only "İstatistiklerim" menu is visible
# 3. Select student name and date range
# 4. Verify statistics are displayed correctly
```

### 3. Test Yoklamaci Access
```bash
# 1. Login as yoklamaci
# 2. Verify can access Yoklama page
# 3. Verify can access İstatistik page
# 4. Verify cannot access Student Portal
```

## Migration Notes

If you have existing users with 'yoklamaci' role who should be students:
1. Go to User Management
2. Edit each user
3. Change role from 'yoklamaci' to 'talebe'
4. Save changes

## Troubleshooting

### Issue: "talebe" role not found
**Solution**: Run the SQL script to add the role to the database

### Issue: Student can't access Student Portal
**Solution**: Verify the user's role is exactly 'talebe' (lowercase) in the database

### Issue: Reference codes not working for Student role
**Solution**: Check that the role mapping in `referenceCodeController.ts` includes 'Student': 'talebe'

## Summary

- ✅ New "talebe" role created
- ✅ Yoklamaci permissions restored (can use Yoklama, İstatistik pages)
- ✅ Student Portal accessible only to talebe role
- ✅ Reference code system supports Student role
- ✅ User management supports talebe role
- ✅ Students can view only their own statistics
