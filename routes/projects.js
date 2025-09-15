
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
