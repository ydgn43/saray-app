import config from 'dotenv';
config.config({ path: './config.env' });

import express, { Request, Response } from 'express';
import cors from 'cors';
import { sequelize } from './data/sequelize';
import { studentRouter } from './routes/studentRoute';'./routes/studentRoute';
import { attendanceRoute } from './routes/attendanceRoute';'./routes/attendanceRoute';
import { userRouter } from './routes/userRoute';'./routes/userRoute';

const app = express() // Create express applicaiton
const port = process.env.PORT_HTTP
app.use(express.json()); // parsing JSON

app.use(cors()); // Enable CORS

// Routes
app.use("/student", studentRouter);
app.use("/attendance", attendanceRoute);
app.use("/user", userRouter);

app.listen(port, () => { // Starting the server and listening on the defined port
  console.log(`App listening on port ${port}`)
})

// testing connection
async function testSequelizeConnection(){
    console.log(process.env.HOST_RELATIONAL_DB)
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}
testSequelizeConnection();