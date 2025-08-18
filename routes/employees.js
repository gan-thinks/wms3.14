const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth');

// List all employees (open to all authenticated users)
router.get('/list/all', auth, async (req, res) => {
  try {
    const employees = await Employee.find({}, '-password');
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
});

module.exports = router;
