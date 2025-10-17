"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seasonRouter = void 0;
// backend/routes/seasonRoute.ts
const express_1 = __importDefault(require("express"));
const seasonController_1 = require("../controller/seasonController");
const authMiddleware_1 = require("../middleware/authMiddleware");
exports.seasonRouter = express_1.default.Router();
exports.seasonRouter.use(authMiddleware_1.authenticateJWT);
exports.seasonRouter.get('/', seasonController_1.seasonController.getAll); // Allow all authenticated users
exports.seasonRouter.post('/create', (0, authMiddleware_1.requireRoles)(['admin']), seasonController_1.seasonController.create);
exports.seasonRouter.delete('/delete/:season_year', (0, authMiddleware_1.requireRoles)(['admin']), seasonController_1.seasonController.delete);
