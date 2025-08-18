const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const Employee = require("../models/Employee");

const router = express.Router();

// @route   POST /api/auth/signup
router.post(
  "/signup",
  [
    body("firstName").notEmpty(),
    body("lastName").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { firstName, lastName, email, password, role } = req.body;

    try {
      let user = await Employee.findOne({ email });
      if (user)
        return res.status(400).json({ message: "User already exists" });

      user = new Employee({
        firstName,
        lastName,
        email,
        password,
        role: role || "employee",
      });

      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.status(201).json({ token, user: user.getPublicProfile() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Signup failed" });
    }
  }
);

// @route   POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail(),
    body("password").exists(),
  ],
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await Employee.findOne({ email });
      if (!user)
        return res.status(400).json({ message: "Invalid credentials" });

      const isMatch = await user.comparePassword(password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.json({ token, user: user.getPublicProfile() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Login failed" });
    }
  }
);

module.exports = router;
