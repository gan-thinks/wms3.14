const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  hireDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  salary: {
    type: Number,
    required: true,
    min: 0
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Terminated', 'On Leave'],
    default: 'Active'
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    }
  }],
  education: [{
    degree: String,
    institution: String,
    year: Number,
    gpa: Number
  }],
  workExperience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  profilePicture: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['Employee', 'Manager', 'HR', 'Admin'],
    default: 'Employee'
  },
  permissions: [{
    type: String
  }],
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
employeeSchema.methods.getPublicProfile = function() {
  const employeeObject = this.toObject();
  delete employeeObject.password;
  delete employeeObject.permissions;
  return employeeObject;
};

module.exports = mongoose.model('Employee', employeeSchema); 