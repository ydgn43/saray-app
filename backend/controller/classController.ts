// backend/controllers/classController.ts
import { Request, Response } from 'express';
import Class from '../data/models/Class';

export const classController = {
    async getAll(req: Request, res: Response) {
        try {
            const yurtid = req.selectedYurtId!;
            const classes = await Class.findAll({
                where: { yurtid }
            });
            res.json(classes);
        } catch {
            res.status(500).json({ message: 'Dahili Seviyelar alınamadı.' });
        }
    },

    async create(req: Request, res: Response) {
        if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
        const { class_name } = req.body;
        const yurtid = req.selectedYurtId!;
        if (!class_name) return res.status(400).json({ message: 'Dahili Seviye adı eksik.' });

        try {
            const exists = await Class.findOne({
                where: { class_name, yurtid }
            });
            if (exists) return res.status(409).json({ message: 'Dahili Seviye zaten mevcut.' });

            await Class.create({ class_name, yurtid });
            res.status(201).json({ message: 'Dahili Seviye oluşturuldu.' });
        } catch {
            res.status(500).json({ message: 'Dahili Seviye oluşturulamadı.' });
        }
    },

    async delete(req: Request, res: Response) {
        if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
        const yurtid = req.selectedYurtId!;

        try {
            const cls = await Class.findOne({
                where: { class_name: req.params.class_name, yurtid }
            });
            if (!cls) return res.status(404).json({ message: 'Dahili Seviye bulunamadı.' });

            await cls.destroy();
            res.json({ message: 'Dahili Seviye silindi.' });
        } catch {
            res.status(500).json({ message: 'Dahili Seviye silinemedi.' });
        }
    },
};
