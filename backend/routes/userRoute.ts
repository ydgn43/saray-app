import express, { Request, Response } from 'express';

export const userRouter = express.Router();

userRouter.get('/', (req: Request, res: Response) => {
    res.send('user GET not yet implemented')
})

userRouter.post('/', (req: Request, res: Response) => {
    res.send('user POST not yet implemented')
})

userRouter.put('/', (req: Request, res: Response) => {
    res.send('user PUT not yet implemented')
})

userRouter.delete('/', (req: Request, res: Response) => {
    res.send('user DELETE not yet implemented')
})