# API Configuration Management

This document explains how the centralized API configuration system works in the Saray App.

## Overview

All API endpoints are now configured through a centralized configuration system that allows you to change the backend URL in just one place.

## Configuration Files

### Frontend Configuration

1. **`frontend/.env`** - Environment variables for React
   ```env
   REACT_APP_API_BASE_URL=http://localhost:3001
   ```

2. **`frontend/src/config.js`** - Main configuration file
   ```javascript
   const config = {
     API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
     APP_NAME: 'Saray App',
     VERSION: '1.0.0',
   };
   ```

### Backend Configuration

1. **`backend/config.env`** - Backend environment variables
   ```env
   PORT_HTTP=3001
   REACT_APP_API_BASE_URL=http://localhost:3001
   ```

## How to Change API URLs

To switch between development and production environments, you only need to update:

1. **For Development (localhost):**
   - Update `frontend/.env`: `REACT_APP_API_BASE_URL=http://localhost:3001`
   - Update `backend/config.env`: `REACT_APP_API_BASE_URL=http://localhost:3001`

2. **For Production:**
   - Update `frontend/.env`: `REACT_APP_API_BASE_URL=https://api.yourdomain.com`
   - Update `backend/config.env`: `REACT_APP_API_BASE_URL=https://api.yourdomain.com`

## Updated Files

The following frontend files have been updated to use the centralized configuration:

- `src/pages/Login.tsx`
- `src/pages/Home.tsx`
- `src/pages/AccountSettings.tsx`
- `src/pages/UserManagement.tsx`
- `src/pages/Talebeler.tsx`
- `src/pages/Statistics.tsx`
- `src/pages/IzinliTalebeler.tsx`
- `src/pages/Attendance.tsx`
- `src/pages/CustomManagement.tsx`

## Usage in Code

Instead of hardcoded URLs like:
```javascript
// OLD WAY - Don't do this
const response = await fetch('https://api.efendim.nl/user');
```

Now use the configuration:
```javascript
// NEW WAY - Use this
import config from '../config';
const response = await fetch(`${config.API_BASE_URL}/user`);
```

## Environment Variables

React environment variables must start with `REACT_APP_` to be accessible in the frontend code. The config.js file reads from these environment variables and provides fallback defaults.

## Benefits

1. **Single Point of Change**: Change the API URL in one place for the entire application
2. **Environment-Specific**: Different URLs for development, staging, and production
3. **Type Safety**: Centralized configuration reduces typos and errors
4. **Maintainability**: Easier to maintain and update API endpoints

## Future Extensions

You can easily add more configuration options to the `config.js` file:

```javascript
const config = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  APP_NAME: process.env.REACT_APP_NAME || 'Saray App',
  VERSION: '1.0.0',
  FEATURES: {
    ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    ENABLE_DEBUG: process.env.NODE_ENV === 'development',
  },
};
```