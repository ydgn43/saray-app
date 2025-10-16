import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });


import express, { Request, Response } from 'express';
import cors from 'cors';
import { sequelize } from './data/sequelize';
import { studentRouter } from './routes/studentRoute';
import { attendanceRouter } from './routes/attendanceRoute';
import { userRouter } from './routes/userRoute';
import { authRouter } from './routes/authRoute';
import { seasonRouter } from './routes/seasonRoute';
import { programRouter } from './routes/programRoute';
import { classRouter } from './routes/classRoute';





const app = express() // Create express applicaiton
const port = process.env.PORT_HTTP

const allowedOrigins = [
    "http://localhost:3000",
    "https://app.efendim.nl"   // ✅ add your production frontend domain
];

app.options('*', cors({ origin: allowedOrigins, credentials: true }));
app.use(cors({
    origin: function (origin, callback) {
        // allow REST tools like Postman or same-origin (no Origin header)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) return callback(null, true);

        return callback(new Error('CORS not allowed for ' + origin), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json()); // parsing JSON



//app.use(cors()); // Enable CORS


// Routes
app.use("/student", studentRouter);
app.use("/attendance", attendanceRouter);
app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use('/season', seasonRouter);
app.use('/program', programRouter);
app.use('/class', classRouter);


app.listen(port, () => { // Starting the server and listening on the defined port
    console.log(`App listening on port ${port}`)
})

// testing connection
async function testSequelizeConnection() {
    console.log(process.env.HOST_RELATIONAL_DB)
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}
testSequelizeConnection();