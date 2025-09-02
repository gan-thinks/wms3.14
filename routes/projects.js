/*
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

*/

/*
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// File upload configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Create notification helper
const createNotification = async (userId, title, message, type, link, projectId = null, relatedUser = null) => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      link,
      relatedProject: projectId,
      relatedUser: relatedUser
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// Create a new project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, tasks, members } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = new Project({
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: req.user.id,
      members: members || [req.user.id],
      tasks: tasks || []
    });

    await project.save();

    // Create notifications for assigned members
    if (members && members.length > 0) {
      for (const memberId of members) {
        if (memberId !== req.user.id) {
          await createNotification(
            memberId,
            'Project Assignment',
            `You have been assigned to project: ${project.name}`,
            'project_assigned',
            `/projects/${project._id}`,
            project._id,
            req.user.id
          );
        }
      }
    }

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
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'firstName lastName email role')
      .populate('members', 'firstName lastName email role')
      .populate('tasks.assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log(`✅ Fetched ${projects.length} projects`);
    res.json(projects);
  } catch (err) {
    console.error('❌ Get projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email role')
      .populate('members', 'firstName lastName email role')
      .populate('tasks.assignedTo', 'firstName lastName email')
      .populate('remarks.user', 'firstName lastName')
      .populate('updates.user', 'firstName lastName');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    console.error('❌ Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Get project for editing
router.get('/:id/edit', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate('tasks.assignedTo', 'firstName lastName email')
      .populate('remarks.user', 'firstName lastName');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check permissions
    const userId = req.user.id;
    const isCreator = project.createdBy._id.toString() === userId;
    const isMember = project.members.some(m => m._id.toString() === userId);
    
    if (!isCreator && !isMember) {
      return res.status(403).json({ error: 'Not authorized to edit this project' });
    }
    
    res.json(project);
  } catch (err) {
    console.error('Get project for edit error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const userId = req.user.id;
    const userInfo = await Employee.findById(userId, 'firstName lastName');
    const isCreator = project.createdBy.toString() === userId;
    const isMember = project.members.some(m => m.toString() === userId);

    if (!isCreator && !isMember) {
      return res.status(403).json({ error: 'Not authorized to edit this project' });
    }

    let updatesMade = [];

    // Creator can edit core details
    if (isCreator) {
      if (req.body.name && req.body.name !== project.name) {
        project.name = req.body.name.trim();
        updatesMade.push('Project name updated');
      }
      
      if (req.body.description !== undefined && req.body.description !== project.description) {
        project.description = req.body.description.trim();
        updatesMade.push('Project description updated');
      }
      
      if (req.body.members && JSON.stringify(req.body.members) !== JSON.stringify(project.members.map(m => m.toString()))) {
        const newMembers = req.body.members.filter(m => !project.members.map(mem => mem.toString()).includes(m));
        project.members = req.body.members;
        updatesMade.push('Project members updated');
        
        // Notify new members
        for (const memberId of newMembers) {
          await createNotification(
            memberId,
            'Project Assignment',
            `You have been assigned to project: ${project.name}`,
            'project_assigned',
            `/projects/${project._id}`,
            project._id,
            userId
          );
        }
      }
      
      if (req.body.progress !== undefined && req.body.progress !== project.progress) {
        project.progress = req.body.progress;
        updatesMade.push(`Progress updated to ${req.body.progress}%`);
      }
    }

    // Members can update tasks assigned to them
    if (req.body.tasks && (isCreator || isMember)) {
      req.body.tasks.forEach(taskUpdate => {
        const taskIndex = project.tasks.findIndex(t => t._id.toString() === taskUpdate._id);
        if (taskIndex !== -1) {
          const task = project.tasks[taskIndex];
          if (isCreator || (task.assignedTo && task.assignedTo.toString() === userId)) {
            Object.assign(task, taskUpdate);
            updatesMade.push(`Task "${task.title}" updated`);
          }
        }
      });
    }

    // Add new remark/comment
    if (req.body.remark && req.body.remark.trim()) {
      project.remarks.push({
        user: userId,
        userName: `${userInfo.firstName} ${userInfo.lastName}`,
        message: req.body.remark.trim(),
        date: new Date()
      });
      updatesMade.push('New comment added');
    }

    // Add update log
    if (updatesMade.length > 0) {
      project.updates.push({
        type: 'general',
        description: updatesMade.join(', '),
        user: userId,
        date: new Date()
      });

      // Notify all members about the update (except the person making the update)
      const allMembers = [...project.members, project.createdBy].filter(m => m.toString() !== userId);
      for (const memberId of allMembers) {
        await createNotification(
          memberId,
          'Project Updated',
          `Project "${project.name}" has been updated: ${updatesMade.join(', ')}`,
          'project_updated',
          `/projects/${project._id}`,
          project._id,
          userId
        );
      }
    }

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate('tasks.assignedTo', 'firstName lastName email')
      .populate('remarks.user', 'firstName lastName')
      .populate('updates.user', 'firstName lastName');

    res.json({ success: true, project: updatedProject });
  } catch (err) {
    console.error('❌ Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
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

// Upload file to project
router.post('/:id/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const userId = req.user.id;
    const isCreator = project.createdBy.toString() === userId;
    const isMember = project.members.some(m => m.toString() === userId);

    if (!isCreator && !isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    project.files.push({
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: userId
    });

    await project.save();
    res.json({ success: true, file: project.files[project.files.length - 1] });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;

*/

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// File upload configuration
const uploadDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for allowed file types
const fileFilter = function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type! Only images, documents, and archives allowed.'));
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 5 // Maximum 5 files
    },
    fileFilter: fileFilter
});

// Multer error handler middleware
const multerErrorHandler = function (err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum 10MB allowed.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum 5 files allowed.' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
};

// Helper function to validate ObjectId
const isValidObjectId = function (id) {
    return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

// ✅ ADDED: Create a new project
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, tasks, members } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        console.log('📝 Creating new project:', { name, members: members?.length || 0, tasks: tasks?.length || 0 });

        const project = new Project({
            name: name.trim(),
            description: description?.trim() || '',
            createdBy: req.user.id,
            members: members || [req.user.id],
            status: 'Planning', // ✅ Now valid enum value
            tasks: tasks?.map(task => ({
                title: task.title?.trim(),
                description: task.description?.trim() || '',
                assignedTo: task.assignedTo && isValidObjectId(task.assignedTo) ? task.assignedTo : null,
                priority: task.priority || 'Medium',
                status: 'Not Started'
            })) || []
        });

        await project.save();

        const populatedProject = await Project.findById(project._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('members', 'firstName lastName email')
            .populate('tasks.assignedTo', 'firstName lastName email');

        console.log('✅ Project created successfully:', project.name);
        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            project: populatedProject
        });
    } catch (err) {
        console.error('❌ Create project error:', err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Get all projects
router.get('/', auth, async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('createdBy', 'firstName lastName email role')
            .populate('members', 'firstName lastName email role')
            .populate('tasks.assignedTo', 'firstName lastName email')
            .sort({ createdAt: -1 });

        console.log(`✅ Fetched ${projects.length} projects`);
        res.json(projects);
    } catch (err) {
        console.error('❌ Get projects error:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get single project by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid project ID format' });
        }

        const project = await Project.findById(id)
            .populate('createdBy', 'firstName lastName email role')
            .populate('members', 'firstName lastName email role')
            .populate('tasks.assignedTo', 'firstName lastName email')
            .populate('remarks.user', 'firstName lastName')
            .populate('updates.user', 'firstName lastName');

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        console.log('✅ Project found:', project.name);
        res.json(project);
    } catch (err) {
        console.error('❌ Get project error:', err);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Get project for editing
router.get('/:id/edit', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid project ID format' });
        }
        
        const project = await Project.findById(id)
            .populate('createdBy', 'firstName lastName email')
            .populate('members', 'firstName lastName email')
            .populate('tasks.assignedTo', 'firstName lastName email')
            .populate('remarks.user', 'firstName lastName');
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check permissions
        const userId = req.user.id;
        const isCreator = project.createdBy._id.toString() === userId;
        const isMember = project.members.some(m => m._id.toString() === userId);
        
        if (!isCreator && !isMember) {
            return res.status(403).json({ error: 'Not authorized to edit this project' });
        }
        
        console.log('✅ Project found for editing:', project.name);
        res.json(project);
    } catch (err) {
        console.error('❌ Get project for edit error:', err);
        res.status(500).json({ error: 'Failed to fetch project for editing' });
    }
});

// ✅ FIXED: Create new task with optional file upload
router.post('/:id/tasks', auth, upload.array('files', 5), multerErrorHandler, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid project ID format' });
        }

        const { title, description, assignedTo, priority, estimatedHours, dueDate } = req.body;
        const files = req.files || []; // Files are optional

        console.log('📝 Creating new task:', { title, assignedTo, priority });
        console.log('📎 Files uploaded:', files.length);

        // Validation - only title is required
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Task title is required' });
        }

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Create new task
        const newTask = {
            title: title.trim(),
            description: description ? description.trim() : '',
            assignedTo: assignedTo && isValidObjectId(assignedTo) ? assignedTo : null,
            priority: priority || 'Medium',
            estimatedHours: parseFloat(estimatedHours) || 0,
            dueDate: dueDate ? new Date(dueDate) : null,
            files: files.map(file => ({
                name: file.originalname,
                url: `/uploads/${file.filename}`,
                size: file.size,
                uploadedAt: new Date()
            })),
            status: 'Not Started',
            progress: 0,
            createdAt: new Date()
        };

        project.tasks.push(newTask);
        await project.save();

        // Populate the response
        const populatedProject = await Project.findById(id)
            .populate('tasks.assignedTo', 'firstName lastName email');
        
        const createdTask = populatedProject.tasks[populatedProject.tasks.length - 1];

        console.log('✅ Task created successfully');
        res.status(201).json({ success: true, task: createdTask });
    } catch (err) {
        console.error('❌ Create task error:', err);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// ✅ FIXED: Update existing task with optional file upload
router.put('/:id/tasks/:taskId', auth, upload.array('files', 5), multerErrorHandler, async (req, res) => {
    try {
        const { id, taskId } = req.params;
        
        if (!isValidObjectId(id) || !isValidObjectId(taskId)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const { title, description, assignedTo, priority, estimatedHours, dueDate } = req.body;
        const files = req.files || [];

        console.log('📝 Updating task:', taskId);
        console.log('📎 New files:', files.length);

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const task = project.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Update task fields
        if (title !== undefined) task.title = title.trim();
        if (description !== undefined) task.description = description.trim();
        if (assignedTo !== undefined) {
            task.assignedTo = assignedTo && isValidObjectId(assignedTo) ? assignedTo : null;
        }
        if (priority !== undefined) task.priority = priority;
        if (estimatedHours !== undefined) task.estimatedHours = parseFloat(estimatedHours) || 0;
        if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

        // Add new files (if any)
        if (files.length > 0) {
            const newFiles = files.map(file => ({
                name: file.originalname,
                url: `/uploads/${file.filename}`,
                size: file.size,
                uploadedAt: new Date()
            }));
            
            if (!task.files) task.files = [];
            task.files = task.files.concat(newFiles);
        }

        task.updatedAt = new Date();
        await project.save();

        // Return updated task with populated data
        const populatedProject = await Project.findById(id)
            .populate('tasks.assignedTo', 'firstName lastName email');
        
        const updatedTask = populatedProject.tasks.id(taskId);

        console.log('✅ Task updated successfully');
        res.json({ success: true, task: updatedTask });
    } catch (err) {
        console.error('❌ Update task error:', err);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// ✅ FIXED: Update task progress with optional file upload
router.post('/:id/tasks/:taskId/update', auth, upload.array('files', 5), multerErrorHandler, async (req, res) => {
    try {
        const { id, taskId } = req.params;
        
        if (!isValidObjectId(id) || !isValidObjectId(taskId)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const { status, progress, remarks, hoursWorked } = req.body;
        const files = req.files || [];

        console.log('🔄 Updating task progress:', taskId);

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const task = project.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Update progress fields
        if (status !== undefined) task.status = status;
        if (progress !== undefined) task.progress = Math.min(Math.max(parseInt(progress) || 0, 0), 100);
        if (remarks && remarks.trim()) task.remarks = remarks.trim();
        if (hoursWorked !== undefined) {
            task.hoursWorked = (task.hoursWorked || 0) + (parseFloat(hoursWorked) || 0);
        }

        // Add progress files (if any)
        if (files.length > 0) {
            const progressFiles = files.map(file => ({
                name: file.originalname,
                url: `/uploads/${file.filename}`,
                size: file.size,
                type: 'progress',
                uploadedAt: new Date()
            }));
            
            if (!task.files) task.files = [];
            task.files = task.files.concat(progressFiles);
        }

        task.lastUpdated = new Date();
        await project.save();

        console.log('✅ Task progress updated successfully');
        res.json({ success: true, task });
    } catch (err) {
        console.error('❌ Update task progress error:', err);
        res.status(500).json({ error: 'Failed to update task progress' });
    }
});

// Delete task
router.delete('/:id/tasks/:taskId', auth, async (req, res) => {
    try {
        const { id, taskId } = req.params;
        
        if (!isValidObjectId(id) || !isValidObjectId(taskId)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const task = project.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Delete associated files (optional)
        if (task.files && task.files.length > 0) {
            task.files.forEach(file => {
                const filePath = path.join(__dirname, '..', file.url);
                fs.unlink(filePath, (err) => {
                    if (err) console.log('File deletion error:', err);
                });
            });
        }

        project.tasks.pull({ _id: taskId });
        await project.save();

        console.log('✅ Task deleted successfully');
        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (err) {
        console.error('❌ Delete task error:', err);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router;
