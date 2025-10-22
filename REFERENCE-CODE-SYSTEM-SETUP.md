# 🔑 Reference Code System - Setup Guide

## Overview
This document provides complete instructions for setting up the Reference Code System on a new server or database. This system allows admins to generate signup codes that automatically assign roles to new users.

---

## 📋 Table of Contents
1. [Database Setup](#database-setup)
2. [Backend Files](#backend-files)
3. [Frontend Files](#frontend-files)
4. [Environment Configuration](#environment-configuration)
5. [Testing the System](#testing-the-system)
6. [Troubleshooting](#troubleshooting)

---

## 🗄️ Database Setup

### Prerequisites
- MySQL Server 5.7 or higher
- Access to your database (username/password)
- Database `saraydb` already exists

### Step 1: Create ReferenceCodes Table

Run this SQL script in your MySQL database:

```sql
USE saraydb;

-- Create the ReferenceCodes table
CREATE TABLE IF NOT EXISTS `ReferenceCodes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `role_name` VARCHAR(45) NOT NULL,
    `createdBy` INT NOT NULL,
    `expiresAt` DATETIME NOT NULL,
    `isUsed` TINYINT(1) DEFAULT 0,
    `usedBy` INT NULL,
    `usedAt` DATETIME NULL,
    `maxUses` INT DEFAULT 1,
    `currentUses` INT DEFAULT 0,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

### Step 2: Verify Table Creation

```sql
-- Check if table exists
SHOW TABLES LIKE 'ReferenceCodes';

-- View table structure
DESCRIBE ReferenceCodes;

-- Should show 13 columns:
-- id, code, role_name, createdBy, expiresAt, isUsed, usedBy, 
-- usedAt, maxUses, currentUses, description, createdAt, updatedAt
```

### Step 3: Verify Role Names

Make sure your `Role` table has the correct role names:

```sql
-- Check existing roles
SELECT * FROM Role;

-- Expected roles (your database uses these):
-- 'admin' (for administrators)
-- 'hoca' (for teachers)
-- 'yoklamaci' (for attendance takers/students)
```

### Step 4: Test the Table

```sql
-- Insert a test reference code
INSERT INTO ReferenceCodes (code, role_name, createdBy, expiresAt, maxUses, description)
VALUES ('TEST1234', 'admin', 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 1, 'Test code');

-- Verify insertion
SELECT * FROM ReferenceCodes;

-- Clean up test data
DELETE FROM ReferenceCodes WHERE code = 'TEST1234';
```

---

## 🔧 Backend Files

The following backend files are required for the reference code system:

### New Files to Add:

1. **`backend/data/models/ReferenceCode.ts`**
   - Sequelize model for the ReferenceCodes table
   - Defines all fields and their types

2. **`backend/controller/referenceCodeController.ts`**
   - `createReferenceCode` - Create new codes (admin only)
   - `getAllReferenceCodes` - List all codes (admin only)
   - `validateReferenceCode` - Check if code is valid (public)
   - `deactivateReferenceCode` - Delete/deactivate code (admin only)
   - `markCodeAsUsed` - Mark code as used after signup

3. **`backend/routes/referenceCodeRoute.ts`**
   - API routes for reference code operations
   - Protected with authentication middleware

### Modified Files:

4. **`backend/controller/authController.ts`**
   - Added `signup` function that validates reference codes
   - Creates users with roles from reference codes

5. **`backend/routes/authRoute.ts`**
   - Added POST `/auth/signup` route

6. **`backend/middleware/authMiddleware.ts`**
   - Added `requireAdmin` middleware function
   - Checks if user role is 'admin' (lowercase)

7. **`backend/app.ts`**
   - Registered `/reference-codes` router
   - Already has `/auth` router

### Important Notes:

- **Delete any `.js` compiled files** before deploying:
  ```bash
  # Delete old compiled files to avoid conflicts
  rm backend/routes/authRoute.js
  rm backend/controller/authController.js
  rm backend/controller/referenceCodeController.js
  rm backend/data/models/ReferenceCode.js
  ```

- **Role Name Mapping**: The backend maps frontend role names to database role names:
  - `Teacher` → `hoca`
  - `Student` → `yoklamaci`
  - `Admin` → `admin`

---

## 🎨 Frontend Files

### New Files:

1. **`frontend/src/pages/ReferenceCodeManagement.tsx`**
   - Admin page for creating and managing reference codes
   - Form to create new codes
   - Table to view all codes
   - Copy-to-clipboard functionality
   - Delete codes

2. **`frontend/src/pages/ReferenceCodeManagement.css`**
   - Styling for the reference code management page

3. **`frontend/src/pages/Signup.tsx`**
   - Complete signup page with reference code validation
   - Two-step process: validate code → create account
   - Displays assigned role after validation

### Modified Files:

4. **`frontend/src/App.tsx`**
   - Added route: `/reference-codes` (admin only)
   - Added route: `/signup` (public)

5. **`frontend/src/components/AppSidebar.tsx`**
   - Added "Referans Kodları" menu item (admin only)
   - Only visible when `user.role === 'admin'`

6. **`frontend/src/pages/Login.tsx`**
   - Added "Kayıt Ol" (Sign Up) link

---

## ⚙️ Environment Configuration

### Backend Configuration (`backend/config.env`)

Ensure these environment variables are set:

```env
# Database Configuration
HOST_RELATIONAL_DB=127.0.0.1
PORT_RELATIONAL_DB=3306
USER_RELATIONAL_DB=admin
PASSWORD_RELATIONAL_DB=admin
SCHEMA_RELATIONAL_DB=saraydb

# Backend Server
PORT_HTTP=3001

# JWT Secret (use a strong random key in production)
JWT_SECRET=your_secret_key_here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Frontend Configuration (`frontend/src/config.js`)

```javascript
const config = {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
    APP_NAME: 'Efendim App',
    VERSION: '1.0.0',
};

export default config;
```

---

## 🚀 Deployment Steps

### On Your Server:

1. **Update the database:**
   ```bash
   mysql -u admin -p saraydb < path/to/create-referencecodes-table.sql
   ```

2. **Copy backend files:**
   - Copy all files from `backend/` to your server
   - Make sure to delete any `.js` files in `routes/` and `controller/` folders

3. **Copy frontend files:**
   - Copy all files from `frontend/` to your server
   - Run `npm install` if dependencies are missing

4. **Update environment variables:**
   - Update `backend/config.env` with server database credentials
   - Update `frontend/src/config.js` with server API URL

5. **Install dependencies:**
   ```bash
   cd backend
   npm install

   cd ../frontend
   npm install
   ```

6. **Start the servers:**
   ```bash
   # Backend
   cd backend
   npm start

   # Frontend (in another terminal)
   cd frontend
   npm start
   ```

---

## ✅ Testing the System

### Test 1: Admin Can Access Reference Code Page

1. Login as admin (username: `admin1`, password: `password123`)
2. Look for "Referans Kodları" 🔑 in the sidebar
3. Click it - you should see the management page
4. If you don't see it, the user role might not be 'admin' (check database)

### Test 2: Create a Reference Code

1. Click "Yeni Referans Kodu Oluştur" button
2. Fill in the form:
   - **Rol**: Select Teacher, Student, or Admin
   - **Son Kullanma Tarihi**: Pick a future date
   - **Maksimum Kullanım Sayısı**: Enter 1 (or more for multi-use)
   - **Açıklama**: Optional description
3. Click "Oluştur"
4. You should see the code in the table below
5. Click the copy icon 📋 to copy the code

### Test 3: Sign Up with Reference Code

1. Logout from admin account
2. Go to login page
3. Click "Kayıt Ol" (Sign Up)
4. Enter the reference code from step 2
5. Click "Kodu Doğrula" (Validate Code)
6. If valid, you'll see the assigned role badge
7. Enter username and password
8. Click "Kayıt Ol" (Sign Up)
9. You should be automatically logged in with the assigned role

### Test 4: Non-Admin Cannot Access

1. Login as a non-admin user (e.g., teacher or student)
2. The "Referans Kodları" menu should NOT appear in sidebar
3. If you try to access `/reference-codes` directly, you should see "Erişiminiz yok"

---

## 🔒 Security Features

### Frontend Security:
- ✅ Menu item only visible to admins (`user.role === 'admin'`)
- ✅ Route protected with `RequireRole(['admin'])`
- ✅ Displays "Erişiminiz yok" for non-admins

### Backend Security:
- ✅ All admin endpoints require JWT authentication
- ✅ `requireAdmin` middleware checks user role
- ✅ Returns 403 Forbidden for non-admin users
- ✅ Only validation endpoint is public (needed for signup)

### Protected Endpoints:
- `POST /reference-codes` - Create code (admin only)
- `GET /reference-codes` - List codes (admin only)
- `DELETE /reference-codes/:id` - Delete code (admin only)

### Public Endpoints:
- `GET /reference-codes/validate/:code` - Validate code (public, needed for signup)
- `POST /auth/signup` - Create account with valid code (public)

---

## 🐛 Troubleshooting

### Problem: "Cannot POST /auth/signup"

**Solution:** Delete old compiled JavaScript files:
```bash
cd backend
rm routes/authRoute.js
rm controller/authController.js
```
Then restart the backend server.

---

### Problem: "Forbidden: Admin access required"

**Cause:** The backend is checking for 'Admin' but database has 'admin' (lowercase)

**Solution:** Make sure `requireAdmin` middleware uses lowercase:
```typescript
if (!req.user || req.user.role !== 'admin') {  // lowercase 'admin'
```

---

### Problem: "Referans Kodları" not showing in sidebar

**Cause:** User role doesn't match 'admin'

**Solution:** Check the database:
```sql
SELECT username, role_name FROM User WHERE username = 'admin1';
-- Should return role_name as 'admin' (lowercase)
```

Update the sidebar check to use lowercase:
```typescript
{user?.role === 'admin' && (  // lowercase 'admin'
```

---

### Problem: Table creation fails with foreign key error

**Solution:** Create table without foreign keys:
```sql
-- Use the simplified version without FOREIGN KEY constraints
-- The application handles referential integrity
```

---

### Problem: "Sunucuya erişilemedi" (Cannot reach server)

**Cause:** Backend server not running

**Solution:**
1. Check if backend is running: `curl http://localhost:3001`
2. Check for port conflicts: `netstat -ano | findstr :3001`
3. Restart backend: `cd backend && npm start`

---

## 📝 API Endpoints Reference

### Admin Endpoints (Require Authentication + Admin Role)

```
POST /reference-codes
Body: {
  "roleId": "Teacher" | "Student" | "Admin",
  "expiresAt": "2025-12-31T23:59:59",
  "maxUses": 1,
  "description": "Optional description"
}
Response: ReferenceCode object
```

```
GET /reference-codes
Response: Array of ReferenceCode objects
```

```
DELETE /reference-codes/:id
Response: Success message
```

### Public Endpoints

```
GET /reference-codes/validate/:code
Response: {
  "valid": true,
  "roleName": "hoca"
}
```

```
POST /auth/signup
Body: {
  "username": "newuser",
  "password": "password123",
  "referenceCode": "ABC123XYZ"
}
Response: {
  "message": "User created successfully",
  "token": "jwt_token...",
  "user": { "accountid": 1, "username": "newuser", "role": "hoca" }
}
```

---

## 📊 Database Schema

### ReferenceCodes Table Structure

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto-increment primary key |
| code | VARCHAR(50) | Unique reference code (e.g., "ABC123XYZ") |
| role_name | VARCHAR(45) | Role to assign (e.g., "admin", "hoca", "yoklamaci") |
| createdBy | INT | User ID of admin who created the code |
| expiresAt | DATETIME | When the code expires |
| isUsed | TINYINT(1) | Whether code is fully used (0 or 1) |
| usedBy | INT | User ID who used the code (NULL if unused) |
| usedAt | DATETIME | When the code was used (NULL if unused) |
| maxUses | INT | Maximum times code can be used (default: 1) |
| currentUses | INT | Current number of uses (default: 0) |
| description | VARCHAR(255) | Optional description |
| createdAt | DATETIME | When the code was created |
| updatedAt | DATETIME | Last update timestamp |

---

## 🎯 Role Mapping

The system uses different role names in frontend vs database:

| Frontend | Database | Description |
|----------|----------|-------------|
| Admin | admin | Full system access |
| Teacher | hoca | Teacher role |
| Student | yoklamaci | Student/attendance taker |

The backend automatically handles this mapping in `referenceCodeController.ts`.

---

## 💡 Usage Examples

### Example 1: Create Code for New Teacher

1. Admin logs in
2. Goes to "Referans Kodları"
3. Clicks "Yeni Referans Kodu Oluştur"
4. Fills form:
   - Rol: Teacher
   - Son Kullanma Tarihi: 2025-12-31 23:59
   - Maksimum Kullanım: 1
   - Açıklama: "New math teacher - Sarah"
5. Code generated: `A7B3C9D2`
6. Admin copies and shares with new teacher

### Example 2: Teacher Signs Up

1. New teacher visits `/signup`
2. Enters code: `A7B3C9D2`
3. Clicks "Kodu Doğrula"
4. Sees: "Öğretmen" role badge (✓ Kod geçerli)
5. Enters username: `sarah_teacher`
6. Enters password and confirms
7. Clicks "Kayıt Ol"
8. Automatically logged in as teacher

### Example 3: Code Expires

1. Admin created code with 7-day expiration
2. After 7 days, code shows "Süresi Doldu" status in table
3. If someone tries to use it: "Reference code has expired"

---

## 🔄 Maintenance

### Cleaning Up Old Codes

```sql
-- Delete expired codes (optional, do periodically)
DELETE FROM ReferenceCodes 
WHERE expiresAt < NOW() AND isUsed = 1;

-- View statistics
SELECT 
    role_name,
    COUNT(*) as total,
    SUM(isUsed) as used,
    SUM(IF(expiresAt < NOW(), 1, 0)) as expired
FROM ReferenceCodes
GROUP BY role_name;
```

---

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Verify all files are copied correctly
3. Check backend and frontend console logs
4. Ensure database table exists with correct structure
5. Verify environment variables are set correctly

---

## ✨ Features Summary

✅ Admin-only reference code generation  
✅ Role-based signup system  
✅ Code expiration dates  
✅ Single-use or multi-use codes  
✅ Copy-to-clipboard functionality  
✅ Real-time code validation  
✅ Status tracking (Active, Used, Expired)  
✅ Usage statistics  
✅ Complete audit trail  
✅ Secure authentication  
✅ Beautiful UI with animations  

---

**Last Updated:** October 21, 2025  
**Version:** 1.0.0  
**Author:** Efendim App Development Team
