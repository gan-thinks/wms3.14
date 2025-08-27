const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth');

// Create a new project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, tasks, members } = req.body;

    const project = new Project({
      name,
      description,
      tasks: tasks || [],
      members: members || [],
      createdBy: req.user.id
    });

    await project.save();
    await project.populate(['createdBy', 'tasks.assignedTo', 'members'], 'firstName lastName email');
    res.status(201).json(project);
  } catch (err) {
    console.error('Project creation error:', err);
    res.status(500).json({ message: 'Failed to create project', error: err.message });
  }
});

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate('tasks.assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ message: 'Failed to get projects' });
  }
});

// Get project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate('tasks.assignedTo', 'firstName lastName email');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(project);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ message: 'Failed to get project' });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, tasks, members, status } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (tasks) project.tasks = tasks;
    if (members) project.members = members;
    if (status) project.status = status;

    await project.save();
    await project.populate(['createdBy', 'tasks.assignedTo', 'members'], 'firstName lastName email');
    
    res.json(project);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ message: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

// Get calendar events (projects, tasks, meetings)
router.get('/calendar/events', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'firstName lastName')
      .populate('tasks.assignedTo', 'firstName lastName')
      .select('name description tasks createdAt updatedAt');

    const events = [];

    // Add project creation events
    projects.forEach(project => {
      events.push({
        id: `project-${project._id}`,
        title: `Project: ${project.name}`,
        date: project.createdAt.toISOString().split('T')[0],
        type: 'project',
        projectId: project._id,
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6'
      });

      // Add task events
      project.tasks.forEach((task, index) => {
        if (task.assignedTo) {
          events.push({
            id: `task-${project._id}-${index}`,
            title: `Task: ${task.title}`,
            date: project.createdAt.toISOString().split('T')[0],
            type: 'task',
            projectId: project._id,
            taskIndex: index,
            assignedTo: task.assignedTo.firstName + ' ' + task.assignedTo.lastName,
            backgroundColor: '#10b981',
            borderColor: '#10b981'
          });
        }
      });
    });

    res.json(events);
  } catch (err) {
    console.error('Get calendar events error:', err);
    res.status(500).json({ message: 'Failed to get calendar events' });
  }
});

module.exports = router;
