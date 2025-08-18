const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

// Create a new project (open to ALL logged-in users)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, members } = req.body;

    const project = new Project({
      name,
      description,
      members: members || [],
      createdBy: req.user.id
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// Get all projects (open to all authenticated users)
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find().populate('members', 'firstName lastName email');
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get projects' });
  }
});

module.exports = router;
