/*
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

// ✅ Add this route for CreateProject component
router.get('/list/all', auth, async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true }, 
      '_id firstName lastName email role department position'
    );
    res.json(employees);
  } catch (err) {
    console.error('Get all employees error:', err);
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
      'employeeId firstName lastName email role department position status manager'
    ).populate('manager', 'firstName lastName email position');
    
    res.json(employees);
  } catch (err) {
    console.error('Get employees error:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get managers by department - NEW ROUTE FOR SIGNUP
router.get('/managers/:department', async (req, res) => {
  try {
    const { department } = req.params;
    
    const managers = await Employee.find({ 
      $or: [
        { role: 'manager', department: department },
        { role: 'manager', managedDepartments: department },
        { role: 'admin' } // Admins can be managers too
      ],
      isActive: true 
    }, 'firstName lastName email position department');
    
    res.json(managers);
  } catch (err) {
    console.error('Get managers error:', err);
    res.status(500).json({ error: 'Failed to fetch managers' });
  }
});

// Get team members for a manager
router.get('/team/:managerId', auth, async (req, res) => {
  try {
    const { managerId } = req.params;
    
    const teamMembers = await Employee.find({ 
      manager: managerId,
      isActive: true 
    }, 'firstName lastName email role department position status performanceRating')
    .populate('manager', 'firstName lastName');
    
    res.json(teamMembers);
  } catch (err) {
    console.error('Get team members error:', err);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Get department hierarchy
router.get('/department/:department/hierarchy', auth, async (req, res) => {
  try {
    const { department } = req.params;
    
    const hierarchy = await Employee.getDepartmentHierarchy(department);
    
    res.json(hierarchy);
  } catch (err) {
    console.error('Get department hierarchy error:', err);
    res.status(500).json({ error: 'Failed to fetch department hierarchy' });
  }
});

// Get all employees for project assignments
router.get('/list/all', auth, async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true }, 
      '_id firstName lastName email role department position'
    ).populate('manager', 'firstName lastName');
    
    res.json(employees);
  } catch (err) {
    console.error('Get all employees error:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get employee by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('manager', 'firstName lastName email position')
      .populate('subordinates', 'firstName lastName email position department');
      
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee.getPublicProfile());
  } catch (err) {
    console.error('Get employee error:', err);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Register new employee - UPDATED WITH HIERARCHY
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
      employmentType,
      manager,
      managedDepartments
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !department || !position) {
      return res.status(400).json({ 
        error: 'First name, last name, email, password, department, and position are required' 
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

    // Validate manager exists if provided
    let managerObj = null;
    if (manager && role === 'employee') {
      managerObj = await Employee.findById(manager);
      if (!managerObj) {
        return res.status(400).json({ error: 'Selected manager not found' });
      }
    }

    // Create new employee
    const newEmployee = new Employee({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'employee',
      phone: phone || '',
      gender: gender || undefined,
      dateOfBirth: dateOfBirth || null,
      department: department,
      position: position.trim(),
      salary: salary || null,
      employmentType: employmentType || 'Full-time',
      manager: (role === 'employee' && manager) ? manager : null,
      managedDepartments: (role === 'manager' && managedDepartments) ? managedDepartments : [],
      status: 'Active',
      isActive: true,
      hireDate: new Date(),
      dateOfJoining: new Date()
    });

    await newEmployee.save();

    // Update manager's subordinates list if employee has a manager
    if (managerObj && role === 'employee') {
      await Employee.findByIdAndUpdate(
        manager, 
        { $push: { subordinates: newEmployee._id } }
      );
    }
    
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

// Login employee - UPDATED TO RETURN DASHBOARD DATA
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find employee with manager and subordinates populated
    const employee = await Employee.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    })
    .populate('manager', 'firstName lastName email position')
    .populate('subordinates', 'firstName lastName email position department');
    
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

    // Check if user has permission to update
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.id !== employeeId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.employeeId;

    // Handle manager assignment changes
    if (updates.manager) {
      const newManager = await Employee.findById(updates.manager);
      if (!newManager) {
        return res.status(400).json({ error: 'Selected manager not found' });
      }

      // Get current employee to check old manager
      const currentEmployee = await Employee.findById(employeeId);
      
      // Remove from old manager's subordinates
      if (currentEmployee.manager && currentEmployee.manager.toString() !== updates.manager) {
        await Employee.findByIdAndUpdate(
          currentEmployee.manager,
          { $pull: { subordinates: employeeId } }
        );
      }

      // Add to new manager's subordinates
      if (currentEmployee.manager?.toString() !== updates.manager) {
        await Employee.findByIdAndUpdate(
          updates.manager,
          { $addToSet: { subordinates: employeeId } }
        );
      }
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('manager', 'firstName lastName email position');

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
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete/Deactivate employee
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only admins can delete employees
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can deactivate employees' });
    }

    const employeeId = req.params.id;
    
    // Get employee to handle cleanup
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Remove from manager's subordinates list
    if (employee.manager) {
      await Employee.findByIdAndUpdate(
        employee.manager,
        { $pull: { subordinates: employeeId } }
      );
    }

    // Reassign subordinates to a new manager or remove manager reference
    if (employee.subordinates && employee.subordinates.length > 0) {
      await Employee.updateMany(
        { manager: employeeId },
        { $unset: { manager: 1 } }
      );
    }

    // Deactivate employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { 
        isActive: false, 
        status: 'Inactive',
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Employee deactivated successfully'
    });

  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
});

// Update employee goals
router.put('/:id/goals', auth, async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { goals } = req.body;

    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.id !== employeeId) {
      return res.status(403).json({ error: 'Unauthorized to update goals' });
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { goals, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Goals updated successfully',
      goals: employee.goals
    });

  } catch (err) {
    console.error('Update goals error:', err);
    res.status(500).json({ error: 'Failed to update goals' });
  }
});

// Update employee performance rating (managers and admins only)
router.put('/:id/performance', auth, async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { performanceRating } = req.body;

    // Check permission - only managers and admins
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers and administrators can update performance ratings' });
    }

    // Validate rating
    if (performanceRating < 1 || performanceRating > 5) {
      return res.status(400).json({ error: 'Performance rating must be between 1 and 5' });
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { performanceRating, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Performance rating updated successfully',
      performanceRating: employee.performanceRating
    });

  } catch (err) {
    console.error('Update performance error:', err);
    res.status(500).json({ error: 'Failed to update performance rating' });
  }
});

// Get department statistics
router.get('/stats/department/:department', auth, async (req, res) => {
  try {
    const { department } = req.params;

    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized to view department statistics' });
    }

    const stats = await Employee.aggregate([
      { $match: { department, isActive: true } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          avgPerformance: { $avg: '$performanceRating' },
          avgSalary: { $avg: '$salary' }
        }
      }
    ]);

    const totalEmployees = await Employee.countDocuments({ department, isActive: true });

    res.json({
      success: true,
      department,
      totalEmployees,
      breakdown: stats
    });

  } catch (err) {
    console.error('Get department stats error:', err);
    res.status(500).json({ error: 'Failed to fetch department statistics' });
  }
});

// Search employees
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    const { department, role, status } = req.query;

    // Build search criteria
    const searchCriteria = {
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { employeeId: { $regex: query, $options: 'i' } },
        { position: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    };

    // Add filters
    if (department) searchCriteria.department = department;
    if (role) searchCriteria.role = role;
    if (status) searchCriteria.status = status;

    const employees = await Employee.find(
      searchCriteria,
      'employeeId firstName lastName email role department position status'
    )
    .populate('manager', 'firstName lastName')
    .limit(50);

    res.json(employees);

  } catch (err) {
    console.error('Search employees error:', err);
    res.status(500).json({ error: 'Failed to search employees' });
  }
});

// Bulk update employees (admin only)
router.put('/bulk/update', auth, async (req, res) => {
  try {
    // Only admins can perform bulk updates
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can perform bulk updates' });
    }

    const { employeeIds, updates } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ error: 'Employee IDs array is required' });
    }

    // Remove sensitive fields
    delete updates.password;
    delete updates._id;
    delete updates.employeeId;

    const result = await Employee.updateMany(
      { _id: { $in: employeeIds } },
      { ...updates, updatedAt: new Date() }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} employees successfully`,
      modifiedCount: result.modifiedCount
    });

  } catch (err) {
    console.error('Bulk update error:', err);
    res.status(500).json({ error: 'Failed to perform bulk update' });
  }
});

// Export employees data (admin only)
router.get('/export/csv', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can export employee data' });
    }

    const employees = await Employee.find({ isActive: true })
      .populate('manager', 'firstName lastName')
      .select('-password');

    // Convert to CSV format
    const csvHeader = 'Employee ID,First Name,Last Name,Email,Role,Department,Position,Status,Hire Date,Manager\n';
    const csvData = employees.map(emp => [
      emp.employeeId,
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.role,
      emp.department,
      emp.position,
      emp.status,
      emp.hireDate ? emp.hireDate.toDateString() : '',
      emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : ''
    ].join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
    res.send(csvHeader + csvData);

  } catch (err) {
    console.error('Export employees error:', err);
    res.status(500).json({ error: 'Failed to export employee data' });
  }
});

module.exports = router;