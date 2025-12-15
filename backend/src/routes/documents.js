const express = require('express');
const { body } = require('express-validator');
const {
  uploadDocument,
  getMyDocuments,
  getTeamProgress,
  getAllDocuments,
  approveDocument,
  rejectDocument,
  getDocumentStats,
} = require('../controllers/documentController');
const { authenticate, requireTeamMember, requireDocumentAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const uploadValidation = [
  body('docType').isLength({ min: 1 }).withMessage('Document type is required'),
];

const approveValidation = [
  body('comment').optional().isString(),
];

const rejectValidation = [
  body('comment').isLength({ min: 1 }).withMessage('Comment is required for rejection'),
];

// Team member routes
router.post('/upload', 
  authenticate, 
  requireTeamMember, 
  upload.single('document'), 
  handleUploadError,
  uploadValidation, 
  validate, 
  uploadDocument
);

router.get('/my-documents', authenticate, requireTeamMember, getMyDocuments);
router.get('/team-progress', authenticate, requireTeamMember, getTeamProgress);

// Admin routes
router.get('/', authenticate, requireDocumentAdmin, getAllDocuments);
router.get('/stats', authenticate, requireDocumentAdmin, getDocumentStats);
router.put('/:id/approve', authenticate, requireDocumentAdmin, approveValidation, validate, approveDocument);
router.put('/:id/reject', authenticate, requireDocumentAdmin, rejectValidation, validate, rejectDocument);

module.exports = router;
