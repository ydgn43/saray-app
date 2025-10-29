"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.programController = void 0;
const Program_1 = __importDefault(require("../data/models/Program"));
exports.programController = {
    getAll(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const yurtid = req.selectedYurtId;
                const programs = yield Program_1.default.findAll({
                    where: { yurtid },
                    order: [['display_order', 'ASC'], ['program_name', 'ASC']]
                });
                res.json(programs);
            }
            catch (error) {
                console.error('Error fetching programs:', error);
                // If display_order column doesn't exist, try without ordering
                if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('display_order')) || ((_b = error.original) === null || _b === void 0 ? void 0 : _b.code) === 'ER_BAD_FIELD_ERROR') {
                    try {
                        const yurtid = req.selectedYurtId;
                        const programs = yield Program_1.default.findAll({
                            where: { yurtid },
                            order: [['program_name', 'ASC']]
                        });
                        console.warn('⚠️ Warning: display_order column not found, please run migration script');
                        res.json(programs);
                        return;
                    }
                    catch (fallbackError) {
                        console.error('Fallback query failed:', fallbackError);
                    }
                }
                res.status(500).json({ message: 'Programlar alınamadı.' });
            }
        });
    },
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            const { program_name, display_name } = req.body;
            const yurtid = req.selectedYurtId;
            if (!program_name)
                return res.status(400).json({ message: 'Program adı eksik.' });
            try {
                const exists = yield Program_1.default.findOne({
                    where: { program_name, yurtid }
                });
                if (exists)
                    return res.status(409).json({ message: 'Program zaten mevcut.' });
                // Get the max display_order and add 1
                const maxOrder = yield Program_1.default.max('display_order', { where: { yurtid } });
                const display_order = (maxOrder || 0) + 1;
                yield Program_1.default.create({
                    program_name,
                    display_name: display_name || null,
                    display_order,
                    yurtid
                });
                res.status(201).json({ message: 'Program oluşturuldu.' });
            }
            catch (_a) {
                res.status(500).json({ message: 'Program oluşturulamadı.' });
            }
        });
    },
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            const oldName = req.params.program_name;
            const { program_name: newName, display_name } = req.body;
            const yurtid = req.selectedYurtId;
            try {
                const program = yield Program_1.default.findOne({
                    where: { program_name: oldName, yurtid }
                });
                if (!program)
                    return res.status(404).json({ message: 'Program bulunamadı.' });
                // If only display_name is provided (not changing program_name)
                if (!newName || newName === oldName) {
                    // Just update display_name
                    program.display_name = display_name || null;
                    yield program.save();
                }
                else {
                    // Changing program_name
                    const exists = yield Program_1.default.findOne({
                        where: { program_name: newName, yurtid }
                    });
                    if (exists)
                        return res.status(409).json({ message: 'Bu program adı zaten mevcut.' });
                    // Since program_name is part of composite key, we need to delete old and create new
                    const oldOrder = program.display_order;
                    yield program.destroy();
                    yield Program_1.default.create({
                        program_name: newName,
                        display_name: display_name || null,
                        display_order: oldOrder,
                        yurtid
                    });
                }
                res.json({ message: 'Program güncellendi.' });
            }
            catch (_a) {
                res.status(500).json({ message: 'Program güncellenemedi.' });
            }
        });
    },
    updateOrder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            const { programs } = req.body; // Array of { program_name, display_order }
            const yurtid = req.selectedYurtId;
            if (!Array.isArray(programs)) {
                return res.status(400).json({ message: 'Geçersiz veri formatı.' });
            }
            try {
                // Update each program's display_order
                for (const item of programs) {
                    yield Program_1.default.update({ display_order: item.display_order }, { where: { program_name: item.program_name, yurtid } });
                }
                res.json({ message: 'Program sıralaması güncellendi.' });
            }
            catch (error) {
                console.error('Error updating program order:', error);
                res.status(500).json({ message: 'Sıralama güncellenemedi.' });
            }
        });
    },
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            const yurtid = req.selectedYurtId;
            try {
                const program = yield Program_1.default.findOne({
                    where: { program_name: req.params.program_name, yurtid }
                });
                if (!program)
                    return res.status(404).json({ message: 'Program bulunamadı.' });
                yield program.destroy();
                res.json({ message: 'Program silindi.' });
            }
            catch (_a) {
                res.status(500).json({ message: 'Program silinemedi.' });
            }
        });
    },
};
