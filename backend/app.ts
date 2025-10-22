import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import express from 'express';
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

const app = express();
const port = Number(process.env.PORT_HTTP) || 3001;
const host = '0.0.0.0';

// Define the whitelist of allowed frontend origins
const allowedOrigins = [
    "http://localhost:3000",
    "http://192.168.50.238:3000",
    "https://app.efendim.nl",
    "https://api.efendim.nl"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow REST tools like Postman
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.error("❌ CORS blocked for", origin);
        return callback(new Error("CORS not allowed for " + origin), false);
    },
    credentials: true
}));

// ⛔️ REMOVED THE app.options('*') BLOCK HERE! 
// The 'cors' middleware above handles preflight requests correctly.

app.use(express.json());

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

console.log('✅ All routes registered successfully!');
console.log('📍 Auth routes: POST /auth/login, POST /auth/signup');

// Catch-all for debugging 404s
app.use((req, res, next) => {
    console.log(`⚠️  404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Route not found', path: req.url, method: req.method });
});

app.listen(port, host, () => {
    console.log(`🚀 Backend server listening on http://${host}:${port}`);
    console.log(`📡 CORS enabled for: ${allowedOrigins.join(', ')}`);
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