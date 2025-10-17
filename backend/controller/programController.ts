// backend/controllers/programController.ts
import { Request, Response } from 'express';
import Program from '../data/models/Program';

export const programController = {
    async getAll(req: Request, res: Response) {
        try {
            const programs = await Program.findAll();
            res.json(programs);
        } catch {
            res.status(500).json({ message: 'Programlar alınamadı.' });
        }
    },

    async create(req: Request, res: Response) {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
        const { program_name } = req.body;
        if (!program_name) return res.status(400).json({ message: 'Program adı eksik.' });

        try {
            const exists = await Program.findByPk(program_name);
            if (exists) return res.status(409).json({ message: 'Program zaten mevcut.' });

            await Program.create({ program_name });
            res.status(201).json({ message: 'Program oluşturuldu.' });
        } catch {
            res.status(500).json({ message: 'Program oluşturulamadı.' });
        }
    },

    async update(req: Request, res: Response) {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });

        const oldName = req.params.program_name;
        const { program_name: newName } = req.body;

        if (!newName) return res.status(400).json({ message: 'Yeni program adı eksik.' });

        try {
            const program = await Program.findByPk(oldName);
            if (!program) return res.status(404).json({ message: 'Program bulunamadı.' });

            // If name is changing, check if new name already exists
            if (oldName !== newName) {
                const exists = await Program.findByPk(newName);
                if (exists) return res.status(409).json({ message: 'Bu program adı zaten mevcut.' });

                // Since program_name is the primary key, we need to delete old and create new
                await program.destroy();
                await Program.create({ program_name: newName });
            }

            res.json({ message: 'Program güncellendi.' });
        } catch {
            res.status(500).json({ message: 'Program güncellenemedi.' });
        }
    },

    async delete(req: Request, res: Response) {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });

        try {
            const program = await Program.findByPk(req.params.program_name);
            if (!program) return res.status(404).json({ message: 'Program bulunamadı.' });

            await program.destroy();
            res.json({ message: 'Program silindi.' });
        } catch {
            res.status(500).json({ message: 'Program silinemedi.' });
        }
    },
};
