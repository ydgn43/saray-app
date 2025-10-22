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
exports.classController = void 0;
const Class_1 = __importDefault(require("../data/models/Class"));
exports.classController = {
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const yurtid = req.selectedYurtId;
                const classes = yield Class_1.default.findAll({
                    where: { yurtid }
                });
                res.json(classes);
            }
            catch (_a) {
                res.status(500).json({ message: 'Dahili Seviyelar alınamadı.' });
            }
        });
    },
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            const { class_name } = req.body;
            const yurtid = req.selectedYurtId;
            if (!class_name)
                return res.status(400).json({ message: 'Dahili Seviye adı eksik.' });
            try {
                const exists = yield Class_1.default.findOne({
                    where: { class_name, yurtid }
                });
                if (exists)
                    return res.status(409).json({ message: 'Dahili Seviye zaten mevcut.' });
                yield Class_1.default.create({ class_name, yurtid });
                res.status(201).json({ message: 'Dahili Seviye oluşturuldu.' });
            }
            catch (_a) {
                res.status(500).json({ message: 'Dahili Seviye oluşturulamadı.' });
            }
        });
    },
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            const yurtid = req.selectedYurtId;
            try {
                const cls = yield Class_1.default.findOne({
                    where: { class_name: req.params.class_name, yurtid }
                });
                if (!cls)
                    return res.status(404).json({ message: 'Dahili Seviye bulunamadı.' });
                yield cls.destroy();
                res.json({ message: 'Dahili Seviye silindi.' });
            }
            catch (_a) {
                res.status(500).json({ message: 'Dahili Seviye silinemedi.' });
            }
        });
    },
};
