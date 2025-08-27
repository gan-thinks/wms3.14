/* const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const EmployeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "employee"], default: "employee" },
});

// Hash password before saving
EmployeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
EmployeeSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Public user info
EmployeeSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
  };
};

module.exports = mongoose.model("Employee", EmployeeSchema);
*/

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const EmployeeSchema = new mongoose.Schema({
  // Basic Information
  employeeId: { 
    type: String, 
    unique: true,
    sparse: true // Allow null/undefined values
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
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String,
    sparse: true
  },
  
  // Personal Information
  dateOfBirth: { 
    type: Date 
  },
  gender: { 
    type: String, 
    enum: ["Male", "Female", "Other"] 
  },
  
  // Work Information
  role: { 
    type: String, 
    enum: ["admin", "employee", "Employee", "Admin"], 
    default: "employee" 
  },
  department: { 
    type: String 
  },
  position: { 
    type: String 
  },
  salary: { 
    type: Number 
  },
  employmentType: { 
    type: String, 
    enum: ["Full-time", "Part-time", "Contract", "Intern"],
    default: "Full-time"
  },
  status: { 
    type: String, 
    enum: ["Active", "Inactive", "Terminated"],
    default: "Active"
  },
  
  // Additional Information
  documents: [{ 
    type: String 
  }],
  profilePicture: { 
    type: String,
    default: ""
  },
  permissions: [{ 
    type: String 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  hireDate: { 
    type: Date,
    default: Date.now
  },
  dateOfJoining: { 
    type: Date,
    default: Date.now
  },
  lastLogin: { 
    type: Date 
  },
  
  // Professional Information
  skills: [{ 
    type: String 
  }],
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  workExperience: [{
    company: String,
    position: String,
    duration: String,
    description: String
  }]
}, {
  timestamps: true // This adds createdAt and updatedAt
});

// Hash password before saving
EmployeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
EmployeeSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate unique employee ID
EmployeeSchema.pre("save", function(next) {
  if (!this.employeeId) {
    this.employeeId = Date.now().toString() + Math.random().toString(36).substr(2, 4);
  }
  next();
});

// Public user info
EmployeeSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    employeeId: this.employeeId,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    department: this.department,
    position: this.position,
    status: this.status,
    isActive: this.isActive,
    profilePicture: this.profilePicture,
    hireDate: this.hireDate
  };
};

// Virtual for full name
EmployeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("Employee", EmployeeSchema);