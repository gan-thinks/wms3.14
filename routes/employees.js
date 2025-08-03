const express = require('express');
const { body, validationResult } = require('express-validator');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/employees
// @desc    Get all employees with pagination and filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    
    // Add search filters
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { employeeId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.department) {
      filter.department = req.query.department;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.role) {
      filter.role = req.query.role;
    }

    const employees = await Employee.find(filter)
      .populate('department', 'name code')
      .populate('manager', 'firstName lastName employeeId')
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Employee.countDocuments(filter);

    res.json({
      employees,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('department', 'name code')
      .populate('manager', 'firstName lastName employeeId')
      .select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/employees
// @desc    Create new employee
// @access  Private (HR/Admin only)
router.post('/', [
  auth,
  authorize('HR', 'Admin'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('salary').isNumeric().withMessage('Salary must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName, lastName, email, employeeId, phone,
      department, position, salary, dateOfBirth,
      gender, address, employmentType, manager,
      emergencyContact, skills, education, workExperience
    } = req.body;

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ 
      $or: [{ email }, { employeeId }] 
    });
    
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee already exists' });
    }

    // Generate default password
    const defaultPassword = 'password123';

    const employee = new Employee({
      firstName,
      lastName,
      email,
      password: defaultPassword,
      employeeId,
      phone,
      department,
      position,
      salary,
      dateOfBirth,
      gender,
      address,
      employmentType,
      manager,
      emergencyContact,
      skills,
      education,
      workExperience
    });

    await employee.save();

    // Update department employee count
    await Department.findByIdAndUpdate(department, {
      $inc: { employeeCount: 1 }
    });

    res.status(201).json({
      message: 'Employee created successfully',
      employee: employee.getPublicProfile()
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private (HR/Admin only)
router.put('/:id', [
  auth,
  authorize('HR', 'Admin'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('salary').isNumeric().withMessage('Salary must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const oldDepartment = employee.department;
    const {
      firstName, lastName, email, phone, department,
      position, salary, dateOfBirth, gender, address,
      employmentType, manager, emergencyContact,
      skills, education, workExperience, status
    } = req.body;

    // Check if email is already taken by another employee
    const existingEmployee = await Employee.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingEmployee) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Update employee
    Object.assign(employee, {
      firstName, lastName, email, phone, department,
      position, salary, dateOfBirth, gender, address,
      employmentType, manager, emergencyContact,
      skills, education, workExperience, status
    });

    await employee.save();

    // Update department employee counts
    if (oldDepartment.toString() !== department) {
      await Department.findByIdAndUpdate(oldDepartment, {
        $inc: { employeeCount: -1 }
      });
      await Department.findByIdAndUpdate(department, {
        $inc: { employeeCount: 1 }
      });
    }

    res.json({
      message: 'Employee updated successfully',
      employee: employee.getPublicProfile()
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Deactivate employee
// @access  Private (HR/Admin only)
router.delete('/:id', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Soft delete - set isActive to false
    employee.isActive = false;
    employee.status = 'Terminated';
    await employee.save();

    // Update department employee count
    await Department.findByIdAndUpdate(employee.department, {
      $inc: { employeeCount: -1 }
    });

    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/employees/:id/activate
// @desc    Activate employee
// @access  Private (HR/Admin only)
router.put('/:id/activate', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.isActive = true;
    employee.status = 'Active';
    await employee.save();

    // Update department employee count
    await Department.findByIdAndUpdate(employee.department, {
      $inc: { employeeCount: 1 }
    });

    res.json({ message: 'Employee activated successfully' });
  } catch (error) {
    console.error('Activate employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/employees/:id/profile-picture
// @desc    Update employee profile picture
// @access  Private
router.put('/:id/profile-picture', auth, async (req, res) => {
  try {
    const { profilePicture } = req.body;
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if user can update this profile
    if (req.employee.role !== 'Admin' && req.employee.role !== 'HR' && 
        req.employee._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    employee.profilePicture = profilePicture;
    await employee.save();

    res.json({ message: 'Profile picture updated successfully' });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/employees/stats/overview
// @desc    Get employee statistics
// @access  Private (HR/Admin only)
router.get('/stats/overview', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const activeEmployees = await Employee.countDocuments({ 
      isActive: true, 
      status: 'Active' 
    });
    const onLeaveEmployees = await Employee.countDocuments({ 
      isActive: true, 
      status: 'On Leave' 
    });
    const terminatedEmployees = await Employee.countDocuments({ 
      status: 'Terminated' 
    });

    // Department distribution
    const departmentStats = await Employee.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
      { $unwind: '$department' },
      { $project: { name: '$department.name', count: 1 } }
    ]);

    // Role distribution
    const roleStats = await Employee.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      terminatedEmployees,
      departmentStats,
      roleStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 