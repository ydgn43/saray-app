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

// ✅ allow both local dev and production via Cloudflare
const allowedOrigins = [
    'http://localhost:3000',
    'https://app.efendim.nl',
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow Postman/curl
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS not allowed for ' + origin), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ ensure Express automatically handles OPTIONS for all routes
app.options('*', cors());


app.use(express.json());

// ✅ routes go AFTER CORS
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
