const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Employee = require('../models/Employee');

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Setup transporter for Gmail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Step 1: Request reset link
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = generateToken();
    const expiration = Date.now() + 3600000; // 1 hour

    employee.resetPasswordToken = token;
    employee.resetPasswordExpires = expiration;
    await employee.save();

    const resetURL = `http://localhost:3000/reset-password/${token}`;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: employee.email,
      subject: 'Password Reset - Workforce Management System',
      html: `
        <p>Hello ${employee.firstName},</p>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Reset link sent to email' });
  } catch (err) {
    console.error('Error in forgotPassword:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Step 2: Reset the password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const employee = await Employee.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!employee) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    employee.password = password; // Will be hashed by the pre-save hook
    employee.resetPasswordToken = undefined;
    employee.resetPasswordExpires = undefined;

    await employee.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Error in resetPassword:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
