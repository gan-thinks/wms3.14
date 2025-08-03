const express = require('express');
const { body, validationResult } = require('express-validator');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payroll/generate
// @desc    Generate payroll for all employees
// @access  Private (HR/Admin only)
router.post('/generate', [
  auth,
  authorize('HR', 'Admin'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1-12'),
  body('year').isInt({ min: 2020 }).withMessage('Year must be 2020 or later')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { month, year } = req.body;

    // Check if payroll already exists for this month
    const existingPayroll = await Payroll.findOne({ month, year });
    if (existingPayroll) {
      return res.status(400).json({ message: 'Payroll already generated for this month' });
    }

    // Get all active employees
    const employees = await Employee.find({ isActive: true, status: 'Active' });

    const payrolls = [];

    for (const employee of employees) {
      // Calculate working days for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const attendance = await Attendance.find({
        employee: employee._id,
        date: { $gte: startDate, $lte: endDate },
        'checkIn.time': { $exists: true }
      });

      const workingDays = attendance.length;
      const absentDays = endDate.getDate() - workingDays;
      
      // Calculate overtime
      const totalOvertime = attendance.reduce((sum, record) => sum + (record.overtime || 0), 0);
      
      // Calculate overtime pay
      const overtimeRate = employee.salary / 160; // Assuming 160 hours per month
      const overtimePay = totalOvertime * overtimeRate;

      const payroll = new Payroll({
        employee: employee._id,
        month,
        year,
        basicSalary: employee.salary,
        allowances: {
          housing: employee.salary * 0.1, // 10% housing allowance
          transport: 500, // Fixed transport allowance
          meal: 300, // Fixed meal allowance
          medical: employee.salary * 0.05 // 5% medical allowance
        },
        deductions: {
          tax: employee.salary * 0.15, // 15% tax
          insurance: employee.salary * 0.05, // 5% insurance
          pension: employee.salary * 0.08 // 8% pension
        },
        overtime: {
          hours: totalOvertime,
          rate: overtimeRate,
          amount: overtimePay
        },
        workingDays,
        absentDays,
        status: 'Generated'
      });

      payrolls.push(payroll);
    }

    await Payroll.insertMany(payrolls);

    res.json({
      message: `Payroll generated successfully for ${payrolls.length} employees`,
      count: payrolls.length
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payroll/employee/:id
// @desc    Get employee payroll history
// @access  Private
router.get('/employee/:id', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const payrolls = await Payroll.find({ employee: req.params.id })
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payroll.countDocuments({ employee: req.params.id });

    res.json({
      payrolls,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get employee payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payroll/period/:month/:year
// @desc    Get payroll for specific period (HR/Admin only)
// @access  Private
router.get('/period/:month/:year', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const { month, year } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const payrolls = await Payroll.find({ month: parseInt(month), year: parseInt(year) })
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName')
      .sort({ 'employee.firstName': 1 })
      .skip(skip)
      .limit(limit);

    const total = await Payroll.countDocuments({ month: parseInt(month), year: parseInt(year) });

    // Calculate totals
    const totals = payrolls.reduce((acc, payroll) => {
      acc.totalEarnings += payroll.totalEarnings;
      acc.totalDeductions += payroll.totalDeductions;
      acc.netSalary += payroll.netSalary;
      return acc;
    }, { totalEarnings: 0, totalDeductions: 0, netSalary: 0 });

    res.json({
      payrolls,
      totals,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get period payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/payroll/:id/approve
// @desc    Approve payroll (HR/Admin only)
// @access  Private
router.put('/:id/approve', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    payroll.status = 'Approved';
    payroll.approvedBy = req.employee._id;
    payroll.approvedAt = new Date();

    await payroll.save();

    res.json({
      message: 'Payroll approved successfully',
      payroll
    });
  } catch (error) {
    console.error('Approve payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/payroll/:id/pay
// @desc    Mark payroll as paid (HR/Admin only)
// @access  Private
router.put('/:id/pay', [
  auth,
  authorize('HR', 'Admin'),
  body('paymentMethod').isIn(['Bank Transfer', 'Check', 'Cash', 'Digital Wallet']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentMethod } = req.body;
    const payroll = await Payroll.findById(req.params.id);
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    if (payroll.status !== 'Approved') {
      return res.status(400).json({ message: 'Payroll must be approved before marking as paid' });
    }

    payroll.status = 'Paid';
    payroll.paymentMethod = paymentMethod;
    payroll.paymentDate = new Date();

    await payroll.save();

    res.json({
      message: 'Payroll marked as paid successfully',
      payroll
    });
  } catch (error) {
    console.error('Mark payroll paid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payroll/stats/overview
// @desc    Get payroll statistics (HR/Admin only)
// @access  Private
router.get('/stats/overview', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Monthly payroll totals
    const monthlyTotals = await Payroll.aggregate([
      { $match: { year: currentYear } },
      {
        $group: {
          _id: '$month',
          totalEarnings: { $sum: '$totalEarnings' },
          totalDeductions: { $sum: '$totalDeductions' },
          netSalary: { $sum: '$netSalary' },
          employeeCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Department-wise salary distribution
    const departmentStats = await Payroll.aggregate([
      { $match: { year: currentYear, month: new Date().getMonth() + 1 } },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $lookup: {
          from: 'departments',
          localField: 'employee.department',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: '$department' },
      {
        $group: {
          _id: '$department.name',
          totalSalary: { $sum: '$netSalary' },
          avgSalary: { $avg: '$netSalary' },
          employeeCount: { $sum: 1 }
        }
      },
      { $sort: { totalSalary: -1 } }
    ]);

    // Yearly summary
    const yearlySummary = await Payroll.aggregate([
      { $match: { year: currentYear } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$totalEarnings' },
          totalDeductions: { $sum: '$totalDeductions' },
          totalNetSalary: { $sum: '$netSalary' },
          totalOvertime: { $sum: '$overtime.amount' }
        }
      }
    ]);

    res.json({
      currentYear,
      monthlyTotals,
      departmentStats,
      yearlySummary: yearlySummary[0] || {}
    });
  } catch (error) {
    console.error('Get payroll stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 