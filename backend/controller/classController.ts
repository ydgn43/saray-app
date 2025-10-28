// backend/controllers/classController.ts
import { Request, Response } from 'express';
import Class from '../data/models/Class';

export const classController = {
    async getAll(req: Request, res: Response) {
        try {
            const yurtid = req.selectedYurtId!;
            const classes = await Class.findAll({
                where: { yurtid },
                order: [['display_order', 'ASC'], ['class_name', 'ASC']]
            });
            res.json(classes);
        } catch (error: any) {
            console.error('Error fetching classes:', error);
            // If display_order column doesn't exist, try without ordering
            if (error.message?.includes('display_order') || error.original?.code === 'ER_BAD_FIELD_ERROR') {
                try {
                    const yurtid = req.selectedYurtId!;
                    const classes = await Class.findAll({
                        where: { yurtid },
                        order: [['class_name', 'ASC']]
                    });
                    console.warn('⚠️ Warning: display_order column not found, please run migration script');
                    res.json(classes);
                    return;
                } catch (fallbackError) {
                    console.error('Fallback query failed:', fallbackError);
                }
            }
            res.status(500).json({ message: 'Dahili Seviyelar alınamadı.' });
        }
    },

    async create(req: Request, res: Response) {
        if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
        const { class_name, display_name } = req.body;
        const yurtid = req.selectedYurtId!;
        if (!class_name) return res.status(400).json({ message: 'Dahili Seviye adı eksik.' });

        try {
            const exists = await Class.findOne({
                where: { class_name, yurtid }
            });
            if (exists) return res.status(409).json({ message: 'Dahili Seviye zaten mevcut.' });

            // Auto-assign display_order to be the highest + 1
            const maxOrderResult = await Class.findOne({
                where: { yurtid },
                order: [['display_order', 'DESC']],
                attributes: ['display_order']
            });
            const nextOrder = (maxOrderResult?.display_order ?? 0) + 1;

            await Class.create({ class_name, display_name, display_order: nextOrder, yurtid });
            res.status(201).json({ message: 'Dahili Seviye oluşturuldu.' });
        } catch {
            res.status(500).json({ message: 'Dahili Seviye oluşturulamadı.' });
        }
    },

    async update(req: Request, res: Response) {
        if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
        const oldClassName = req.params.class_name;
        const { class_name: newClassName, display_name } = req.body;
        const yurtid = req.selectedYurtId!;

        try {
            const cls = await Class.findOne({
                where: { class_name: oldClassName, yurtid }
            });
            if (!cls) return res.status(404).json({ message: 'Dahili Seviye bulunamadı.' });

            // If class_name is changing, check if new name already exists
            if (newClassName && newClassName !== oldClassName) {
                const exists = await Class.findOne({
                    where: { class_name: newClassName, yurtid }
                });
                if (exists) return res.status(409).json({ message: 'Yeni Dahili Seviye adı zaten mevcut.' });

                // Since class_name is the primary key, we need to create new and delete old
                const currentDisplayOrder = cls.display_order;
                await Class.create({
                    class_name: newClassName,
                    display_name: display_name ?? cls.display_name,
                    display_order: currentDisplayOrder,
                    yurtid
                });
                await cls.destroy();
            } else {
                // Just update display_name
                await cls.update({ display_name });
            }

            res.json({ message: 'Dahili Seviye güncellendi.' });
        } catch {
            res.status(500).json({ message: 'Dahili Seviye güncellenemedi.' });
        }
    },

    async updateOrder(req: Request, res: Response) {
        if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Yetkiniz yok.' });
        const { classes } = req.body; // Array of { class_name, display_order }
        const yurtid = req.selectedYurtId!;

        if (!Array.isArray(classes)) {
            return res.status(400).json({ message: 'Geçersiz veri formatı.' });
        }

        try {
            // Update each class's display_order
            for (const item of classes) {
                await Class.update(
                    { display_order: item.display_order },
                    { where: { class_name: item.class_name, yurtid } }
                );
            }

            res.json({ message: 'Dahili Seviye sıralaması güncellendi.' });
        } catch {
            res.status(500).json({ message: 'Dahili Seviye sıralaması güncellenemedi.' });
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
