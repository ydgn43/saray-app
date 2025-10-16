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

const app = express();
const port = process.env.PORT_HTTP || 3001;

// Define the whitelist of allowed frontend origins
const allowedOrigins = [
    'http://localhost:3000', // Local development environment
    'https://app.efendim.nl'  // Production frontend via Cloudflare
];

// 1. CORS Middleware (Handles all CORS headers, including OPTIONS/Preflight)
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like Postman, curl, or mobile apps)
        if (!origin) return callback(null, true);

        // Check if the requesting origin is in the allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Block all other origins
        return callback(new Error('CORS not allowed for ' + origin), false);
    },
    // Allows credentials (cookies, auth headers) to be sent cross-origin
    credentials: true,
    // Explicitly allow all necessary methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // Explicitly allow all necessary headers
    allowedHeaders: ['Content-Type', 'Authorization'],
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

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
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