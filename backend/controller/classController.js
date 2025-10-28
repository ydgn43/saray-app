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
                    where: { yurtid },
                    order: [['display_order', 'ASC'], ['class_name', 'ASC']]
                });
                res.json(classes);
            }
            catch (_a) {
                res.status(500).json({ message: 'Dahili Seviyelar alınamadı.' });
            }
        });
    },
    create(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            const { class_name, display_name } = req.body;
            const yurtid = req.selectedYurtId;
            if (!class_name)
                return res.status(400).json({ message: 'Dahili Seviye adı eksik.' });
            try {
                const exists = yield Class_1.default.findOne({
                    where: { class_name, yurtid }
                });
                if (exists)
                    return res.status(409).json({ message: 'Dahili Seviye zaten mevcut.' });
                // Auto-assign display_order to be the highest + 1
                const maxOrderResult = yield Class_1.default.findOne({
                    where: { yurtid },
                    order: [['display_order', 'DESC']],
                    attributes: ['display_order']
                });
                const nextOrder = ((_a = maxOrderResult === null || maxOrderResult === void 0 ? void 0 : maxOrderResult.display_order) !== null && _a !== void 0 ? _a : 0) + 1;
                yield Class_1.default.create({ class_name, display_name, display_order: nextOrder, yurtid });
                res.status(201).json({ message: 'Dahili Seviye oluşturuldu.' });
            }
            catch (_b) {
                res.status(500).json({ message: 'Dahili Seviye oluşturulamadı.' });
            }
        });
    },
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            const oldClassName = req.params.class_name;
            const { class_name: newClassName, display_name } = req.body;
            const yurtid = req.selectedYurtId;
            try {
                const cls = yield Class_1.default.findOne({
                    where: { class_name: oldClassName, yurtid }
                });
                if (!cls)
                    return res.status(404).json({ message: 'Dahili Seviye bulunamadı.' });
                // If class_name is changing, check if new name already exists
                if (newClassName && newClassName !== oldClassName) {
                    const exists = yield Class_1.default.findOne({
                        where: { class_name: newClassName, yurtid }
                    });
                    if (exists)
                        return res.status(409).json({ message: 'Yeni Dahili Seviye adı zaten mevcut.' });
                    // Since class_name is the primary key, we need to create new and delete old
                    const currentDisplayOrder = cls.display_order;
                    yield Class_1.default.create({
                        class_name: newClassName,
                        display_name: display_name !== null && display_name !== void 0 ? display_name : cls.display_name,
                        display_order: currentDisplayOrder,
                        yurtid
                    });
                    yield cls.destroy();
                }
                else {
                    // Just update display_name
                    yield cls.update({ display_name });
                }
                res.json({ message: 'Dahili Seviye güncellendi.' });
            }
            catch (_a) {
                res.status(500).json({ message: 'Dahili Seviye güncellenemedi.' });
            }
        });
    },
    updateOrder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user.role !== 'admin')
                return res.status(403).json({ message: 'Yetkiniz yok.' });
            const { classes } = req.body; // Array of { class_name, display_order }
            const yurtid = req.selectedYurtId;
            if (!Array.isArray(classes)) {
                return res.status(400).json({ message: 'Geçersiz veri formatı.' });
            }
            try {
                // Update each class's display_order
                for (const item of classes) {
                    yield Class_1.default.update({ display_order: item.display_order }, { where: { class_name: item.class_name, yurtid } });
                }
                res.json({ message: 'Dahili Seviye sıralaması güncellendi.' });
            }
            catch (_a) {
                res.status(500).json({ message: 'Dahili Seviye sıralaması güncellenemedi.' });
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
