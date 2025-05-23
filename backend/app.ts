import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });


import express, { Request, Response } from 'express';
import cors from 'cors';
import { sequelize } from './data/sequelize';
import { studentRouter } from './routes/studentRoute'; './routes/studentRoute';
import { attendanceRoute } from './routes/attendanceRoute'; './routes/attendanceRoute';
import { userRouter } from './routes/userRoute'; './routes/userRoute';
import { authRouter } from './routes/authRoute';





const app = express() // Create express applicaiton
const port = process.env.PORT_HTTP

const allowedOrigins = [
    "http://localhost:3000",
    "http://192.168.50.120:3000" // your PC's IP and React port
];

app.options('*', cors({ origin: allowedOrigins, credentials: true }));
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // Allow REST tools like Postman/cURL
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS not allowed for ' + origin), false);
    },
    credentials: true
}));

app.use(express.json()); // parsing JSON

app.use('/auth', authRouter); // Authentication route

//app.use(cors()); // Enable CORS


// Routes
app.use("/student", studentRouter);
app.use("/attendance", attendanceRoute);
app.use("/user", userRouter);
app.use('/user', userRouter);

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