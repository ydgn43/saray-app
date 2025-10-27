"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const referenceCodeController_1 = require("../controller/referenceCodeController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validateYurtAccess_1 = require("../middleware/validateYurtAccess");
const router = express_1.default.Router();
// Debug logging
console.log('createReferenceCode:', typeof referenceCodeController_1.createReferenceCode);
console.log('getAllReferenceCodes:', typeof referenceCodeController_1.getAllReferenceCodes);
console.log('validateReferenceCode:', typeof referenceCodeController_1.validateReferenceCode);
console.log('deactivateReferenceCode:', typeof referenceCodeController_1.deactivateReferenceCode);
console.log('authenticateJWT:', typeof authMiddleware_1.authenticateJWT);
console.log('requireAdmin:', typeof authMiddleware_1.requireAdmin);
// Admin routes - require authentication and admin role
router.post('/', authMiddleware_1.authenticateJWT, authMiddleware_1.requireAdmin, validateYurtAccess_1.validateYurtAccess, referenceCodeController_1.createReferenceCode);
router.get('/', authMiddleware_1.authenticateJWT, authMiddleware_1.requireAdmin, validateYurtAccess_1.validateYurtAccess, referenceCodeController_1.getAllReferenceCodes);
router.delete('/:id', authMiddleware_1.authenticateJWT, authMiddleware_1.requireAdmin, validateYurtAccess_1.validateYurtAccess, referenceCodeController_1.deactivateReferenceCode);
// Public route - validate code during signup
router.get('/validate/:code', referenceCodeController_1.validateReferenceCode);
exports.default = router;
