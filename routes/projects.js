
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
    fs.mkdirSync(uploadDir, { recursive: true }); }

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

// ✅ REPLACE THE EXISTING UPDATE PROGRESS ROUTE IN YOUR routes/projects.js WITH THIS ONE

// ✅ FIXED: Update task progress with optional file upload - ADD BETTER ERROR HANDLING
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

// ✅ ADD THIS NEW ROUTE AS A FALLBACK (Add this AFTER the above route)
router.put('/:id/tasks/:taskId/update', auth, upload.array('files', 5), multerErrorHandler, async (req, res) => {
    // Same logic as POST but with PUT method
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

// ✅ ADD BETTER ERROR HANDLING - ADD THIS NEAR THE TOP OF YOUR FILE
const handleAsyncRoute = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ✅ ADD BETTER 404 HANDLER - ADD THIS AT THE END OF YOUR routes/projects.js FILE
router.use('*', (req, res) => {
    console.log('❌ Route not found:', req.method, req.originalUrl);
    res.status(404).json({ 
        error: 'Route not found', 
        method: req.method,
        path: req.originalUrl,
        availableRoutes: [
            'GET /api/projects',
            'GET /api/projects/:id',
            'POST /api/projects/:id/tasks/:taskId/update',
            'PUT /api/projects/:id/tasks/:taskId/update'
        ]
    });
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
