// backend/controllers/programController.ts
import { Request, Response } from 'express';
import Program from '../data/models/Program';

export const programController = {
    async getAll(req: Request, res: Response) {
        try {
            const yurtid = req.selectedYurtId!;
            const programs = await Program.findAll({
                where: { yurtid },
                order: [['display_order', 'ASC'], ['program_name', 'ASC']]
            });
            res.json(programs);
        } catch {
            res.status(500).json({ message: 'Programlar alınamadı.' });
        }
    },

    async create(req: Request, res: Response) {
        if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
        const { program_name, display_name } = req.body;
        const yurtid = req.selectedYurtId!;
        if (!program_name) return res.status(400).json({ message: 'Program adı eksik.' });

        try {
            const exists = await Program.findOne({
                where: { program_name, yurtid }
            });
            if (exists) return res.status(409).json({ message: 'Program zaten mevcut.' });

            // Get the max display_order and add 1
            const maxOrder = await Program.max('display_order', { where: { yurtid } }) as number | null;
            const display_order = (maxOrder || 0) + 1;

            await Program.create({
                program_name,
                display_name: display_name || null,
                display_order,
                yurtid
            });
            res.status(201).json({ message: 'Program oluşturuldu.' });
        } catch {
            res.status(500).json({ message: 'Program oluşturulamadı.' });
        }
    },

    async update(req: Request, res: Response) {
        if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });

        const oldName = req.params.program_name;
        const { program_name: newName, display_name } = req.body;
        const yurtid = req.selectedYurtId!;

        try {
            const program = await Program.findOne({
                where: { program_name: oldName, yurtid }
            });
            if (!program) return res.status(404).json({ message: 'Program bulunamadı.' });

            // If only display_name is provided (not changing program_name)
            if (!newName || newName === oldName) {
                // Just update display_name
                program.display_name = display_name || null;
                await program.save();
            } else {
                // Changing program_name
                const exists = await Program.findOne({
                    where: { program_name: newName, yurtid }
                });
                if (exists) return res.status(409).json({ message: 'Bu program adı zaten mevcut.' });

                // Since program_name is part of composite key, we need to delete old and create new
                const oldOrder = program.display_order;
                await program.destroy();
                await Program.create({
                    program_name: newName,
                    display_name: display_name || null,
                    display_order: oldOrder,
                    yurtid
                });
            }

            res.json({ message: 'Program güncellendi.' });
        } catch {
            res.status(500).json({ message: 'Program güncellenemedi.' });
        }
    },

    async updateOrder(req: Request, res: Response) {
        if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });

        const { programs } = req.body; // Array of { program_name, display_order }
        const yurtid = req.selectedYurtId!;

        if (!Array.isArray(programs)) {
            return res.status(400).json({ message: 'Geçersiz veri formatı.' });
        }

        try {
            // Update each program's display_order
            for (const item of programs) {
                await Program.update(
                    { display_order: item.display_order },
                    { where: { program_name: item.program_name, yurtid } }
                );
            }

            res.json({ message: 'Program sıralaması güncellendi.' });
        } catch (error) {
            console.error('Error updating program order:', error);
            res.status(500).json({ message: 'Sıralama güncellenemedi.' });
        }
    },

    async delete(req: Request, res: Response) {
        if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
        const yurtid = req.selectedYurtId!;

        try {
            const program = await Program.findOne({
                where: { program_name: req.params.program_name, yurtid }
            });
            if (!program) return res.status(404).json({ message: 'Program bulunamadı.' });

            await program.destroy();
            res.json({ message: 'Program silindi.' });
        } catch {
            res.status(500).json({ message: 'Program silinemedi.' });
        }
    },
};
