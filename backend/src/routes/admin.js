const express = require('express');
const { body } = require('express-validator');
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  createTeamMember,
  getTeamMembers,
  updateTeamMember,
  deleteTeamMember,
  resetMemberPassword,
} = require('../controllers/adminController');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const createTeamValidation = [
  body('teamId').isLength({ min: 1 }).withMessage('Team ID is required'),
  body('teamName').isLength({ min: 1 }).withMessage('Team name is required'),
];

const createMemberValidation = [
  body('teamId').isLength({ min: 1 }).withMessage('Team ID is required'),
  body('name').isLength({ min: 1 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['LEADER', 'MEMBER']).withMessage('Valid role is required'),
];

// Apply authentication and super admin role to all routes
router.use(authenticate);
router.use(requireSuperAdmin);

// Team routes
router.post('/teams', createTeamValidation, validate, createTeam);
router.get('/teams', getTeams);
router.get('/teams/:id', getTeamById);
router.put('/teams/:id', updateTeam);
router.delete('/teams/:id', deleteTeam);

// Team member routes
router.post('/teams/:teamId/members', createMemberValidation, validate, createTeamMember);
router.get('/members', getTeamMembers);
router.put('/members/:id', updateTeamMember);
router.delete('/members/:id', deleteTeamMember);
router.post('/members/:id/reset-password', resetMemberPassword);

module.exports = router;
