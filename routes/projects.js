/*        // routes/projects.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Employee = require('../models/Employee');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/projects
 * Return all projects visible to authenticated user
 */
/* router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'firstName lastName email role')
      .populate('members', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/projects/:id
 */
/*router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email role')
      .populate('members', 'firstName lastName email');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}); */

/**
 * POST /api/projects
 * Create project — Managers/HR/Admin allowed
 * members optional, tasks optional
 */
/*router.post(
  '/',
  [
    auth,
    authorize('Manager', 'Admin', 'HR'),
    body('name').notEmpty().withMessage('Project name is required'),
    body('members').optional().isArray().withMessage('Members must be an array'),
    body('tasks').optional().isArray().withMessage('Tasks must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { name, description, members = [], tasks = [] } = req.body;

      // Ensure members is always an array
      if (!Array.isArray(members)) {
        members = [];
      }

      // Validate members only if provided
      if (members.length > 0) {
        const validMembers = await Employee.find({ _id: { $in: members } });
        if (validMembers.length !== members.length) {
          return res.status(400).json({ message: 'Some members do not exist' });
        }
      }

      // Validate assignedTo in tasks if provided
      const assignedIds = tasks
        .map(t => t.assignedTo)
        .filter(Boolean);
      if (assignedIds.length > 0) {
        const validAssigned = await Employee.find({ _id: { $in: assignedIds } });
        if (validAssigned.length !== assignedIds.length) {
          return res.status(400).json({ message: 'Some task assignedTo users do not exist' });
        }
      }

      const project = new Project({
        name,
        description,
        createdBy: req.employee._id,
        members,
        tasks
      });

      await project.save();

      const populated = await Project.findById(project._id)
        .populate('createdBy', 'firstName lastName email')
        .populate('members', 'firstName lastName email');

      res.status(201).json({ message: 'Project created', project: populated });
    } catch (err) {
      console.error('Create project error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * PUT /api/projects/:id
 */
/* router.put('/:id', auth, authorize('Manager', 'Admin', 'HR'), async (req, res) => {
  try {
    const { members, tasks } = req.body;

    // Validate members only if provided
    if (members && members.length > 0) {
      const validMembers = await Employee.find({ _id: { $in: members } });
      if (validMembers.length !== members.length) {
        return res.status(400).json({ message: 'Some members do not exist' });
      }
    }

    // Validate task assignedTo only if provided
    if (tasks && tasks.length > 0) {
      const assignedIds = tasks.map(t => t.assignedTo).filter(Boolean);
      if (assignedIds.length > 0) {
        const validAssigned = await Employee.find({ _id: { $in: assignedIds } });
        if (validAssigned.length !== assignedIds.length) {
          return res.status(400).json({ message: 'Some task assignedTo users do not exist' });
        }
      }
    }

    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project updated', project });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE
 */
/*router.delete('/:id', auth, authorize('Manager', 'Admin', 'HR'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
*/  

const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Employee = require('../models/Employee');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/projects
 * @desc    Create a new project (members optional, tasks optional)
 * @access  Protected (Manager, Admin, HR)
 */
router.post(
  '/',
  [
    auth,
    authorize('Manager', 'Admin', 'HR'),
    body('name').notEmpty().withMessage('Project name is required'),
    body('tasks').optional().isArray().withMessage('Tasks must be an array'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description = '', tasks = [] } = req.body;

      // Validate assignedTo IDs in tasks (if provided)
      const assignedIds = tasks.map(t => t.assignedTo).filter(Boolean);
      if (assignedIds.length > 0) {
        const validAssigned = await Employee.find({ _id: { $in: assignedIds } });
        if (validAssigned.length !== assignedIds.length) {
          return res.status(400).json({ message: 'Some task assignedTo users do not exist' });
        }
      }

      const project = new Project({
        name,
        description,
        createdBy: req.employee._id,
        tasks,
      });

      await project.save();

      const populated = await Project.findById(project._id)
        .populate('createdBy', 'firstName lastName email')
        .populate({
          path: 'tasks.assignedTo',
          select: 'firstName lastName email',
        });

      res.status(201).json({ message: 'Project created successfully', project: populated });
    } catch (err) {
      console.error('Create project error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
