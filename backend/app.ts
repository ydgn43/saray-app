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

app.listen(port, host, () => {
    console.log(`App listening on ${host}:${port}`);
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