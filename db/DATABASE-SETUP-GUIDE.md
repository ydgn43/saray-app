# 🗄️ DATABASE SETUP GUIDE - Reference Code Feature

## Overview
This guide will help you add the ReferenceCodes table to your database so admins can create signup codes.

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ MySQL installed and running
- ✅ Database `saraydb` exists
- ✅ Tables: `User`, `Role` exist
- ✅ MySQL credentials: username=`admin`, password=`admin`

---

## 🚀 Step-by-Step Instructions

### **Option 1: Using MySQL Workbench (Recommended for beginners)**

#### Step 1: Open MySQL Workbench
1. Launch MySQL Workbench
2. Connect to your local MySQL server:
   - Hostname: `127.0.0.1`
   - Port: `3306`
   - Username: `admin`
   - Password: `admin`

#### Step 2: Select Your Database
1. In the left sidebar, find `saraydb`
2. Right-click on `saraydb` → **Set as Default Schema**
3. Or run this query:
   ```sql
   USE saraydb;
   ```

#### Step 3: Run the Setup Script
1. Open the file: `db/SETUP-REFERENCE-CODES-STEP-BY-STEP.sql`
2. Copy the entire contents
3. Paste into a new query tab in MySQL Workbench
4. Click the lightning bolt icon (⚡) to execute
5. Check for any errors in the output

#### Step 4: Verify the Table
Run this query to confirm:
```sql
SHOW TABLES LIKE 'ReferenceCodes';
DESCRIBE ReferenceCodes;
```

You should see the ReferenceCodes table structure.

---

### **Option 2: Using Command Line**

#### Step 1: Open Command Prompt or PowerShell
```powershell
# Navigate to your project
cd C:\Users\ydgn4\Documents\GitHub\saray-app
```

#### Step 2: Login to MySQL
```powershell
mysql -u admin -p
# Enter password: admin
```

#### Step 3: Run the Script
```sql
USE saraydb;
source db/SETUP-REFERENCE-CODES-STEP-BY-STEP.sql
```

Or run it directly:
```powershell
mysql -u admin -p saraydb < db/SETUP-REFERENCE-CODES-STEP-BY-STEP.sql
```

#### Step 4: Verify
```sql
mysql -u admin -p saraydb -e "DESCRIBE ReferenceCodes;"
```

---

### **Option 3: Quick Copy-Paste (Fastest)**

1. **Open any MySQL client** (Workbench, HeidiSQL, DBeaver, etc.)
2. **Connect to your database**
3. **Select the `saraydb` database**
4. **Copy and paste this SQL:**

```sql
USE saraydb;

CREATE TABLE IF NOT EXISTS `ReferenceCodes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `role_name` VARCHAR(45) NOT NULL,
    `createdBy` INT NOT NULL,
    `expiresAt` DATETIME NOT NULL,
    `isUsed` BOOLEAN DEFAULT FALSE,
    `usedBy` INT NULL,
    `usedAt` DATETIME NULL,
    `maxUses` INT DEFAULT 1,
    `currentUses` INT DEFAULT 0,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_code` (`code`),
    CONSTRAINT `fk_ReferenceCode_CreatedBy`
        FOREIGN KEY (`createdBy`)
        REFERENCES `User` (`userid`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_ReferenceCode_UsedBy`
        FOREIGN KEY (`usedBy`)
        REFERENCES `User` (`userid`)
        ON DELETE SET NULL,
    CONSTRAINT `fk_ReferenceCode_Role`
        FOREIGN KEY (`role_name`)
        REFERENCES `Role` (`role_name`)
        ON DELETE CASCADE,
    INDEX `idx_code` (`code`),
    INDEX `idx_role_name` (`role_name`),
    INDEX `idx_createdBy` (`createdBy`),
    INDEX `idx_isUsed` (`isUsed`),
    INDEX `idx_expiresAt` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

5. **Execute** (press F5 or click Run)
6. **Check for success message**

---

## ✅ Verification Checklist

After running the script, verify everything worked:

### 1. Check Table Exists
```sql
SHOW TABLES LIKE 'ReferenceCodes';
```
**Expected:** 1 row returned

### 2. Check Table Structure
```sql
DESCRIBE ReferenceCodes;
```
**Expected:** 13 columns (id, code, role_name, createdBy, etc.)

### 3. Check Foreign Keys
```sql
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'saraydb' 
AND TABLE_NAME = 'ReferenceCodes'
AND REFERENCED_TABLE_NAME IS NOT NULL;
```
**Expected:** 3 foreign key relationships

### 4. Check Indexes
```sql
SHOW INDEX FROM ReferenceCodes;
```
**Expected:** Multiple indexes on code, role_name, createdBy, etc.

### 5. Test Empty Table
```sql
SELECT COUNT(*) FROM ReferenceCodes;
```
**Expected:** 0 (empty table, ready to use)

---

## 🔧 Troubleshooting

### Problem: "Table 'User' doesn't exist"
**Solution:** Your User table might be named differently. Check:
```sql
SHOW TABLES LIKE '%user%';
```
Then update the foreign key references in the SQL script.

### Problem: "Cannot add foreign key constraint"
**Possible causes:**
1. The User table doesn't have a `userid` column
2. The Role table doesn't have a `role_name` column

**Solution:** Check your existing tables:
```sql
DESCRIBE User;
DESCRIBE Role;
```

If the column names are different, you need to update the TypeScript models.

### Problem: "Access denied"
**Solution:** Make sure you're using the correct credentials:
- Username: `admin`
- Password: `admin`
- Host: `127.0.0.1` or `localhost`

---

## 🎯 What's Next?

After the table is created:

1. ✅ **Start your backend server**
   ```powershell
   cd backend
   npm start
   ```

2. ✅ **Start your frontend**
   ```powershell
   cd frontend
   npm start
   ```

3. ✅ **Login as admin** at `http://localhost:3000`

4. ✅ **Navigate to "Referans Kodları"** in the sidebar

5. ✅ **Create your first reference code!**

---

## 📊 Database Structure Created

```
ReferenceCodes Table
├── id (Primary Key)
├── code (Unique, 50 chars)
├── role_name (Links to Role table)
├── createdBy (Links to User table)
├── expiresAt (Expiration date)
├── isUsed (Boolean)
├── usedBy (Links to User table)
├── usedAt (Timestamp)
├── maxUses (Integer)
├── currentUses (Integer)
├── description (Optional text)
├── createdAt (Auto timestamp)
└── updatedAt (Auto timestamp)
```

---

## ❓ Need Help?

If you encounter any issues:
1. Check the MySQL error message carefully
2. Verify your database credentials in `backend/config.env`
3. Make sure MySQL server is running
4. Check that `saraydb` database exists and you have permissions

---

**That's it! Your database is ready for the reference code feature! 🎉**
