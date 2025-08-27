const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

// ✅ Create a new project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, tasks } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Create project with tasks (simplified - no member assignment for now)
    const project = new Project({
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: req.user.id,
      members: [req.user.id], // Add creator as member
      tasks: tasks || [] // Tasks from frontend
    });

    await project.save();
    
    // Populate the created project before sending response
    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate('tasks.assignedTo', 'firstName lastName email');

    console.log('✅ Project created:', project.name);
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populatedProject
    });

  } catch (err) {
    console.error('❌ Create project error:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// ✅ Get all projects with proper population
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'firstName lastName email role')
      .populate('members', 'firstName lastName email role')
      .populate('tasks.assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 }); // Newest first

    console.log(`✅ Fetched ${projects.length} projects`);
    res.json(projects);

  } catch (err) {
    console.error('❌ Get projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// ✅ Get single project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email role')
      .populate('members', 'firstName lastName email role')
      .populate('tasks.assignedTo', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);

  } catch (err) {
    console.error('❌ Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// ✅ Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, tasks, members } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update fields
    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (tasks) project.tasks = tasks;
    if (members) project.members = members;

    await project.save();

    // Return populated project
    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate('tasks.assignedTo', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject
    });

  } catch (err) {
    console.error('❌ Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ✅ Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is creator or admin
    if (project.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this project' });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (err) {
    console.error('❌ Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;