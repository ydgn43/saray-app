// backend/controllers/seasonController.ts
import { Request, Response } from 'express';
import Season from '../data/models/Season';

export const seasonController = {
    async getAll(req: Request, res: Response) {
        try {
            const yurtid = req.selectedYurtId!;
            const seasons = await Season.findAll({
                where: { yurtid }
            });
            res.json(seasons);
        } catch {
            res.status(500).json({ message: 'Sezonlar alınamadı.' });
        }
    },

    async create(req: Request, res: Response) {
        if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
        const { season_year } = req.body;
        const yurtid = req.selectedYurtId!;
        if (!season_year) return res.status(400).json({ message: 'Sezon bilgisi eksik.' });

        try {
            const exists = await Season.findOne({
                where: { season_year, yurtid }
            });
            if (exists) return res.status(409).json({ message: 'Sezon zaten mevcut.' });

            await Season.create({ season_year, yurtid });
            res.status(201).json({ message: 'Sezon oluşturuldu.' });
        } catch {
            res.status(500).json({ message: 'Sezon oluşturulamadı.' });
        }
    },

    async delete(req: Request, res: Response) {
        if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
        const yurtid = req.selectedYurtId!;

        try {
            const season = await Season.findOne({
                where: { season_year: req.params.season_year, yurtid }
            });
            if (!season) return res.status(404).json({ message: 'Sezon bulunamadı.' });

            await season.destroy();
            res.json({ message: 'Sezon silindi.' });
        } catch {
            res.status(500).json({ message: 'Sezon silinemedi.' });
        }
    },
};
