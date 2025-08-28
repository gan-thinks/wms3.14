/* 
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

*/


const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

// Create a new project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, tasks = [], members = [], startDate, expectedEndDate, budget, priority } = req.body;

    const project = new Project({
      name,
      description,
      tasks: tasks.map(task => ({
        ...task,
        status: 'Not Started',
        progress: 0
      })),
      members,
      createdBy: req.user.id,
      projectManager: req.user.id, // Creator becomes project manager by default
      startDate: startDate || new Date(),
      expectedEndDate,
      budget: budget || 0,
      priority: priority || 'Medium'
    });

    await project.save();
    await project.populate(['createdBy', 'projectManager', 'members', 'tasks.assignedTo']);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create project',
      error: err.message 
    });
  }
});

// Get all projects with populated data
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'firstName lastName email')
      .populate('projectManager', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate('tasks.assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      projects
    });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get projects',
      error: err.message 
    });
  }
});

// Get single project with full details and analytics
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('projectManager', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate('tasks.assignedTo', 'firstName lastName email')
      .populate('progressUpdates.updatedBy', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Calculate analytics
    const analytics = {
      totalTasks: project.tasks.length,
      completedTasks: project.tasks.filter(t => t.status === 'Completed').length,
      inProgressTasks: project.tasks.filter(t => t.status === 'In Progress').length,
      notStartedTasks: project.tasks.filter(t => t.status === 'Not Started').length,
      onHoldTasks: project.tasks.filter(t => t.status === 'On Hold').length,
      averageProgress: project.overallProgress,
      totalEstimatedHours: project.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      totalActualHours: project.tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
      progressHistory: project.progressUpdates.map(update => ({
        date: update.date,
        progress: update.overallProgress,
        updatedBy: update.updatedBy
      })).sort((a, b) => new Date(a.date) - new Date(b.date))
    };

    res.json({
      success: true,
      project,
      analytics
    });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get project',
      error: err.message 
    });
  }
});

// Update project basic info (only creator or project manager)
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Check permissions
    const canEdit = project.createdBy.toString() === req.user.id || 
                   project.projectManager?.toString() === req.user.id ||
                   req.user.role === 'admin';

    if (!canEdit) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to edit this project' 
      });
    }

    const { name, description, members, expectedEndDate, budget, priority, projectManager } = req.body;

    // Update allowed fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (members) project.members = members;
    if (expectedEndDate) project.expectedEndDate = expectedEndDate;
    if (budget !== undefined) project.budget = budget;
    if (priority) project.priority = priority;
    if (projectManager) project.projectManager = projectManager;

    await project.save();
    await project.populate(['createdBy', 'projectManager', 'members', 'tasks.assignedTo']);

    res.json({
      success: true,
      message: 'Project updated successfully',
      project
    });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update project',
      error: err.message 
    });
  }
});

// Add daily progress update
router.post('/:id/progress', auth, async (req, res) => {
  try {
    const { overallProgress, remarks, taskUpdates = [], blockers = [] } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Check permissions (members, creator, or project manager can update)
    const canUpdate = project.createdBy.toString() === req.user.id || 
                     project.projectManager?.toString() === req.user.id ||
                     project.members.includes(req.user.id) ||
                     req.user.role === 'admin';

    if (!canUpdate) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update this project' 
      });
    }

    // Update individual tasks if provided
    if (taskUpdates.length > 0) {
      taskUpdates.forEach(update => {
        const task = project.tasks.id(update.taskId);
        if (task) {
          if (update.progress !== undefined) task.progress = update.progress;
          if (update.status) task.status = update.status;
          if (update.hoursWorked) task.actualHours += update.hoursWorked;
        }
      });
    }

    // Add progress update
    project.progressUpdates.push({
      date: new Date(),
      overallProgress: overallProgress || project.calculateProgress(),
      remarks,
      updatedBy: req.user.id,
      taskUpdates,
      blockers
    });

    await project.save();
    await project.populate(['progressUpdates.updatedBy']);

    res.json({
      success: true,
      message: 'Progress updated successfully',
      project
    });
  } catch (err) {
    console.error('Update progress error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update progress',
      error: err.message 
    });
  }
});

// Update task status/progress
router.put('/:id/tasks/:taskId', auth, async (req, res) => {
  try {
    const { status, progress, hoursWorked, notes } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    const task = project.tasks.id(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Check permissions (task assignee, creator, project manager, or admin)
    const canUpdate = task.assignedTo?.toString() === req.user.id ||
                     project.createdBy.toString() === req.user.id || 
                     project.projectManager?.toString() === req.user.id ||
                     req.user.role === 'admin';

    if (!canUpdate) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update this task' 
      });
    }

    // Update task
    if (status) task.status = status;
    if (progress !== undefined) task.progress = Math.min(100, Math.max(0, progress));
    if (hoursWorked) task.actualHours += hoursWorked;

    // Auto-update status based on progress
    if (task.progress === 100 && task.status !== 'Completed') {
      task.status = 'Completed';
    } else if (task.progress > 0 && task.status === 'Not Started') {
      task.status = 'In Progress';
    }

    await project.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update task',
      error: err.message 
    });
  }
});

// Get project analytics
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('tasks.assignedTo', 'firstName lastName')
      .populate('progressUpdates.updatedBy', 'firstName lastName');

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Detailed analytics
    const analytics = {
      overview: {
        totalTasks: project.tasks.length,
        completedTasks: project.tasks.filter(t => t.status === 'Completed').length,
        inProgressTasks: project.tasks.filter(t => t.status === 'In Progress').length,
        notStartedTasks: project.tasks.filter(t => t.status === 'Not Started').length,
        onHoldTasks: project.tasks.filter(t => t.status === 'On Hold').length,
        overallProgress: project.overallProgress
      },
      timeTracking: {
        totalEstimatedHours: project.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
        totalActualHours: project.tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
        efficiency: 0 // Will calculate below
      },
      progressTrend: project.progressUpdates.map(update => ({
        date: update.date.toISOString().split('T')[0],
        progress: update.overallProgress,
        updatedBy: `${update.updatedBy.firstName} ${update.updatedBy.lastName}`
      })).sort((a, b) => new Date(a.date) - new Date(b.date)),
      tasksByStatus: [
        { name: 'Not Started', value: project.tasks.filter(t => t.status === 'Not Started').length },
        { name: 'In Progress', value: project.tasks.filter(t => t.status === 'In Progress').length },
        { name: 'Completed', value: project.tasks.filter(t => t.status === 'Completed').length },
        { name: 'On Hold', value: project.tasks.filter(t => t.status === 'On Hold').length }
      ].filter(item => item.value > 0),
      tasksByPriority: [
        { name: 'Low', value: project.tasks.filter(t => t.priority === 'Low').length },
        { name: 'Medium', value: project.tasks.filter(t => t.priority === 'Medium').length },
        { name: 'High', value: project.tasks.filter(t => t.priority === 'High').length },
        { name: 'Critical', value: project.tasks.filter(t => t.priority === 'Critical').length }
      ].filter(item => item.value > 0),
      memberProgress: project.members.map(memberId => {
        const memberTasks = project.tasks.filter(t => t.assignedTo?.toString() === memberId.toString());
        const completedTasks = memberTasks.filter(t => t.status === 'Completed').length;
        return {
          memberId,
          totalTasks: memberTasks.length,
          completedTasks,
          progress: memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0
        };
      })
    };

    // Calculate efficiency
    if (analytics.timeTracking.totalEstimatedHours > 0) {
      analytics.timeTracking.efficiency = Math.round(
        (analytics.timeTracking.totalEstimatedHours / analytics.timeTracking.totalActualHours) * 100
      );
    }

    res.json({
      success: true,
      analytics
    });
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get analytics',
      error: err.message 
    });
  }
});

// Delete project (only creator or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Check permissions
    const canDelete = project.createdBy.toString() === req.user.id || req.user.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to delete this project' 
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete project',
      error: err.message 
    });
  }
});

module.exports = router;