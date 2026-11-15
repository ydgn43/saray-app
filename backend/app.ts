import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { sequelize } from './data/sequelize';
import { studentRouter } from './routes/studentRoute';
import { attendanceRouter } from './routes/attendanceRoute';
import { userRouter } from './routes/userRoute';
import { authRouter } from './routes/authRoute';
import { seasonRouter } from './routes/seasonRoute';
import { programRouter } from './routes/programRoute';
import { classRouter } from './routes/classRoute';
import referenceCodeRouter from './routes/referenceCodeRoute';
import { activityLogRouter } from './routes/activityLogRoute';
import yurtRouter from './routes/yurtRoute';
import yurtManagementRouter from './routes/yurtManagementRoute';
import superAdminRouter from './routes/superAdminRoute';
import exitRouter from './routes/exitRoute';
import attendanceReasonRouter from './routes/attendanceReasonRoute';
import { initializeWebSocket } from './websocket/socketServer';
import path from 'path';
import fs from 'fs';
import { getAllowedOrigins, isServingFrontend, assertStrongJwtSecret } from './utils/hostingConfig';

const app = express();
const httpServer = createServer(app);
const port = Number(process.env.PORT_HTTP) || 3001;
const host = '0.0.0.0';

// Whitelist of allowed frontend origins (ALLOWED_ORIGINS in config.env, or the built-in list)
const allowedOrigins = getAllowedOrigins();

// Hosting mode: this server also serves the built frontend (see deploy/README.md)
const serveFrontend = isServingFrontend();
if (serveFrontend) {
    assertStrongJwtSecret();
}

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow REST tools like Postman
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.error("CORS blocked for", origin);
        return callback(new Error("CORS not allowed for " + origin), false);
    },
    credentials: true,
    exposedHeaders: ['X-Yurt-Id'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Yurt-Id']
}));

// REMOVED THE app.options('*') BLOCK HERE! 
// The 'cors' middleware above handles preflight requests correctly.

app.use(express.json());

// Hosting mode: serve the built React app from the same address as the API.
// Browser page loads (Accept: text/html) get index.html so that refreshing a page
// like /attendance works; API calls (fetch, Accept: */* or json) are unaffected.
if (serveFrontend) {
    const buildDir = path.resolve(process.env.FRONTEND_BUILD_DIR || path.join(__dirname, '..', 'frontend', 'build'));
    const indexFile = path.join(buildDir, 'index.html');
    if (!fs.existsSync(indexFile)) {
        console.error(`FATAL: SERVE_FRONTEND=true but ${indexFile} does not exist. Build the frontend first.`);
        process.exit(1);
    }
    app.use(express.static(buildDir, { index: false }));
    app.get('*', (req, res, next) => {
        const wantsHtml = (req.headers.accept || '').includes('text/html');
        if (!wantsHtml || req.path.startsWith('/socket.io') || req.path === '/health') return next();
        res.sendFile(indexFile);
    });
    console.log(`Serving frontend from ${buildDir}`);
}

// 2. Routes go AFTER the CORS middleware
app.use('/student', studentRouter);
app.use('/attendance', attendanceRouter);
app.use('/user', userRouter);
app.use('/auth', authRouter);
app.use('/season', seasonRouter);
app.use('/program', programRouter);
app.use('/class', classRouter);
app.use('/reference-codes', referenceCodeRouter);
app.use('/activity-logs', activityLogRouter);
app.use('/yurts', yurtRouter);
app.use('/yurt-management', yurtManagementRouter);
app.use('/super-admin', superAdminRouter);
app.use('/exit', exitRouter);
app.use('/attendance-reasons', attendanceReasonRouter);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        const User = sequelize.models.UserSequelize;
        const userCount = await User.count();
        res.json({
            status: 'OK',
            database: 'Connected',
            userCount: userCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            database: 'Disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

console.log('All routes registered successfully!');
console.log('Auth routes: POST /auth/login, POST /auth/signup');

// Catch-all for debugging 404s
app.use((req, res, next) => {
    console.log(` 404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Route not found', path: req.url, method: req.method });
});

// Initialize WebSocket server
initializeWebSocket(httpServer);

httpServer.listen(port, host, () => {
    console.log(`Backend server listening on http://${host}:${port}`);
    console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
    console.log(`WebSocket server initialized`);
});

async function testSequelizeConnection() {
    try {
        await sequelize.authenticate();
        console.log('Connection established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}
testSequelizeConnection();