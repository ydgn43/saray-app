import express from 'express';
import {
    createReferenceCode,
    getAllReferenceCodes,
    validateReferenceCode,
    deactivateReferenceCode,
} from '../controller/referenceCodeController';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware';
import { validateYurtAccess } from '../middleware/validateYurtAccess';

const router = express.Router();

// Debug logging
console.log('createReferenceCode:', typeof createReferenceCode);
console.log('getAllReferenceCodes:', typeof getAllReferenceCodes);
console.log('validateReferenceCode:', typeof validateReferenceCode);
console.log('deactivateReferenceCode:', typeof deactivateReferenceCode);
console.log('authenticateJWT:', typeof authenticateJWT);
console.log('requireAdmin:', typeof requireAdmin);

// Admin routes - require authentication and admin role
router.post('/', authenticateJWT, requireAdmin, validateYurtAccess, createReferenceCode);
router.get('/', authenticateJWT, requireAdmin, validateYurtAccess, getAllReferenceCodes);
router.delete('/:id', authenticateJWT, requireAdmin, validateYurtAccess, deactivateReferenceCode);

// Public route - validate code during signup
router.get('/validate/:code', validateReferenceCode);

export default router;
