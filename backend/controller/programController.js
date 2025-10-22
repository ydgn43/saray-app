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
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const programs = yield Program_1.default.findAll();
                res.json(programs);
            }
            catch (_a) {
                res.status(500).json({ message: 'Programlar alınamadı.' });
            }
        });
    },
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            const { program_name } = req.body;
            if (!program_name)
                return res.status(400).json({ message: 'Program adı eksik.' });
            try {
                const exists = yield Program_1.default.findByPk(program_name);
                if (exists)
                    return res.status(409).json({ message: 'Program zaten mevcut.' });
                yield Program_1.default.create({ program_name });
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
            const { program_name: newName } = req.body;
            if (!newName)
                return res.status(400).json({ message: 'Yeni program adı eksik.' });
            try {
                const program = yield Program_1.default.findByPk(oldName);
                if (!program)
                    return res.status(404).json({ message: 'Program bulunamadı.' });
                // If name is changing, check if new name already exists
                if (oldName !== newName) {
                    const exists = yield Program_1.default.findByPk(newName);
                    if (exists)
                        return res.status(409).json({ message: 'Bu program adı zaten mevcut.' });
                    // Since program_name is the primary key, we need to delete old and create new
                    yield program.destroy();
                    yield Program_1.default.create({ program_name: newName });
                }
                res.json({ message: 'Program güncellendi.' });
            }
            catch (_a) {
                res.status(500).json({ message: 'Program güncellenemedi.' });
            }
        });
    },
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            try {
                const program = yield Program_1.default.findByPk(req.params.program_name);
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
