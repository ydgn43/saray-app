import express, { Request, Response } from 'express';
import { studentRouter } from './routes/studentRoute';'./routes/studentRoute';
import { attendanceRoute } from './routes/attendanceRoute';'./routes/attendanceRoute';
import { userRouter } from './routes/userRoute';'./routes/userRoute';

const app = express() // Create express applicaiton
const port = 3000

// Routes
app.use("/student", studentRouter);
app.use("/attendance", attendanceRoute);
app.use("/user", userRouter);

app.listen(port, () => { // Starting the server and listening on the defined port
  console.log(`App listening on port ${port}`)
})