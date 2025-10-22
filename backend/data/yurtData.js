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
const Yurt_1 = __importDefault(require("./models/Yurt"));
class YurtData {
    createYurt(yurt_name, description, location) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Yurt_1.default.create({
                yurt_name,
                description,
                location,
                is_active: true,
                created_at: new Date()
            });
        });
    }
    getAllYurts() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Yurt_1.default.findAll({
                order: [['created_at', 'DESC']]
            });
        });
    }
    getActiveYurts() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Yurt_1.default.findAll({
                where: { is_active: true },
                order: [['yurt_name', 'ASC']]
            });
        });
    }
    getYurtById(yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Yurt_1.default.findByPk(yurtid);
        });
    }
    getYurtByName(yurt_name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Yurt_1.default.findOne({
                where: { yurt_name }
            });
        });
    }
    updateYurt(yurtid, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const yurt = yield Yurt_1.default.findByPk(yurtid);
            if (!yurt) {
                throw new Error('Yurt not found');
            }
            return yield yurt.update(updates);
        });
    }
    deleteYurt(yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            const yurt = yield Yurt_1.default.findByPk(yurtid);
            if (!yurt) {
                throw new Error('Yurt not found');
            }
            // Soft delete - mark as inactive instead of deleting
            // This preserves data integrity
            return yield yurt.update({ is_active: false });
        });
    }
    hardDeleteYurt(yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            // Only use this if you're absolutely sure
            // This will fail if there are foreign key references
            const yurt = yield Yurt_1.default.findByPk(yurtid);
            if (!yurt) {
                throw new Error('Yurt not found');
            }
            return yield yurt.destroy();
        });
    }
    getYurtStats(yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            // This will be useful for dashboard
            // TODO: Add counts for students, users, etc.
            const yurt = yield Yurt_1.default.findByPk(yurtid);
            return {
                yurt,
                // We'll add more stats here later when we update other data layers
            };
        });
    }
}
exports.default = new YurtData();
