/*
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
*/

const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = 'uploads/projects';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Create a new project
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, tasks = [], members = [], startDate, expectedEndDate, budget, priority, tags = [] } = req.body;
        
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
            projectManager: req.user.id,
            startDate: startDate || new Date(),
            expectedEndDate,
            budget: budget || 0,
            priority: priority || 'Medium',
            tags
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
            .populate('createdBy', 'firstName lastName email department')
            .populate('projectManager', 'firstName lastName email department')
            .populate('members', 'firstName lastName email department role')
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
            .populate('createdBy', 'firstName lastName email department')
            .populate('projectManager', 'firstName lastName email department')
            .populate('members', 'firstName lastName email department role profilePicture')
            .populate('tasks.assignedTo', 'firstName lastName email department')
            .populate('progressUpdates.updatedBy', 'firstName lastName email')
            .populate('files.uploadedBy', 'firstName lastName')
            .populate('discussions.author', 'firstName lastName profilePicture')
            .populate('discussions.replies.author', 'firstName lastName profilePicture');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Get analytics
        const analytics = project.getAnalytics();
        
        // Calculate efficiency
        if (analytics.timeTracking.totalEstimatedHours > 0) {
            analytics.timeTracking.efficiency = Math.round(
                (analytics.timeTracking.totalEstimatedHours / analytics.timeTracking.totalActualHours) * 100
            );
        }

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

// Update project basic info
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

        const { name, description, members, expectedEndDate, budget, priority, projectManager, tags } = req.body;

        // Update allowed fields
        if (name) project.name = name;
        if (description !== undefined) project.description = description;
        if (members) project.members = members;
        if (expectedEndDate) project.expectedEndDate = expectedEndDate;
        if (budget !== undefined) project.budget = budget;
        if (priority) project.priority = priority;
        if (projectManager) project.projectManager = projectManager;
        if (tags) project.tags = tags;

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

// Add team member to project
router.post('/:id/members', auth, async (req, res) => {
    try {
        const { memberId } = req.body;
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
                message: 'You do not have permission to add members'
            });
        }

        // Check if member already exists
        if (project.members.includes(memberId)) {
            return res.status(400).json({
                success: false,
                message: 'Member already exists in project'
            });
        }

        project.members.push(memberId);
        await project.save();
        await project.populate('members', 'firstName lastName email department');

        res.json({
            success: true,
            message: 'Member added successfully',
            members: project.members
        });
    } catch (err) {
        console.error('Add member error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to add member',
            error: err.message
        });
    }
});

// Add task to project
router.post('/:id/tasks', auth, async (req, res) => {
    try {
        const { title, description, assignedTo, priority, estimatedHours, dueDate, tags } = req.body;
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
                       project.members.includes(req.user.id) ||
                       req.user.role === 'admin';
        
        if (!canEdit) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to add tasks'
            });
        }

        const newTask = {
            title,
            description,
            assignedTo: assignedTo || null,
            priority: priority || 'Medium',
            estimatedHours: estimatedHours || 0,
            dueDate: dueDate || null,
            tags: tags || [],
            status: 'Not Started',
            progress: 0
        };

        project.tasks.push(newTask);
        await project.save();
        await project.populate('tasks.assignedTo', 'firstName lastName email');

        res.json({
            success: true,
            message: 'Task added successfully',
            task: project.tasks[project.tasks.length - 1]
        });
    } catch (err) {
        console.error('Add task error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to add task',
            error: err.message
        });
    }
});

// File upload for project
router.post('/:id/upload', auth, upload.array('files', 5), async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check permissions
        const canUpload = project.createdBy.toString() === req.user.id ||
                         project.projectManager?.toString() === req.user.id ||
                         project.members.includes(req.user.id) ||
                         req.user.role === 'admin';
        
        if (!canUpload) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to upload files'
            });
        }

        const files = req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            uploadedBy: req.user.id,
            description: req.body.description || ''
        }));

        project.files = project.files || [];
        project.files.push(...files);
        await project.save();

        res.json({
            success: true,
            message: 'Files uploaded successfully',
            files
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload files',
            error: error.message
        });
    }
});

// Add progress update
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

        // Check permissions
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

// Add discussion/comment to project
router.post('/:id/discussions', auth, async (req, res) => {
    try {
        const { title, message } = req.body;
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const discussion = {
            title,
            message,
            author: req.user.id,
            replies: []
        };

        project.discussions.push(discussion);
        await project.save();
        await project.populate('discussions.author', 'firstName lastName profilePicture');

        res.json({
            success: true,
            message: 'Discussion added successfully',
            discussion: project.discussions[project.discussions.length - 1]
        });
    } catch (err) {
        console.error('Add discussion error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to add discussion',
            error: err.message
        });
    }
});

// Get employee analytics
router.get('/analytics/employee/:employeeId', auth, async (req, res) => {
    try {
        const employeeId = req.params.employeeId;
        
        // Get all projects where employee is involved
        const projects = await Project.find({
            $or: [
                { members: employeeId },
                { createdBy: employeeId },
                { projectManager: employeeId }
            ]
        }).populate('members', 'firstName lastName')
          .populate('tasks.assignedTo', 'firstName lastName');

        // Calculate employee analytics
        const employeeProjects = projects;
        const employeeTasks = [];
        
        projects.forEach(project => {
            project.tasks.forEach(task => {
                if (task.assignedTo && task.assignedTo._id.toString() === employeeId) {
                    employeeTasks.push({
                        ...task.toObject(),
                        projectName: project.name,
                        projectId: project._id
                    });
                }
            });
        });

        const analytics = {
            overview: {
                totalProjects: employeeProjects.length,
                totalTasks: employeeTasks.length,
                completedTasks: employeeTasks.filter(t => t.status === 'Completed').length,
                inProgressTasks: employeeTasks.filter(t => t.status === 'In Progress').length,
                completionRate: employeeTasks.length > 0 ? 
                    Math.round((employeeTasks.filter(t => t.status === 'Completed').length / employeeTasks.length) * 100) : 0
            },
            taskDistribution: {
                byStatus: [
                    { name: 'Completed', value: employeeTasks.filter(t => t.status === 'Completed').length },
                    { name: 'In Progress', value: employeeTasks.filter(t => t.status === 'In Progress').length },
                    { name: 'Not Started', value: employeeTasks.filter(t => t.status === 'Not Started').length },
                    { name: 'On Hold', value: employeeTasks.filter(t => t.status === 'On Hold').length }
                ].filter(item => item.value > 0),
                byPriority: [
                    { name: 'Critical', value: employeeTasks.filter(t => t.priority === 'Critical').length },
                    { name: 'High', value: employeeTasks.filter(t => t.priority === 'High').length },
                    { name: 'Medium', value: employeeTasks.filter(t => t.priority === 'Medium').length },
                    { name: 'Low', value: employeeTasks.filter(t => t.priority === 'Low').length }
                ].filter(item => item.value > 0)
            },
            projectProgress: employeeProjects.map(project => ({
                name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
                progress: project.overallProgress || 0,
                tasksAssigned: project.tasks.filter(t => 
                    t.assignedTo && t.assignedTo._id.toString() === employeeId
                ).length
            })),
            workload: {
                totalEstimatedHours: employeeTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
                totalActualHours: employeeTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0)
            }
        };

        res.json({
            success: true,
            analytics,
            projects: employeeProjects,
            tasks: employeeTasks
        });
    } catch (err) {
        console.error('Get employee analytics error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to get employee analytics',
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

        // Check permissions
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

// Delete project
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

        // Delete associated files
        if (project.files && project.files.length > 0) {
            project.files.forEach(file => {
                try {
                    fs.unlinkSync(file.path);
                } catch (err) {
                    console.error('Error deleting file:', err);
                }
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
