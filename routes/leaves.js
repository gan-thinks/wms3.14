const express = require('express');
const { body, validationResult } = require('express-validator');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/leaves
// @desc    Request leave
// @access  Private
router.post('/', [
  auth,
  body('leaveType').isIn(['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity', 'Bereavement', 'Unpaid', 'Other']).withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('Start date is required'),
  body('endDate').isISO8601().withMessage('End date is required'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      leaveType, startDate, endDate, reason, isHalfDay,
      halfDayType, emergencyContact, notes
    } = req.body;

    // Check for date overlap
    const leave = new Leave({
      employee: req.employee._id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      isHalfDay,
      halfDayType,
      emergencyContact,
      notes
    });

    const hasOverlap = await leave.hasOverlap();
    if (hasOverlap) {
      return res.status(400).json({ message: 'Leave dates overlap with existing leave request' });
    }

    await leave.save();

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leave
    });
  } catch (error) {
    console.error('Request leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaves/my-leaves
// @desc    Get current employee's leaves
// @access  Private
router.get('/my-leaves', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { employee: req.employee._id };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.leaveType) {
      filter.leaveType = req.query.leaveType;
    }

    const leaves = await Leave.find(filter)
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Leave.countDocuments(filter);

    res.json({
      leaves,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaves/pending
// @desc    Get pending leave requests (HR/Manager only)
// @access  Private
router.get('/pending', [auth, authorize('HR', 'Admin', 'Manager')], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const leaves = await Leave.find({ status: 'Pending' })
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Leave.countDocuments({ status: 'Pending' });

    res.json({
      leaves,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/leaves/:id/approve
// @desc    Approve/reject leave request (HR/Manager only)
// @access  Private
router.put('/:id/approve', [
  auth,
  authorize('HR', 'Admin', 'Manager'),
  body('status').isIn(['Approved', 'Rejected']).withMessage('Status must be Approved or Rejected'),
  body('rejectionReason').optional().notEmpty().withMessage('Rejection reason is required when rejecting')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, rejectionReason } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Leave request is not pending' });
    }

    leave.status = status;
    leave.approvedBy = req.employee._id;
    leave.approvedAt = new Date();

    if (status === 'Rejected' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }

    await leave.save();

    res.json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      leave
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaves/balance/:employeeId
// @desc    Get employee leave balance
// @access  Private
router.get('/balance/:employeeId', auth, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const leaveBalance = await Leave.getLeaveBalance(req.params.employeeId, year);

    // Standard leave allocation (can be customized)
    const standardAllocation = {
      annual: 21,
      sick: 10,
      personal: 5,
      other: 0
    };

    const availableLeave = {
      annual: standardAllocation.annual - leaveBalance.annual,
      sick: standardAllocation.sick - leaveBalance.sick,
      personal: standardAllocation.personal - leaveBalance.personal,
      other: standardAllocation.other - leaveBalance.other
    };

    res.json({
      used: leaveBalance,
      available: availableLeave,
      allocation: standardAllocation
    });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaves/stats/overview
// @desc    Get leave statistics (HR/Admin only)
// @access  Private
router.get('/stats/overview', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const totalRequests = await Leave.countDocuments({
      createdAt: { $gte: new Date(currentYear, 0, 1) }
    });

    const approvedRequests = await Leave.countDocuments({
      status: 'Approved',
      createdAt: { $gte: new Date(currentYear, 0, 1) }
    });

    const pendingRequests = await Leave.countDocuments({
      status: 'Pending'
    });

    const rejectedRequests = await Leave.countDocuments({
      status: 'Rejected',
      createdAt: { $gte: new Date(currentYear, 0, 1) }
    });

    // Leave type distribution
    const leaveTypeStats = await Leave.aggregate([
      {
        $match: {
          status: 'Approved',
          createdAt: { $gte: new Date(currentYear, 0, 1) }
        }
      },
      {
        $group: {
          _id: '$leaveType',
          count: { $sum: 1 },
          totalDays: { $sum: '$duration' }
        }
      }
    ]);

    // Monthly leave requests
    const monthlyStats = await Leave.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(currentYear, 0, 1) }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      currentYear: {
        total: totalRequests,
        approved: approvedRequests,
        pending: pendingRequests,
        rejected: rejectedRequests
      },
      leaveTypeStats,
      monthlyStats
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 