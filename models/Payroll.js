const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: {
    housing: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    meal: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deductions: {
    tax: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    pension: { type: Number, default: 0 },
    loan: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  overtime: {
    hours: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  bonuses: [{
    name: String,
    amount: Number,
    description: String
  }],
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  workingDays: {
    type: Number,
    required: true,
    min: 0
  },
  absentDays: {
    type: Number,
    default: 0
  },
  leaveDays: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Approved', 'Paid', 'Cancelled'],
    default: 'Draft'
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Check', 'Cash', 'Digital Wallet'],
    default: 'Bank Transfer'
  },
  paymentDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedAt: {
    type: Date
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

// Compound index for employee, month, and year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ status: 1 });
payrollSchema.index({ month: 1, year: 1 });

// Virtual for total allowances
payrollSchema.virtual('totalAllowances').get(function() {
  return Object.values(this.allowances).reduce((sum, value) => sum + value, 0);
});

// Virtual for total deductions
payrollSchema.virtual('totalDeductionsAmount').get(function() {
  return Object.values(this.deductions).reduce((sum, value) => sum + value, 0);
});

// Virtual for total bonuses
payrollSchema.virtual('totalBonuses').get(function() {
  return this.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
});

// Method to calculate payroll
payrollSchema.methods.calculatePayroll = function() {
  // Calculate total earnings
  this.totalEarnings = this.basicSalary + this.totalAllowances + this.overtime.amount + this.totalBonuses;
  
  // Calculate total deductions
  this.totalDeductions = this.totalDeductionsAmount;
  
  // Calculate net salary
  this.netSalary = this.totalEarnings - this.totalDeductions;
  
  return this;
};

// Static method to get payroll for employee and period
payrollSchema.statics.getPayrollForPeriod = function(employeeId, month, year) {
  return this.findOne({
    employee: employeeId,
    month: month,
    year: year
  }).populate('employee', 'firstName lastName employeeId');
};

// Static method to get all payrolls for a period
payrollSchema.statics.getPayrollsForPeriod = function(month, year) {
  return this.find({
    month: month,
    year: year
  }).populate('employee', 'firstName lastName employeeId department');
};

// Pre-save middleware to calculate payroll
payrollSchema.pre('save', function(next) {
  this.calculatePayroll();
  next();
});

module.exports = mongoose.model('Payroll', payrollSchema); 