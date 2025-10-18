// backend/controllers/classController.ts
import { Request, Response } from 'express';
import Class from '../data/models/Class';

export const classController = {
    async getAll(req: Request, res: Response) {
        try {
            const classes = await Class.findAll();
            res.json(classes);
        } catch {
            res.status(500).json({ message: 'Sınıflar alınamadı.' });
        }
    },

    async create(req: Request, res: Response) {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
        const { class_name } = req.body;
        if (!class_name) return res.status(400).json({ message: 'Sınıf adı eksik.' });

        try {
            const exists = await Class.findByPk(class_name);
            if (exists) return res.status(409).json({ message: 'Sınıf zaten mevcut.' });

            await Class.create({ class_name });
            res.status(201).json({ message: 'Sınıf oluşturuldu.' });
        } catch {
            res.status(500).json({ message: 'Sınıf oluşturulamadı.' });
        }
    },

    async delete(req: Request, res: Response) {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });

        try {
            const cls = await Class.findByPk(req.params.class_name);
            if (!cls) return res.status(404).json({ message: 'Sınıf bulunamadı.' });

            await cls.destroy();
            res.json({ message: 'Sınıf silindi.' });
        } catch {
            res.status(500).json({ message: 'Sınıf silinemedi.' });
        }
    },
};
