import express, { Request, Response } from 'express';

export const attendanceRoute = express.Router();

attendanceRoute.get('/', (req: Request, res: Response) => {
    res.send('attendance GET not yet implemented')
})

attendanceRoute.post('/', (req: Request, res: Response) => {
    res.send('attendance POST not yet implemented')
})

attendanceRoute.put('/', (req: Request, res: Response) => {
    res.send('attendance PUT not yet implemented')
})

attendanceRoute.delete('/', (req: Request, res: Response) => {
    res.send('attendance DELETE not yet implemented')
})