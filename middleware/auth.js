const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await Employee.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is active (optional - add this if needed)
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Add user to request - keeping your format but ensuring compatibility
    req.user = {
      id: user._id.toString(), // ✅ This ensures string format for project routes
      _id: user._id,           // ✅ Keep original _id for backward compatibility
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      ...user.toObject()       // ✅ Include all user properties
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    next();
  };
};

module.exports = { auth, authorize };