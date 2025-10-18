# Program Management Guide

## Overview
This guide explains the enhanced program management system that allows you to create, edit, delete, and use programs dynamically in the attendance (yoklama) page.

## Features Implemented

### 1. Backend Enhancements

#### Program Controller (`backend/controller/programController.ts`)
- ✅ **GET /program** - Retrieve all programs
- ✅ **POST /program/create** - Create a new program (Admin only)
- ✅ **PUT /program/update/:program_name** - Update an existing program (Admin only)
- ✅ **DELETE /program/delete/:program_name** - Delete a program (Admin only)

#### API Endpoints
```
GET    /program                        - Get all programs
POST   /program/create                 - Create new program
PUT    /program/update/:program_name   - Update program
DELETE /program/delete/:program_name   - Delete program
```

### 2. Frontend Enhancements

#### Custom Management Page (`frontend/src/pages/CustomManagement.tsx`)
Enhanced with full CRUD operations:
- ✅ **Add new programs** - Enter program name and click "Ekle"
- ✅ **Edit programs** - Click pencil icon to edit inline
- ✅ **Delete programs** - Click trash icon to delete (with confirmation)
- ✅ **Real-time updates** - Changes reflect immediately
- ✅ **Beautiful UI** - Cards with animations and icons

#### Attendance Page (`frontend/src/pages/Attendance.tsx`)
Now dynamically loads programs:
- ✅ **Dynamic program loading** - Programs are fetched from database on page load
- ✅ **Auto-formatting** - Program names are displayed with proper formatting
- ✅ **No hardcoded values** - All programs come from your database

## How to Use

### Adding a New Program

1. Navigate to **Custom Management** page (Özel Yönetim)
2. Scroll to the **Program** section
3. Enter the program name in the input field (e.g., "cuma_namazi")
4. Click **Ekle** button or press Enter
5. The program will appear in the list immediately

### Editing a Program

1. In the Program list, click the **pencil icon** (✏️) next to the program you want to edit
2. The program name becomes editable
3. Type the new name
4. Click the **checkmark** (✓) or press Enter to save
5. Click the **X** to cancel

### Deleting a Program

1. Click the **trash icon** (🗑️) next to the program you want to delete
2. Confirm the deletion in the popup dialog
3. The program will be removed immediately

### Using Programs in Attendance Page

1. Go to **Yoklama** (Attendance) page
2. The **Program** dropdown will automatically show all programs from your database
3. Select a program from the dropdown
4. Choose a date
5. Click **Listele** to load attendance data

## Program Name Format

Programs are stored in the database using snake_case format (lowercase with underscores):
- `sabah_namazi`
- `oglen_namazi`
- `ikindi_namazi`
- `aksam_namazi`
- `yatsi_namazi`
- `cuma_namazi`
- `hatim`

The frontend automatically formats these for display:
- `sabah_namazi` → "Sabah namazi"
- `cuma_namazi` → "Cuma namazi"

## Database Schema

```sql
CREATE TABLE Program (
    program_name VARCHAR(45) PRIMARY KEY
);
```

## API Request Examples

### Create a Program
```bash
POST /program/create
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "program_name": "cuma_namazi"
}
```

### Update a Program
```bash
PUT /program/update/cuma_namazi
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "program_name": "cuma_namazi_yeni"
}
```

### Delete a Program
```bash
DELETE /program/delete/cuma_namazi
Authorization: Bearer <admin-token>
```

### Get All Programs
```bash
GET /program
Authorization: Bearer <token>
```

## Security

- **Authentication**: All endpoints require a valid JWT token
- **Authorization**: Create, Update, and Delete operations require Admin role
- **Validation**: Program names must be provided and unique

## Testing

1. **Test Backend**:
   ```bash
   cd backend
   npx tsc  # Compile TypeScript
   npm start  # Start server
   ```

2. **Test Frontend**:
   ```bash
   cd frontend
   npm start
   ```

3. **Verify**:
   - Login with an admin account
   - Go to Custom Management
   - Add a test program (e.g., "test_program")
   - Go to Attendance page
   - Verify the program appears in the dropdown
   - Edit/delete the test program

## Troubleshooting

### Programs not showing in dropdown
- Check browser console for errors
- Verify backend is running and accessible
- Check authentication token is valid
- Ensure `/program` endpoint returns data

### Cannot edit/delete programs
- Verify you're logged in as an admin user
- Check backend logs for authorization errors
- Ensure the program exists in the database

### Program names not formatting correctly
- Program names should use lowercase with underscores
- Frontend automatically formats for display
- Avoid special characters except underscores

## Future Enhancements

Possible improvements:
- [ ] Add program descriptions
- [ ] Set program schedules/times
- [ ] Program categories or groups
- [ ] Bulk import/export programs
- [ ] Program usage statistics
- [ ] Archive/deactivate instead of delete

## Related Files

### Backend
- `backend/controller/programController.ts`
- `backend/routes/programRoute.ts`
- `backend/data/models/Program.ts`

### Frontend
- `frontend/src/pages/CustomManagement.tsx`
- `frontend/src/pages/Attendance.tsx`
- `frontend/src/config.js`

## Support

For issues or questions:
1. Check the console logs (browser and terminal)
2. Verify database connection
3. Ensure all dependencies are installed
4. Check API endpoints with Postman/curl