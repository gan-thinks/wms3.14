const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Middleware to authenticate user using JWT
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const employee = await Employee.findById(decoded.id).select('-password');

    if (!employee || !employee.isActive) {
      return res.status(401).json({ message: 'Token is not valid or user is inactive' });
    }

    req.employee = employee;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to authorize specific roles (Admin, HR, etc.)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({ message: 'Access denied' });
    }

    if (!roles.includes(req.employee.role)) {
      return res.status(403).json({ message: 'Insufficient role permissions' });
    }

    next();
  };
};

// Middleware to check specific custom permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({ message: 'Access denied' });
    }

    // Admins have all permissions
    if (req.employee.role === 'Admin') {
      return next();
    }

    if (!req.employee.permissions || !req.employee.permissions.includes(permission)) {
      return res.status(403).json({ message: 'Insufficient custom permissions' });
    }

    next();
  };
};

module.exports = {
  auth,
  authorize,
  checkPermission
};
