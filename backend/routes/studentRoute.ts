import express, { Request, Response } from 'express';

export const studentRouter = express.Router();

studentRouter.get('/', (req: Request, res: Response) => {
    res.send('student GET not yet implemented')
})

studentRouter.post('/', (req: Request, res: Response) => {
    res.send('student POST not yet implemented')
})

studentRouter.put('/', (req: Request, res: Response) => {
    res.send('student PUT not yet implemented')
})

studentRouter.delete('/', (req: Request, res: Response) => {
    res.send('student DELETE not yet implemented')
})