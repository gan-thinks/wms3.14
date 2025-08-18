const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth'); // ✅ destructure to get the function
const jwt = require('jsonwebtoken');

// Get all employees (for assigning members in tasks)
router.get('/', auth, async (req, res) => {
  try {
    const employees = await Employee.find({}, '_id name email');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register new employee
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, position, dateOfJoining } = req.body;

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee already exists' });
    }

    const newEmployee = new Employee({
      name,
      email,
      password,
      role,
      department,
      position,
      dateOfJoining
    });

    await newEmployee.save();
    res.status(201).json({ message: 'Employee registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login employee
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
