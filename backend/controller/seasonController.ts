// backend/controllers/seasonController.ts
import { Request, Response } from 'express';
import Season from '../data/models/Season';

export const seasonController = {
    async getAll(req: Request, res: Response) {
        try {
            const seasons = await Season.findAll();
            res.json(seasons);
        } catch {
            res.status(500).json({ message: 'Sezonlar alınamadı.' });
        }
    },

    async create(req: Request, res: Response) {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
        const { season_year } = req.body;
        if (!season_year) return res.status(400).json({ message: 'Sezon bilgisi eksik.' });

        try {
            const exists = await Season.findByPk(season_year);
            if (exists) return res.status(409).json({ message: 'Sezon zaten mevcut.' });

            await Season.create({ season_year });
            res.status(201).json({ message: 'Sezon oluşturuldu.' });
        } catch {
            res.status(500).json({ message: 'Sezon oluşturulamadı.' });
        }
    },

    async delete(req: Request, res: Response) {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });

        try {
            const season = await Season.findByPk(req.params.season_year);
            if (!season) return res.status(404).json({ message: 'Sezon bulunamadı.' });

            await season.destroy();
            res.json({ message: 'Sezon silindi.' });
        } catch {
            res.status(500).json({ message: 'Sezon silinemedi.' });
        }
    },
};
