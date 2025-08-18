const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Leave = require('../models/Leave');

router.get('/', async (req, res) => {
  try {
    const employeesCount = await Employee.countDocuments();
    const projects = await Project.find().sort({ createdAt: -1 });
    const tasks = await Task.find();
    const leavesCount = await Leave.countDocuments();

    // Calculate tasks completed
    const tasksCompleted = tasks.filter(t => t.status === 'Completed').length;

    // Calculate per project progress
    const projectStatus = await Promise.all(projects.map(async (p) => {
      const projTasks = tasks.filter(t => t.project?.toString() === p._id.toString());
      const completedCount = projTasks.filter(t => t.status === 'Completed').length;
      const completion = projTasks.length ? Math.round((completedCount / projTasks.length) * 100) : 0;
      return { project: p.name, completion };
    }));

    // Latest activity (last 5 updated projects)
    const latestUpdates = projects.slice(0, 5).map(p => ({
      name: p.name,
      status: p.status || 'Active',
      lastActivity: p.updatedAt || p.createdAt
    }));

    res.json({
      employees: employeesCount,
      projects: projects.length,
      tasksCompleted,
      leaves: leavesCount,
      projectStatus,
      attendance: {
        present: 12, // can be dynamic from Attendance model
        absent: 3,
        late: 1
      },
      latestUpdates
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
