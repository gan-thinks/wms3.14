/*
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

*/

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const EmployeeSchema = new mongoose.Schema({
  // Basic Information
  employeeId: { 
    type: String, 
    unique: true,
    sparse: true
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
  
  // Work Information - UPDATED HIERARCHY
  role: { 
    type: String, 
    enum: ["admin", "manager", "employee"], 
    default: "employee",
    required: true
  },
  
  // Department Information - ENHANCED
  department: {
    type: String,
    required: true,
    enum: [
      "Development", 
      "Finance", 
      "Design", 
      "Social Media", 
      "Human Resources", 
      "Marketing", 
      "Sales", 
      "Operations", 
      "Customer Support",
      "Quality Assurance",
      "Business Development",
      "Administration"
    ]
  },
  
  position: { 
    type: String,
    required: true
  },
  
  // Hierarchical Structure
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null // null means no direct manager (admin/CEO level)
  },
  
  subordinates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  
  // Department Management (for managers)
  managedDepartments: [{
    type: String,
    enum: [
      "Development", 
      "Finance", 
      "Design", 
      "Social Media", 
      "Human Resources", 
      "Marketing", 
      "Sales", 
      "Operations", 
      "Customer Support",
      "Quality Assurance",
      "Business Development",
      "Administration"
    ]
  }],
  
  // Permissions based on role
  permissions: {
    canViewAllEmployees: { type: Boolean, default: false },
    canEditEmployees: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageProjects: { type: Boolean, default: false },
    canViewPayroll: { type: Boolean, default: false },
    canManageLeaves: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: false }
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
  }],
  
  // Performance and Goals
  performanceRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  goals: [{
    title: String,
    description: String,
    targetDate: Date,
    status: { type: String, enum: ["Not Started", "In Progress", "Completed"], default: "Not Started" }
  }]
}, {
  timestamps: true
});

// Pre-save middleware to set permissions based on role
EmployeeSchema.pre('save', function(next) {
  // Set permissions based on role
  switch(this.role) {
    case 'admin':
      this.permissions = {
        canViewAllEmployees: true,
        canEditEmployees: true,
        canViewReports: true,
        canManageProjects: true,
        canViewPayroll: true,
        canManageLeaves: true,
        canViewAnalytics: true
      };
      break;
      
    case 'manager':
      this.permissions = {
        canViewAllEmployees: true,
        canEditEmployees: true,
        canViewReports: true,
        canManageProjects: true,
        canViewPayroll: false,
        canManageLeaves: true,
        canViewAnalytics: true
      };
      break;
      
    case 'employee':
    default:
      this.permissions = {
        canViewAllEmployees: false,
        canEditEmployees: false,
        canViewReports: false,
        canManageProjects: false,
        canViewPayroll: false,
        canManageLeaves: false,
        canViewAnalytics: false
      };
      break;
  }
  
  next();
});

// Hash password before saving
EmployeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate unique employee ID
EmployeeSchema.pre("save", function(next) {
  if (!this.employeeId) {
    const deptCode = this.department ? this.department.substring(0, 3).toUpperCase() : 'GEN';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 2).toUpperCase();
    this.employeeId = `${deptCode}${timestamp}${random}`;
  }
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
    hireDate: this.hireDate,
    permissions: this.permissions,
    manager: this.manager,
    managedDepartments: this.managedDepartments,
    performanceRating: this.performanceRating
  };
};

// Get dashboard data based on role
EmployeeSchema.methods.getDashboardData = function () {
  const baseData = {
    profile: this.getPublicProfile(),
    role: this.role,
    permissions: this.permissions
  };

  // Add role-specific dashboard sections
  switch(this.role) {
    case 'admin':
      return {
        ...baseData,
        dashboardSections: [
          'overview',
          'employees',
          'projects', 
          'departments',
          'analytics',
          'reports',
          'payroll',
          'leaves'
        ]
      };
      
    case 'manager':
      return {
        ...baseData,
        dashboardSections: [
          'team_overview',
          'my_projects',
          'team_performance',
          'leave_approvals',
          'reports'
        ]
      };
      
    case 'employee':
    default:
      return {
        ...baseData,
        dashboardSections: [
          'my_tasks',
          'my_attendance',
          'my_leaves',
          'my_profile',
          'team_updates'
        ]
      };
  }
};

// Virtual for full name
EmployeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Static method to get department hierarchy
EmployeeSchema.statics.getDepartmentHierarchy = async function(department) {
  const managers = await this.find({ 
    role: 'manager', 
    managedDepartments: department,
    isActive: true 
  });
  
  const employees = await this.find({ 
    department: department, 
    role: 'employee',
    isActive: true 
  });
  
  return { managers, employees };
};

// Static method to get managers for dropdown
EmployeeSchema.statics.getManagersByDepartment = async function(department) {
  return await this.find({ 
    role: 'manager',
    $or: [
      { managedDepartments: department },
      { department: department }
    ],
    isActive: true 
  }).select('firstName lastName email department position');
};

module.exports = mongoose.model("Employee", EmployeeSchema);