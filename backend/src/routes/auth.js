const express = require('express');
const { body } = require('express-validator');
const { login, logout, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
  body('userType').isIn(['admin', 'team_member']).withMessage('Valid user type is required'),
];

const changePasswordValidation = [
  body('currentPassword').isLength({ min: 1 }).withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// Routes
router.post('/login', loginValidation, validate, login);
router.post('/logout', logout);
router.post('/change-password', authenticate, changePasswordValidation, validate, changePassword);

module.exports = router;
