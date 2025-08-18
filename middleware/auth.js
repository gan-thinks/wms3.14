const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");

const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(403).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employee = await Employee.findById(decoded.id);
    if (!employee) {
      return res.status(403).json({ error: "Invalid token." });
    }

    req.user = employee;
    next();
  } catch (err) {
    console.error("JWT Auth Error:", err);
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

module.exports = { auth };
