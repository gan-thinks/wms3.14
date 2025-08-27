/*const express = require('express');
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
*/

const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Get all employees (for assigning members in tasks)
router.get('/', auth, async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true }, 
      'employeeId firstName lastName email role department position status'
    );
    res.json(employees);
  } catch (err) {
    console.error('Get employees error:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get employee by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee.getPublicProfile());
  } catch (err) {
    console.error('Get employee error:', err);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Register new employee - COMPLETE VERSION
router.post('/register', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role,
      phone,
      gender,
      dateOfBirth,
      department,
      position,
      salary,
      employmentType
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        error: 'First name, last name, email, and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee with this email already exists' });
    }

    // Create new employee
    const newEmployee = new Employee({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'employee',
      phone: phone || '',
      gender: gender || undefined, // Use undefined instead of null for optional enum
      dateOfBirth: dateOfBirth || null,
      department: department || '',
      position: position || '',
      salary: salary || null,
      employmentType: employmentType || 'Full-time',
      status: 'Active',
      isActive: true,
      hireDate: new Date(),
      dateOfJoining: new Date()
    });

    await newEmployee.save();
    
    // Return success with user data (excluding password)
    const userProfile = newEmployee.getPublicProfile();
    
    console.log('Employee registered successfully:', userProfile.email);
    res.status(201).json({ 
      success: true,
      message: 'Employee registered successfully',
      employee: userProfile
    });

  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        error: `An employee with this ${field} already exists` 
      });
    }
    
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login employee
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find employee
    const employee = await Employee.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    });
    
    if (!employee) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Update last login
    employee.lastLogin = new Date();
    await employee.save();

    // Generate token
    const token = jwt.sign(
      { 
        id: employee._id, 
        role: employee.role,
        email: employee.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Employee logged in:', employee.email);
    res.json({ 
      success: true,
      token, 
      employee: employee.getPublicProfile()
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Update employee
router.put('/:id', auth, async (req, res) => {
  try {
    const employeeId = req.params.id;
    const updates = req.body;

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee: employee.getPublicProfile()
    });

  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete/Deactivate employee
router.delete('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false, 
        status: 'Inactive',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Employee deactivated successfully'
    });

  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
});

module.exports = router;