const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/attendance/check-in
// @desc    Employee check-in
// @access  Private
router.post('/check-in', [
  auth,
  body('location').optional().isObject(),
  body('method').optional().isIn(['Manual', 'QR Code', 'Biometric', 'Mobile App'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employee: req.employee._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance && existingAttendance.checkIn.time) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    let attendance;
    if (existingAttendance) {
      attendance = existingAttendance;
    } else {
      attendance = new Attendance({
        employee: req.employee._id,
        date: today
      });
    }

    attendance.checkIn = {
      time: new Date(),
      location: req.body.location || {},
      method: req.body.method || 'Manual'
    };

    await attendance.save();

    res.json({
      message: 'Check-in successful',
      attendance: {
        checkInTime: attendance.checkIn.time,
        date: attendance.date
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/check-out
// @desc    Employee check-out
// @access  Private
router.post('/check-out', [
  auth,
  body('location').optional().isObject(),
  body('method').optional().isIn(['Manual', 'QR Code', 'Biometric', 'Mobile App'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: req.employee._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({ message: 'No check-in found for today' });
    }

    if (attendance.checkOut.time) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = {
      time: new Date(),
      location: req.body.location || {},
      method: req.body.method || 'Manual'
    };

    await attendance.save();

    res.json({
      message: 'Check-out successful',
      attendance: {
        checkInTime: attendance.checkIn.time,
        checkOutTime: attendance.checkOut.time,
        totalWorkHours: attendance.totalWorkHours,
        overtime: attendance.overtime
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/break
// @desc    Start or end break
// @access  Private
router.post('/break', [
  auth,
  body('action').isIn(['start', 'end']).withMessage('Action must be start or end'),
  body('type').optional().isIn(['Lunch', 'Coffee', 'Personal', 'Other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: req.employee._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return res.status(400).json({ message: 'No attendance record found for today' });
    }

    if (req.body.action === 'start') {
      // Start break
      attendance.breaks.push({
        startTime: new Date(),
        type: req.body.type || 'Lunch'
      });
    } else {
      // End break
      const lastBreak = attendance.breaks[attendance.breaks.length - 1];
      if (!lastBreak || lastBreak.endTime) {
        return res.status(400).json({ message: 'No active break to end' });
      }

      lastBreak.endTime = new Date();
      const duration = (lastBreak.endTime - lastBreak.startTime) / (1000 * 60);
      lastBreak.duration = Math.round(duration);
    }

    await attendance.save();

    res.json({
      message: `Break ${req.body.action}ed successfully`,
      breaks: attendance.breaks
    });
  } catch (error) {
    console.error('Break error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/my-attendance
// @desc    Get current employee's attendance
// @access  Private
router.get('/my-attendance', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const attendance = await Attendance.find({
      employee: req.employee._id,
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Attendance.countDocuments({
      employee: req.employee._id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.findOne({
      employee: req.employee._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      attendance,
      todayAttendance,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/employee/:id
// @desc    Get employee attendance (HR/Manager only)
// @access  Private
router.get('/employee/:id', [auth, authorize('HR', 'Admin', 'Manager')], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const attendance = await Attendance.find({
      employee: req.params.id,
      date: { $gte: startDate, $lte: endDate }
    })
    .populate('employee', 'firstName lastName employeeId')
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Attendance.countDocuments({
      employee: req.params.id,
      date: { $gte: startDate, $lte: endDate }
    });

    res.json({
      attendance,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/department/:id
// @desc    Get department attendance (HR/Manager only)
// @access  Private
router.get('/department/:id', [auth, authorize('HR', 'Admin', 'Manager')], async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      date: {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      }
    })
    .populate({
      path: 'employee',
      match: { department: req.params.id },
      select: 'firstName lastName employeeId department'
    })
    .sort({ 'employee.firstName': 1 });

    // Filter out attendance records where employee doesn't match department
    const filteredAttendance = attendance.filter(record => record.employee);

    res.json(filteredAttendance);
  } catch (error) {
    console.error('Get department attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record (HR/Admin only)
// @access  Private
router.put('/:id', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const {
      checkIn, checkOut, breaks, status, notes, approvalStatus
    } = req.body;

    if (checkIn) attendance.checkIn = checkIn;
    if (checkOut) attendance.checkOut = checkOut;
    if (breaks) attendance.breaks = breaks;
    if (status) attendance.status = status;
    if (notes) attendance.notes = notes;
    if (approvalStatus) {
      attendance.approvalStatus = approvalStatus;
      if (approvalStatus === 'Approved') {
        attendance.approvedBy = req.employee._id;
        attendance.approvedAt = new Date();
      }
    }

    await attendance.save();

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/stats/overview
// @desc    Get attendance statistics
// @access  Private (HR/Admin only)
router.get('/stats/overview', [auth, authorize('HR', 'Admin')], async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEmployees = await Employee.countDocuments({ isActive: true, status: 'Active' });
    const presentToday = await Attendance.countDocuments({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      'checkIn.time': { $exists: true }
    });
    const absentToday = totalEmployees - presentToday;
    const lateToday = await Attendance.countDocuments({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      status: 'Late'
    });

    // Weekly attendance
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weeklyAttendance = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: weekStart, $lte: weekEnd },
          'checkIn.time': { $exists: true }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      today: {
        total: totalEmployees,
        present: presentToday,
        absent: absentToday,
        late: lateToday
      },
      weeklyAttendance
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 