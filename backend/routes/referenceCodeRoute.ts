import express from 'express';
import {
    createReferenceCode,
    getAllReferenceCodes,
    validateReferenceCode,
    deactivateReferenceCode,
} from '../controller/referenceCodeController';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Debug logging
console.log('createReferenceCode:', typeof createReferenceCode);
console.log('getAllReferenceCodes:', typeof getAllReferenceCodes);
console.log('validateReferenceCode:', typeof validateReferenceCode);
console.log('deactivateReferenceCode:', typeof deactivateReferenceCode);
console.log('authenticateJWT:', typeof authenticateJWT);
console.log('requireAdmin:', typeof requireAdmin);

// Admin routes - require authentication and admin role
router.post('/', authenticateJWT, requireAdmin, createReferenceCode);
router.get('/', authenticateJWT, requireAdmin, getAllReferenceCodes);
router.delete('/:id', authenticateJWT, requireAdmin, deactivateReferenceCode);

// Public route - validate code during signup
router.get('/validate/:code', validateReferenceCode);

export default router;
