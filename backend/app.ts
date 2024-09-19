import express, { Request, Response } from 'express';

const app = express() // Create express applicaiton
const port = 3000

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})

app.listen(port, () => { // Starting the server and listening on the defined port
  console.log(`App listening on port ${port}`)
})