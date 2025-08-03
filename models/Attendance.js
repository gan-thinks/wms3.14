const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkIn: {
    time: {
      type: Date
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    method: {
      type: String,
      enum: ['Manual', 'QR Code', 'Biometric', 'Mobile App'],
      default: 'Manual'
    }
  },
  checkOut: {
    time: {
      type: Date
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    method: {
      type: String,
      enum: ['Manual', 'QR Code', 'Biometric', 'Mobile App'],
      default: 'Manual'
    }
  },
  breaks: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number, // in minutes
      default: 0
    },
    type: {
      type: String,
      enum: ['Lunch', 'Coffee', 'Personal', 'Other'],
      default: 'Lunch'
    }
  }],
  totalWorkHours: {
    type: Number, // in hours
    default: 0
  },
  overtime: {
    type: Number, // in hours
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'Work From Home', 'On Leave'],
    default: 'Present'
  },
  notes: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for employee and date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

// Virtual for work duration
attendanceSchema.virtual('workDuration').get(function() {
  if (!this.checkIn.time || !this.checkOut.time) return 0;
  
  const duration = this.checkOut.time - this.checkIn.time;
  return Math.round(duration / (1000 * 60 * 60) * 100) / 100; // hours with 2 decimal places
});

// Method to calculate total break time
attendanceSchema.methods.getTotalBreakTime = function() {
  return this.breaks.reduce((total, breakItem) => {
    if (breakItem.endTime && breakItem.startTime) {
      const duration = breakItem.endTime - breakItem.startTime;
      return total + (duration / (1000 * 60)); // in minutes
    }
    return total;
  }, 0);
};

// Method to check if attendance is complete
attendanceSchema.methods.isComplete = function() {
  return this.checkIn.time && this.checkOut.time;
};

// Static method to get attendance for date range
attendanceSchema.statics.getAttendanceForRange = function(employeeId, startDate, endDate) {
  return this.find({
    employee: employeeId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('employee', 'firstName lastName employeeId');
};

// Pre-save middleware to calculate work hours
attendanceSchema.pre('save', function(next) {
  if (this.checkIn.time && this.checkOut.time) {
    const workDuration = this.checkOut.time - this.checkIn.time;
    const breakTime = this.getTotalBreakTime() * 60 * 1000; // convert to milliseconds
    
    this.totalWorkHours = Math.round((workDuration - breakTime) / (1000 * 60 * 60) * 100) / 100;
    
    // Calculate overtime (assuming 8 hours is standard work day)
    const standardHours = 8;
    this.overtime = Math.max(0, this.totalWorkHours - standardHours);
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema); 