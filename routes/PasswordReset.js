const express = require('express');
const router = express.Router();
const {
  forgotPassword,
  resetPassword,
} = require('../controllers/passwordResetController');

router.post('/forgot', forgotPassword); // /api/password-reset/forgot
router.post('/reset/:token', resetPassword); // /api/password-reset/reset/:token

module.exports = router;
