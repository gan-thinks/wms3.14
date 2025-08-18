const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const Employee = require("../models/Employee");
const { auth } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new employee
 * @access  Public
 */
router.post(
  "/signup",
  [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    console.log("➡️  POST /api/auth/signup called");
    console.log("📦 Request body:", req.body);

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Validation failed:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, password, role = 'employee' } = req.body;
      console.log("✅ Validation passed");

      const existingUser = await Employee.findOne({ email });
      if (existingUser) {
        console.log("⚠️ User already exists:", email);
        return res.status(400).json({ message: "User already exists" });
      }

      // Create new employee without manual hashing (model handles it)
      const newEmployee = new Employee({
        firstName,
        lastName,
        email,
        password, // The pre-save hook will hash this
        role
      });

      await newEmployee.save();
      console.log("✅ New employee saved:", newEmployee._id);

      const payload = { 
        id: newEmployee._id, 
        email: newEmployee.email,
        role: newEmployee.role 
      };
      
      const token = jwt.sign(
        payload, 
        process.env.JWT_SECRET || 'your-fallback-secret-key', 
        { expiresIn: "1d" }
      );

      console.log("🎉 Signup successful, returning token");

      res.status(201).json({
        message: "Signup successful",
        token,
        employee: {
          id: newEmployee._id,
          firstName: newEmployee.firstName,
          lastName: newEmployee.lastName,
          email: newEmployee.email,
          role: newEmployee.role
        },
      });
    } catch (error) {
      console.error("🔥 Signup error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate employee & get token
 * @access  Public
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").exists().withMessage("Password is required")
  ],
  async (req, res) => {
    console.log("➡️  POST /api/auth/login called");
    console.log("📦 Request body:", { email: req.body.email, password: "***" });

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if employee exists
      const employee = await Employee.findOne({ email });
      if (!employee) {
        console.log("❌ Employee not found:", email);
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check if employee is active
      if (employee.isActive === false) {
        return res.status(400).json({ message: "Account is deactivated" });
      }

      // Validate password using the model method
      const isMatch = await employee.comparePassword(password);
      if (!isMatch) {
        console.log("❌ Password mismatch for:", email);
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Update last login
      employee.lastLogin = new Date();
      await employee.save();

      // Create JWT token
      const payload = {
        id: employee._id,
        email: employee.email,
        role: employee.role
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your-fallback-secret-key',
        { expiresIn: "1d" }
      );

      console.log("✅ Login successful for:", email);

      res.json({
        message: "Login successful",
        token,
        employee: {
          id: employee._id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          role: employee.role
        }
      });
    } catch (error) {
      console.error("🔥 Login error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current employee profile
 * @access  Private
 */
router.get("/me", auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id).select('-password');
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;