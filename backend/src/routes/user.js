const express = require('express');
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getDashboardStats,
} = require('../controllers/userController');
const { authenticate, requireTeamMember } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('name').isLength({ min: 1 }).withMessage('Name is required'),
];

// Apply authentication and team member role to all routes
router.use(authenticate);
router.use(requireTeamMember);

// User routes
router.get('/me', getProfile);
router.put('/me', updateProfileValidation, validate, updateProfile);
router.get('/dashboard-stats', getDashboardStats);

// Notification routes
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);
router.put('/notifications/read-all', markAllNotificationsAsRead);

module.exports = router;
