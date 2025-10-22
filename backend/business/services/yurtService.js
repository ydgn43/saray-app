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
const yurtData_1 = __importDefault(require("../../data/yurtData"));
class YurtService {
    createYurt(yurt_name, description, location) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate yurt name is unique
            const existing = yield yurtData_1.default.getYurtByName(yurt_name);
            if (existing) {
                throw new Error('Yurt with this name already exists');
            }
            return yield yurtData_1.default.createYurt(yurt_name, description, location);
        });
    }
    getAllYurts() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield yurtData_1.default.getAllYurts();
        });
    }
    getActiveYurts() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield yurtData_1.default.getActiveYurts();
        });
    }
    getYurtById(yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield yurtData_1.default.getYurtById(yurtid);
        });
    }
    updateYurt(yurtid, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            // If updating name, check uniqueness
            if (updates.yurt_name) {
                const existing = yield yurtData_1.default.getYurtByName(updates.yurt_name);
                if (existing && existing.yurtid !== yurtid) {
                    throw new Error('Yurt with this name already exists');
                }
            }
            return yield yurtData_1.default.updateYurt(yurtid, updates);
        });
    }
    deleteYurt(yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prevent deletion of default yurt
            if (yurtid === 1) {
                throw new Error('Cannot delete the default yurt');
            }
            return yield yurtData_1.default.deleteYurt(yurtid);
        });
    }
    getYurtStats(yurtid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield yurtData_1.default.getYurtStats(yurtid);
        });
    }
}
exports.default = new YurtService();
