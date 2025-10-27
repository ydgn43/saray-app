# Şifre Sıfırlama (Password Reset) Feature

## Overview
This feature allows users to reset their forgotten passwords through a secure token-based system.

## How It Works

### 1. **User Flow**
1. User clicks "Şifremi Unuttum" link on login page
2. User enters their username
3. System generates an 8-character reset token (valid for 24 hours)
4. User receives the token (currently displayed on screen - in production, send via email)
5. User enters the token and their new password
6. Password is reset successfully

### 2. **Database Changes**
Added two columns to the `user` table:
- `resetToken` (VARCHAR(255), nullable) - Stores hashed reset token
- `resetTokenExpiry` (DATETIME, nullable) - Token expiration timestamp

**Run this SQL to add the columns:**
```sql
ALTER TABLE user 
ADD COLUMN resetToken VARCHAR(255) NULL AFTER studentid,
ADD COLUMN resetTokenExpiry DATETIME NULL AFTER resetToken;
```

### 3. **Backend Endpoints**

#### POST `/auth/request-password-reset`
Request a password reset token.

**Request Body:**
```json
{
  "username": "john_doe"
}
```

**Response (Success):**
```json
{
  "message": "Şifre sıfırlama kodu oluşturuldu",
  "tokenGenerated": true,
  "resetToken": "A3B5C7D9",
  "username": "john_doe",
  "expiresAt": "2025-10-28T10:30:00.000Z",
  "note": "Bu kodu kullanıcıyla paylaşın. 24 saat geçerlidir."
}
```

#### POST `/auth/reset-password`
Reset password using the token.

**Request Body:**
```json
{
  "username": "john_doe",
  "resetToken": "A3B5C7D9",
  "newPassword": "newpassword123"
}
```

**Response (Success):**
```json
{
  "message": "Şifreniz başarıyla sıfırlandı. Şimdi giriş yapabilirsiniz",
  "success": true
}
```

### 4. **Frontend Pages**

#### `/forgot-password`
- User enters username
- System generates and displays reset token
- User can copy token or proceed directly to reset page

#### `/reset-password`
- User enters username, reset token, and new password
- Validates token and updates password
- Redirects to login page on success

### 5. **Security Features**

✅ **Token Hashing**: Reset tokens are hashed with bcrypt before storing in database
✅ **Expiration**: Tokens expire after 24 hours
✅ **One-time Use**: Token is cleared from database after successful reset
✅ **Username Required**: Must know exact username to reset password
✅ **No User Enumeration**: Doesn't reveal if username exists or not (on request)
✅ **Password Validation**: Minimum 4 characters required

### 6. **Files Modified/Created**

**Backend:**
- `backend/controller/authController.ts` - Added `requestPasswordReset()` and `resetPassword()`
- `backend/routes/authRoute.ts` - Added routes for reset endpoints
- `backend/data/models/User.ts` - Added `resetToken` and `resetTokenExpiry` fields

**Frontend:**
- `frontend/src/pages/ForgotPassword.tsx` - New page for requesting reset
- `frontend/src/pages/ResetPassword.tsx` - New page for resetting password
- `frontend/src/pages/Login.tsx` - Added "Şifremi Unuttum" link
- `frontend/src/App.tsx` - Added routes for `/forgot-password` and `/reset-password`

**Database:**
- `db/add-password-reset-columns.sql` - Migration script

## Testing

### Test the feature:

1. **Request Reset Token:**
```bash
curl -X POST http://localhost:3001/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'
```

2. **Reset Password:**
```bash
curl -X POST http://localhost:3001/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "resetToken":"A3B5C7D9",
    "newPassword":"newpass123"
  }'
```

## Future Enhancements

### For Production:
1. **Email Integration**: Send reset tokens via email instead of displaying them
2. **SMS Option**: Allow password reset via SMS
3. **Security Questions**: Add additional verification step
4. **Admin Override**: Allow admins to reset user passwords
5. **Rate Limiting**: Prevent brute force attacks on token verification
6. **Audit Logging**: Log all password reset attempts

### Example Email Integration:
```typescript
// In requestPasswordReset function:
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

await transporter.sendMail({
  from: 'no-reply@efendimapp.com',
  to: user.email, // You'll need to add email field to user table
  subject: 'Şifre Sıfırlama Kodu',
  html: `
    <h2>Şifre Sıfırlama</h2>
    <p>Şifre sıfırlama kodunuz: <strong>${resetToken}</strong></p>
    <p>Bu kod 24 saat geçerlidir.</p>
    <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı dikkate almayın.</p>
  `
});
```

## Troubleshooting

### Token Not Working
- Check if token has expired (24 hours)
- Verify token is entered correctly (case-sensitive)
- Ensure username is correct

### Database Errors
- Make sure migration script was run
- Check if columns exist: `DESCRIBE user;`

### Backend Not Compiling
- Run `npx tsc` in backend folder
- Check for TypeScript errors in modified files

## Notes

- **Development Mode**: Reset token is displayed in response for testing
- **Production Mode**: Remove `resetToken` from response and send via email
- **Token Format**: 8 uppercase alphanumeric characters (e.g., "A3B5C7D9")
- **Token Storage**: Hashed with bcrypt (cost factor 10)
- **Expiration**: 24 hours from generation time
