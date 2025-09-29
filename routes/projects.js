const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Employee = require('../models/Employee');
const emailService = require('../utils/emailService'); // ✅ ADD THIS LINE
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

// ✅ UPDATED: Create a new project with email notifications
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
            status: 'Planning',
            tasks: tasks?.map(task => ({
                title: task.title?.trim(),
                description: task.description?.trim() || '',
                assignedTo: task.assignedTo && isValidObjectId(task.assignedTo) ? task.assignedTo : null,
                priority: task.priority || 'Medium',
                status: 'Not Started'
            })) || []
        });

        await project.save();

        // ✅ POPULATE PROJECT WITH MEMBER DETAILS FOR EMAIL
        const populatedProject = await Project.findById(project._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('members', 'firstName lastName email')
            .populate('tasks.assignedTo', 'firstName lastName email');

        // ✅ SEND EMAIL NOTIFICATIONS TO PROJECT MEMBERS
        if (populatedProject.members && populatedProject.members.length > 1) {
            try {
                // Filter out the creator from the email list (they don't need to be notified)
                const membersToNotify = populatedProject.members.filter(
                    member => member._id.toString() !== req.user.id.toString()
                );
                
                if (membersToNotify.length > 0) {
                    await emailService.sendProjectCreationEmail(
                        membersToNotify,
                        populatedProject,
                        populatedProject.createdBy
                    );
                    console.log(`✅ Project creation emails sent to ${membersToNotify.length} team members`);
                }
            } catch (emailError) {
                console.error('❌ Failed to send project creation emails:', emailError);
                // Don't fail the project creation if email fails
            }
        }

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

// ✅ UPDATED: Add member to project with email notification
router.put('/:id/members', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { members } = req.body; // Array of member IDs
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid project ID format' });
        }

        const project = await Project.findById(id)
            .populate('createdBy', 'firstName lastName email');
            
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Find new members (those not already in the project)
        const currentMemberIds = project.members.map(m => m.toString());
        const newMemberIds = members.filter(memberId => 
            !currentMemberIds.includes(memberId.toString())
        );

        if (newMemberIds.length > 0) {
            // Add new members to project
            project.members = [...project.members, ...newMemberIds];
            await project.save();

            // ✅ SEND EMAIL NOTIFICATIONS TO NEW MEMBERS
            try {
                const newMembers = await Employee.find({ 
                    _id: { $in: newMemberIds } 
                }).select('firstName lastName email');
                
                const emailPromises = newMembers
                    .filter(member => member.email)
                    .map(member => 
                        emailService.sendProjectMemberAddedEmail(
                            member,
                            project,
                            project.createdBy
                        ).catch(error => {
                            console.error(`❌ Failed to send email to ${member.email}:`, error);
                            return null;
                        })
                    );

                await Promise.allSettled(emailPromises);
                console.log(`✅ Project member addition emails sent to ${newMembers.length} new team members`);
            } catch (emailError) {
                console.error('❌ Failed to send project member emails:', emailError);
            }
        } else {
            // Just update members list (might be removing members)
            project.members = members;
            await project.save();
        }

        // Return updated project
        const updatedProject = await Project.findById(id)
            .populate('createdBy', 'firstName lastName email')
            .populate('members', 'firstName lastName email')
            .populate('tasks.assignedTo', 'firstName lastName email');

        res.json({
            success: true,
            message: newMemberIds.length > 0 ? 
                `${newMemberIds.length} new members added to project` : 
                'Project members updated',
            project: updatedProject
        });
    } catch (err) {
        console.error('❌ Update project members error:', err);
        res.status(500).json({ error: 'Failed to update project members' });
    }
});

// ✅ UPDATED: Create new task with email notification
router.post('/:id/tasks', auth, upload.array('files', 5), multerErrorHandler, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid project ID format' });
        }

        const { title, description, assignedTo, priority, estimatedHours, dueDate } = req.body;
        const files = req.files || [];

        console.log('📝 Creating new task:', { title, assignedTo, priority });
        console.log('📎 Files uploaded:', files.length);

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Task title is required' });
        }

        const project = await Project.findById(id)
            .populate('createdBy', 'firstName lastName email');
        
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

        // ✅ SEND EMAIL NOTIFICATION TO ASSIGNED USER
        if (assignedTo && isValidObjectId(assignedTo)) {
            try {
                const assignedUser = await Employee.findById(assignedTo)
                    .select('firstName lastName email');
                
                if (assignedUser && assignedUser.email) {
                    const createdBy = await Employee.findById(req.user.id)
                        .select('firstName lastName email');
                    
                    const taskForEmail = {
                        ...newTask,
                        _id: project.tasks[project.tasks.length - 1]._id
                    };
                    
                    await emailService.sendTaskAssignmentEmail(
                        assignedUser,
                        taskForEmail,
                        createdBy
                    );
                    console.log(`✅ Task assignment email sent to ${assignedUser.email}`);
                }
            } catch (emailError) {
                console.error('❌ Failed to send task assignment email:', emailError);
            }
        }

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

// ✅ UPDATED: Update existing task with optional email notification
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

        const project = await Project.findById(id)
            .populate('tasks.assignedTo', 'firstName lastName email');
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const task = project.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Store original assignee for email comparison
        const originalAssignee = task.assignedTo;

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

        // ✅ SEND EMAIL IF ASSIGNEE CHANGED
        const newAssigneeId = task.assignedTo?.toString();
        const oldAssigneeId = originalAssignee?.toString();
        
        if (newAssigneeId && newAssigneeId !== oldAssigneeId) {
            try {
                const newAssignee = await Employee.findById(newAssigneeId)
                    .select('firstName lastName email');
                
                if (newAssignee && newAssignee.email) {
                    const updatedBy = await Employee.findById(req.user.id)
                        .select('firstName lastName email');
                    
                    await emailService.sendTaskAssignmentEmail(
                        newAssignee,
                        task,
                        updatedBy
                    );
                    console.log(`✅ Task reassignment email sent to ${newAssignee.email}`);
                }
            } catch (emailError) {
                console.error('❌ Failed to send task reassignment email:', emailError);
            }
        }

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

// Update task progress
router.post('/:id/tasks/:taskId/update', auth, upload.array('files', 5), multerErrorHandler, async (req, res) => {
    try {
        const { id, taskId } = req.params;
        
        console.log('🔄 Task update request received:', {
            projectId: id,
            taskId: taskId,
            body: req.body,
            files: req.files?.length || 0
        });

        if (!isValidObjectId(id) || !isValidObjectId(taskId)) {
            console.error('❌ Invalid ID format:', { id, taskId });
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const { status, progress, remarks, hoursWorked } = req.body;
        const files = req.files || [];

        console.log('📝 Update data:', { status, progress, remarks, hoursWorked, filesCount: files.length });

        const project = await Project.findById(id);
        if (!project) {
            console.error('❌ Project not found:', id);
            return res.status(404).json({ error: 'Project not found' });
        }

        const task = project.tasks.id(taskId);
        if (!task) {
            console.error('❌ Task not found in project:', { projectId: id, taskId });
            return res.status(404).json({ error: 'Task not found' });
        }

        console.log('📋 Current task status:', {
            currentStatus: task.status,
            currentProgress: task.progress,
            newStatus: status,
            newProgress: progress
        });

        // Update progress fields
        if (status !== undefined && status.trim()) {
            task.status = status.trim();
        }
        
        if (progress !== undefined) {
            const progressNum = parseInt(progress);
            if (!isNaN(progressNum)) {
                task.progress = Math.min(Math.max(progressNum, 0), 100);
            }
        }
        
        if (remarks && remarks.trim()) {
            task.remarks = remarks.trim();
        }
        
        if (hoursWorked !== undefined) {
            const hoursNum = parseFloat(hoursWorked);
            if (!isNaN(hoursNum) && hoursNum > 0) {
                task.hoursWorked = (task.hoursWorked || 0) + hoursNum;
            }
        }

        // Add progress files (if any)
        if (files.length > 0) {
            console.log('📎 Adding files:', files.map(f => f.originalname));
            
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
        
        // Save the project
        await project.save();

        console.log('✅ Task progress updated successfully:', {
            taskId,
            newStatus: task.status,
            newProgress: task.progress,
            filesAdded: files.length
        });

        // Return the updated task
        res.json({ 
            success: true, 
            message: 'Task updated successfully',
            task: {
                _id: task._id,
                title: task.title,
                status: task.status,
                progress: task.progress,
                remarks: task.remarks,
                hoursWorked: task.hoursWorked,
                lastUpdated: task.lastUpdated,
                files: task.files
            }
        });
    } catch (err) {
        console.error('❌ Update task progress error:', err);
        res.status(500).json({ 
            error: 'Failed to update task progress: ' + err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// PUT version of task update
router.put('/:id/tasks/:taskId/update', auth, upload.array('files', 5), multerErrorHandler, async (req, res) => {
    try {
        const { id, taskId } = req.params;
        
        console.log('🔄 Task update (PUT) request received:', {
            projectId: id,
            taskId: taskId
        });

        if (!isValidObjectId(id) || !isValidObjectId(taskId)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const { status, progress, remarks, hoursWorked } = req.body;
        const files = req.files || [];

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const task = project.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Update logic (same as POST)
        if (status !== undefined && status.trim()) task.status = status.trim();
        if (progress !== undefined) {
            const progressNum = parseInt(progress);
            if (!isNaN(progressNum)) {
                task.progress = Math.min(Math.max(progressNum, 0), 100);
            }
        }
        if (remarks && remarks.trim()) task.remarks = remarks.trim();
        if (hoursWorked !== undefined) {
            const hoursNum = parseFloat(hoursWorked);
            if (!isNaN(hoursNum) && hoursNum > 0) {
                task.hoursWorked = (task.hoursWorked || 0) + hoursNum;
            }
        }

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

        console.log('✅ Task progress updated successfully (PUT)');
        res.json({ 
            success: true, 
            message: 'Task updated successfully',
            task: {
                _id: task._id,
                title: task.title,
                status: task.status,
                progress: task.progress,
                remarks: task.remarks,
                hoursWorked: task.hoursWorked,
                lastUpdated: task.lastUpdated,
                files: task.files
            }
        });
    } catch (err) {
        console.error('❌ Update task progress error (PUT):', err);
        res.status(500).json({ 
            error: 'Failed to update task progress: ' + err.message
        });
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

// ✅ ADD TEST EMAIL ROUTE
router.post('/test-email', auth, async (req, res) => {
    try {
        const { email } = req.body;
        const testEmail = email || 'test@example.com';
        
        const result = await emailService.sendEmail(
            testEmail,
            'Test Email from WMS',
            '<h1>Test Email</h1><p>This is a test email from your Workforce Management System.</p><p>Email service is working correctly!</p>'
        );
        
        res.json({
            success: result.success,
            message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
            details: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error sending test email',
            error: error.message
        });
    }
});

// Error handler for routes not found
router.use('*', (req, res) => {
    console.log('❌ Route not found:', req.method, req.originalUrl);
    res.status(404).json({ 
        error: 'Route not found', 
        method: req.method,
        path: req.originalUrl,
        availableRoutes: [
            'GET /api/projects',
            'GET /api/projects/:id',
            'POST /api/projects',
            'POST /api/projects/:id/tasks',
            'POST /api/projects/:id/tasks/:taskId/update',
            'PUT /api/projects/:id/tasks/:taskId/update',
            'POST /api/projects/test-email'
        ]
    });
});

module.exports = router;
