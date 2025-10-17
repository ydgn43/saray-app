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
exports.seasonController = void 0;
const Season_1 = __importDefault(require("../data/models/Season"));
exports.seasonController = {
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const seasons = yield Season_1.default.findAll();
                res.json(seasons);
            }
            catch (_a) {
                res.status(500).json({ message: 'Sezonlar alınamadı.' });
            }
        });
    },
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            const { season_year } = req.body;
            if (!season_year)
                return res.status(400).json({ message: 'Sezon bilgisi eksik.' });
            try {
                const exists = yield Season_1.default.findByPk(season_year);
                if (exists)
                    return res.status(409).json({ message: 'Sezon zaten mevcut.' });
                yield Season_1.default.create({ season_year });
                res.status(201).json({ message: 'Sezon oluşturuldu.' });
            }
            catch (_a) {
                res.status(500).json({ message: 'Sezon oluşturulamadı.' });
            }
        });
    },
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            try {
                const season = yield Season_1.default.findByPk(req.params.season_year);
                if (!season)
                    return res.status(404).json({ message: 'Sezon bulunamadı.' });
                yield season.destroy();
                res.json({ message: 'Sezon silindi.' });
            }
            catch (_a) {
                res.status(500).json({ message: 'Sezon silinemedi.' });
            }
        });
    },
};
