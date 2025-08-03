const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  budget: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    building: String,
    floor: String,
    room: String
  },
  contactInfo: {
    phone: String,
    email: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  employeeCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });
departmentSchema.index({ isActive: 1 });

// Virtual for full department info
departmentSchema.virtual('fullInfo').get(function() {
  return `${this.code} - ${this.name}`;
});

// Method to get department hierarchy
departmentSchema.methods.getHierarchy = async function() {
  const hierarchy = [];
  let currentDept = this;
  
  while (currentDept) {
    hierarchy.unshift({
      _id: currentDept._id,
      name: currentDept.name,
      code: currentDept.code
    });
    currentDept = await this.constructor.findById(currentDept.parentDepartment);
  }
  
  return hierarchy;
};

// Static method to get all active departments
departmentSchema.statics.getActiveDepartments = function() {
  return this.find({ isActive: true }).populate('head', 'firstName lastName email');
};

module.exports = mongoose.model('Department', departmentSchema); 