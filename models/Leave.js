const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Annual', 'Sick', 'Personal', 'Maternity', 'Paternity', 'Bereavement', 'Unpaid', 'Other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in days
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  documents: [{
    name: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayType: {
    type: String,
    enum: ['Morning', 'Afternoon'],
    default: 'Morning'
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
leaveSchema.index({ employee: 1, startDate: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ leaveType: 1 });

// Virtual for leave period
leaveSchema.virtual('leavePeriod').get(function() {
  return `${this.startDate.toLocaleDateString()} - ${this.endDate.toLocaleDateString()}`;
});

// Method to check if leave dates overlap
leaveSchema.methods.hasOverlap = async function() {
  const existingLeave = await this.constructor.findOne({
    employee: this.employee,
    status: { $in: ['Pending', 'Approved'] },
    $or: [
      {
        startDate: { $lte: this.endDate },
        endDate: { $gte: this.startDate }
      }
    ],
    _id: { $ne: this._id }
  });
  
  return existingLeave !== null;
};

// Static method to get employee leave balance
leaveSchema.statics.getLeaveBalance = async function(employeeId, year) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);
  
  const leaves = await this.find({
    employee: employeeId,
    status: 'Approved',
    startDate: { $gte: startOfYear },
    endDate: { $lte: endOfYear }
  });
  
  const leaveBalance = {
    annual: 0,
    sick: 0,
    personal: 0,
    other: 0
  };
  
  leaves.forEach(leave => {
    if (leave.leaveType === 'Annual') {
      leaveBalance.annual += leave.duration;
    } else if (leave.leaveType === 'Sick') {
      leaveBalance.sick += leave.duration;
    } else if (leave.leaveType === 'Personal') {
      leaveBalance.personal += leave.duration;
    } else {
      leaveBalance.other += leave.duration;
    }
  });
  
  return leaveBalance;
};

// Pre-save middleware to calculate duration
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const timeDiff = this.endDate.getTime() - this.startDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    this.duration = dayDiff + 1; // Include both start and end date
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema); 