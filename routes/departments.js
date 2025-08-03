const express = require('express');
const { body, validationResult } = require('express-validator');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('head', 'firstName lastName employeeId')
      .populate('parentDepartment', 'name code')
      .sort({ name: 1 });

    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/departments/:id
// @desc    Get department by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('head', 'firstName lastName employeeId email')
      .populate('parentDepartment', 'name code');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Get employees in this department
    const employees = await Employee.find({ 
      department: req.params.id, 
      isActive: true 
    })
    .select('firstName lastName employeeId position status')
    .sort({ firstName: 1 });

    res.json({
      department,
      employees
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/departments
// @desc    Create new department
// @access  Private (HR/Admin only)
router.post('/', [
  auth,
  authorize('HR', 'Admin'),
  body('name').notEmpty().withMessage('Department name is required'),
  body('code').notEmpty().withMessage('Department code is required'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, code, description, head, budget, location,
      contactInfo, parentDepartment, color
    } = req.body;

    // Check if department already exists
    const existingDepartment = await Department.findOne({
      $or: [{ name }, { code }]
    });

    if (existingDepartment) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const department = new Department({
      name,
      code,
      description,
      head,
      budget,
      location,
      contactInfo,
      parentDepartment,
      color
    });

    await department.save();

    res.status(201).json({
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update department
// @access  Private (HR/Admin only)
router.put('/:id', [
  auth,
  authorize('HR', 'Admin'),
  body('name').notEmpty().withMessage('Department name is required'),
  body('code').notEmpty().withMessage('Department code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const {
      name, code, description, head, budget, location,
      contactInfo, parentDepartment, color
    } = req.body;

    // Check if name or code is already taken by another department
    const existingDepartment = await Department.findOne({
      $or: [{ name }, { code }],
      _id: { $ne: req.params.id }
    });

    if (existingDepartment) {
      return res.status(400).json({ message: 'Department name or code already exists' });
    }

    Object.assign(department, {
      name, code, description, head, budget, location,
      contactInfo, parentDepartment, color
    });

    await department.save();

    res.json({
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Deactivate department
// @access  Private (HR/Admin only)
router.delete('/:id', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if department has employees
    const employeeCount = await Employee.countDocuments({
      department: req.params.id,
      isActive: true
    });

    if (employeeCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete department with ${employeeCount} active employees` 
      });
    }

    department.isActive = false;
    await department.save();

    res.json({ message: 'Department deactivated successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/departments/:id/employees
// @desc    Get employees in department
// @access  Private
router.get('/:id/employees', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const employees = await Employee.find({
      department: req.params.id,
      isActive: true
    })
    .select('firstName lastName employeeId position status email phone')
    .populate('manager', 'firstName lastName employeeId')
    .sort({ firstName: 1 })
    .skip(skip)
    .limit(limit);

    const total = await Employee.countDocuments({
      department: req.params.id,
      isActive: true
    });

    res.json({
      employees,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get department employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/departments/stats/overview
// @desc    Get department statistics
// @access  Private (HR/Admin only)
router.get('/stats/overview', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const totalDepartments = await Department.countDocuments({ isActive: true });
    const totalEmployees = await Employee.countDocuments({ isActive: true });

    // Department employee distribution
    const departmentStats = await Department.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: 'department',
          as: 'employees'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          employeeCount: { $size: '$employees' },
          budget: 1
        }
      },
      { $sort: { employeeCount: -1 } }
    ]);

    // Department hierarchy
    const hierarchy = await Department.find({ isActive: true })
      .populate('parentDepartment', 'name code')
      .sort({ name: 1 });

    res.json({
      totalDepartments,
      totalEmployees,
      departmentStats,
      hierarchy
    });
  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 