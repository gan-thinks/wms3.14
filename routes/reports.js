const express = require('express');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Department = require('../models/Department');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/dashboard
// @desc    Get dashboard overview
// @access  Private (HR/Admin only)
router.get('/dashboard', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Employee statistics
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const activeEmployees = await Employee.countDocuments({ 
      isActive: true, 
      status: 'Active' 
    });
    const newHiresThisMonth = await Employee.countDocuments({
      isActive: true,
      hireDate: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });

    // Attendance statistics
    const presentToday = await Attendance.countDocuments({
      date: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      },
      'checkIn.time': { $exists: true }
    });

    const absentToday = activeEmployees - presentToday;

    // Leave statistics
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });
    const approvedLeavesThisMonth = await Leave.countDocuments({
      status: 'Approved',
      startDate: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });

    // Payroll statistics
    const currentMonthPayroll = await Payroll.findOne({
      month: currentMonth + 1,
      year: currentYear
    });

    const totalSalaryThisMonth = currentMonthPayroll ? 
      await Payroll.aggregate([
        { $match: { month: currentMonth + 1, year: currentYear } },
        { $group: { _id: null, total: { $sum: '$netSalary' } } }
      ]) : [{ total: 0 }];

    // Department distribution
    const departmentStats = await Employee.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: '$department' },
      { $project: { name: '$department.name', count: 1 } }
    ]);

    res.json({
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        newHires: newHiresThisMonth
      },
      attendance: {
        present: presentToday,
        absent: absentToday,
        rate: activeEmployees > 0 ? ((presentToday / activeEmployees) * 100).toFixed(1) : 0
      },
      leaves: {
        pending: pendingLeaves,
        approvedThisMonth: approvedLeavesThisMonth
      },
      payroll: {
        totalSalary: totalSalaryThisMonth[0]?.total || 0,
        generated: !!currentMonthPayroll
      },
      departments: departmentStats
    });
  } catch (error) {
    console.error('Dashboard report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/attendance/:type
// @desc    Get attendance reports
// @access  Private (HR/Admin only)
router.get('/attendance/:type', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, department } = req.query;

    let matchQuery = {};
    let groupBy = {};

    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (department) {
      matchQuery['employee.department'] = department;
    }

    switch (type) {
      case 'daily':
        groupBy = {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
          total: { $sum: 1 }
        };
        break;

      case 'monthly':
        groupBy = {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
          total: { $sum: 1 }
        };
        break;

      case 'employee':
        groupBy = {
          _id: '$employee',
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
          total: { $sum: 1 },
          avgWorkHours: { $avg: '$totalWorkHours' },
          totalOvertime: { $sum: '$overtime' }
        };
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    const report = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      { $group: groupBy },
      { $sort: { _id: 1 } }
    ]);

    res.json(report);
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/leaves/:type
// @desc    Get leave reports
// @access  Private (HR/Admin only)
router.get('/leaves/:type', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, leaveType } = req.query;

    let matchQuery = {};
    let groupBy = {};

    if (startDate && endDate) {
      matchQuery.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (leaveType) {
      matchQuery.leaveType = leaveType;
    }

    switch (type) {
      case 'monthly':
        groupBy = {
          _id: { $dateToString: { format: '%Y-%m', date: '$startDate' } },
          totalRequests: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          totalDays: { $sum: '$duration' }
        };
        break;

      case 'employee':
        groupBy = {
          _id: '$employee',
          totalRequests: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          totalDays: { $sum: '$duration' }
        };
        break;

      case 'type':
        groupBy = {
          _id: '$leaveType',
          totalRequests: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          totalDays: { $sum: '$duration' }
        };
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    const report = await Leave.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      { $group: groupBy },
      { $sort: { _id: 1 } }
    ]);

    res.json(report);
  } catch (error) {
    console.error('Leave report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/payroll/:type
// @desc    Get payroll reports
// @access  Private (HR/Admin only)
router.get('/payroll/:type', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const { type } = req.params;
    const { year, month, department } = req.query;

    let matchQuery = {};
    let groupBy = {};

    if (year) {
      matchQuery.year = parseInt(year);
    }

    if (month) {
      matchQuery.month = parseInt(month);
    }

    switch (type) {
      case 'monthly':
        groupBy = {
          _id: { month: '$month', year: '$year' },
          totalEarnings: { $sum: '$totalEarnings' },
          totalDeductions: { $sum: '$totalDeductions' },
          netSalary: { $sum: '$netSalary' },
          employeeCount: { $sum: 1 },
          avgSalary: { $avg: '$netSalary' }
        };
        break;

      case 'department':
        groupBy = {
          _id: '$employee.department',
          totalEarnings: { $sum: '$totalEarnings' },
          totalDeductions: { $sum: '$totalDeductions' },
          netSalary: { $sum: '$netSalary' },
          employeeCount: { $sum: 1 },
          avgSalary: { $avg: '$netSalary' }
        };
        break;

      case 'employee':
        groupBy = {
          _id: '$employee',
          totalEarnings: { $sum: '$totalEarnings' },
          totalDeductions: { $sum: '$totalDeductions' },
          netSalary: { $sum: '$netSalary' },
          avgSalary: { $avg: '$netSalary' },
          months: { $sum: 1 }
        };
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    const report = await Payroll.aggregate([
      { $match: matchQuery },
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
      { $group: groupBy },
      { $sort: { netSalary: -1 } }
    ]);

    res.json(report);
  } catch (error) {
    console.error('Payroll report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/employees/:type
// @desc    Get employee reports
// @access  Private (HR/Admin only)
router.get('/employees/:type', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const { type } = req.params;
    const { department, status, employmentType } = req.query;

    let matchQuery = { isActive: true };
    let groupBy = {};

    if (department) {
      matchQuery.department = department;
    }

    if (status) {
      matchQuery.status = status;
    }

    if (employmentType) {
      matchQuery.employmentType = employmentType;
    }

    switch (type) {
      case 'department':
        groupBy = {
          _id: '$department',
          count: { $sum: 1 },
          avgSalary: { $avg: '$salary' },
          totalSalary: { $sum: '$salary' }
        };
        break;

      case 'status':
        groupBy = {
          _id: '$status',
          count: { $sum: 1 }
        };
        break;

      case 'employment':
        groupBy = {
          _id: '$employmentType',
          count: { $sum: 1 },
          avgSalary: { $avg: '$salary' }
        };
        break;

      case 'hiring':
        groupBy = {
          _id: { $dateToString: { format: '%Y-%m', date: '$hireDate' } },
          count: { $sum: 1 }
        };
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    const report = await Employee.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: '$department' },
      { $group: groupBy },
      { $sort: { _id: 1 } }
    ]);

    res.json(report);
  } catch (error) {
    console.error('Employee report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 