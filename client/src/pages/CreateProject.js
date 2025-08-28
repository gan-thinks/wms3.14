/*import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CreateProject() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch employee list for task assignment
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/employees/list/all', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const employees = Array.isArray(response.data) ? response.data : [];
        setAllEmployees(employees);
        console.log('✅ Employees fetched:', employees.length);
      } catch (err) {
        console.error('❌ Error fetching employees:', err);
        setAllEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  const addTask = () => {
    setTasks((prev) => [...prev, { 
      title: '', 
      description: '', 
      assignedTo: '' 
    }]);
  };

  const updateTask = (idx, field, value) => {
    setTasks((prev) =>
      prev.map((task, i) => (i === idx ? { ...task, [field]: value } : task))
    );
  };

  const removeTask = (idx) => {
    setTasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const err = {};
    
    if (!name.trim()) {
      err.name = 'Project name is required';
    }
    
    tasks.forEach((task, i) => {
      if (!task.title.trim()) {
        err[`task_${i}`] = 'Task title is required';
      }
    });
    
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      console.log('❌ Validation failed');
      return;
    }

    // Clean and prepare tasks
    const cleanedTasks = tasks.map((task) => ({
      title: task.title.trim(),
      description: task.description?.trim() || '',
      ...(task.assignedTo && { assignedTo: task.assignedTo })
    }));

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const payload = {
        name: name.trim(),
        description: description.trim(),
        tasks: cleanedTasks,
      };

      console.log('📤 Creating project:', payload);

      const response = await axios.post('/api/projects', payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('✅ Project created successfully:', response.data);
      alert('✅ Project created successfully!');
      navigate('/projects');

    } catch (err) {
      console.error('❌ Create project error:', err);
      
      // Better error handling
      if (err.response?.data?.error) {
        alert(`❌ Error: ${err.response.data.error}`);
      } else if (err.response?.status === 401) {
        alert('❌ Authentication failed. Please login again.');
        navigate('/login');
      } else {
        alert('❌ Failed to create project. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Create New Project</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        // Project Name 
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter project name"
            required
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        // Project Description 
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter project description"
            rows="3"
          />
        </div>

        // Project Tasks 
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Project Tasks</h3>
          
          {tasks.length === 0 && (
            <p className="text-gray-500 mb-4">No tasks added yet. Click "Add Task" to get started.</p>
          )}

          {tasks.map((task, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
              <div className="space-y-3">
                // Task Title 
                <div>
                  <input
                    type="text"
                    placeholder="Task title *"
                    value={task.title}
                    onChange={(e) => updateTask(idx, 'title', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors[`task_${idx}`] && (
                    <p className="text-red-600 text-sm mt-1">{errors[`task_${idx}`]}</p>
                  )}
                </div>

                // Task Description 
                <div>
                  <textarea
                    placeholder="Task description (optional)"
                    value={task.description}
                    onChange={(e) => updateTask(idx, 'description', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                </div>

                //Assign Member 
                <div>
                  <select
                    value={task.assignedTo}
                    onChange={(e) => updateTask(idx, 'assignedTo', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">👤 Assign member (optional)</option>
                    {allEmployees.length > 0 ? (
                      allEmployees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.role})
                        </option>
                      ))
                    ) : (
                      <option disabled>No employees available</option>
                    )}
                  </select>
                </div>

                // Remove Task Button 
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeTask(idx)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    🗑️ Remove Task
                  </button>
                </div>
              </div>
            </div>
          ))}

          // Add Task Button 
          <button
            type="button"
            onClick={addTask}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
          >
            ➕ Add Task
          </button>
        </div>

        // Submit Button 
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition duration-200 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? '⏳ Creating Project...' : '✅ Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
*/


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const projectRoutes = require('./routes/projects');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes);

// Dashboard endpoint with comprehensive data
app.get('/api/dashboard', async (req, res) => {
  try {
    // Import models
    const Employee = require('./models/Employee');
    const Project = require('./models/Project');
    
    // Parallel data fetching for better performance
    const [
      employeeCount,
      totalProjects,
      activeProjects,
      completedProjects,
      projects,
      recentProjects
    ] = await Promise.all([
      Employee.countDocuments(),
      Project.countDocuments(),
      Project.countDocuments({ status: { $in: ['In Progress', 'Planning'] } }),
      Project.countDocuments({ status: 'Completed' }),
      Project.find().select('name overallProgress status tasks').limit(10),
      Project.find()
        .populate('createdBy', 'firstName lastName')
        .select('name status lastProgressUpdate createdBy')
        .sort({ lastProgressUpdate: -1 })
        .limit(5)
    ]);

    // Calculate task completion stats
    let totalTasks = 0;
    let completedTasks = 0;
    
    projects.forEach(project => {
      if (project.tasks && project.tasks.length > 0) {
        totalTasks += project.tasks.length;
        completedTasks += project.tasks.filter(task => task.status === 'Completed').length;
      }
    });

    // Prepare project status data for charts
    const projectStatus = projects
      .filter(p => p.name)
      .map(p => ({
        project: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        completion: p.overallProgress || 0,
        status: p.status
      }));

    // Mock attendance data (replace with real data from your attendance system)
    const attendanceData = {
      present: Math.floor(Math.random() * 40) + 35, // 35-75
      absent: Math.floor(Math.random() * 8) + 2,    // 2-10  
      late: Math.floor(Math.random() * 12) + 3      // 3-15
    };

    // Calculate average project progress
    const avgProgress = projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.overallProgress || 0), 0) / projects.length)
      : 0;

    // Prepare latest updates
    const latestUpdates = recentProjects
      .filter(p => p.lastProgressUpdate)
      .map(p => ({
        name: p.name,
        status: p.status,
        lastActivity: p.lastProgressUpdate,
        updatedBy: p.createdBy ? `${p.createdBy.firstName} ${p.createdBy.lastName}` : 'Unknown'
      }));

    // Project status distribution
    const statusDistribution = [
      { status: 'Planning', count: await Project.countDocuments({ status: 'Planning' }) },
      { status: 'In Progress', count: await Project.countDocuments({ status: 'In Progress' }) },
      { status: 'Completed', count: await Project.countDocuments({ status: 'Completed' }) },
      { status: 'On Hold', count: await Project.countDocuments({ status: 'On Hold' }) },
      { status: 'Cancelled', count: await Project.countDocuments({ status: 'Cancelled' }) }
    ].filter(item => item.count > 0);

    // Response data
    const dashboardData = {
      // Main metrics
      employees: employeeCount,
      projects: activeProjects,
      totalProjects: totalProjects,
      completedProjects: completedProjects,
      tasksCompleted: completedTasks,
      totalTasks: totalTasks,
      avgProgress: avgProgress,
      
      // Mock data (replace with real data)
      leaves: Math.floor(Math.random() * 15) + 5,
      
      // Chart data
      projectStatus: projectStatus,
      statusDistribution: statusDistribution,
      
      // Attendance data
      attendance: attendanceData,
      
      // Recent activity
      latestUpdates: latestUpdates,
      
      // Additional metrics
      metrics: {
        projectsThisMonth: await Project.countDocuments({
          createdAt: { 
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
          }
        }),
        completionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
        activeTasksCount: totalTasks - completedTasks,
        overdueTasks: 0 // Implement based on your task due date logic
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Dashboard endpoint error:', error);
    res.status(500).json({ 
      message: 'Failed to load dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Reports endpoint (basic implementation)
app.get('/api/reports', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const Project = require('./models/Project');
    const Employee = require('./models/Employee');

    let reportData = {};

    switch (type) {
      case 'projects':
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
        
        reportData = await Project.find(
          Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}
        )
        .populate('createdBy', 'firstName lastName')
        .populate('members', 'firstName lastName')
        .select('name status overallProgress createdAt members tasks');
        break;
        
      case 'employees':
        reportData = await Employee.find()
        .select('firstName lastName email department position createdAt');
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({
      success: true,
      type: type,
      data: reportData,
      generatedAt: new Date(),
      count: reportData.length
    });
  } catch (error) {
    console.error('❌ Reports endpoint error:', error);
    res.status(500).json({ 
      message: 'Failed to generate report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchRegex = new RegExp(q, 'i');
    let results = {};

    if (!type || type === 'projects') {
      const Project = require('./models/Project');
      results.projects = await Project.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      })
      .populate('createdBy', 'firstName lastName')
      .select('name description status overallProgress createdAt createdBy')
      .limit(10);
    }

    if (!type || type === 'employees') {
      const Employee = require('./models/Employee');
      results.employees = await Employee.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { department: searchRegex }
        ]
      })
      .select('firstName lastName email department position')
      .limit(10);
    }

    res.json({
      success: true,
      query: q,
      results: results
    });
  } catch (error) {
    console.error('❌ Search endpoint error:', error);
    res.status(500).json({ 
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors: errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate field value',
      field: Object.keys(err.keyValue)[0]
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    message: `API route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/dashboard',
      'GET /api/reports',
      'GET /api/search',
      'POST /api/auth/login',
      'POST /api/auth/signup',
      'GET /api/employees',
      'GET /api/projects'
    ]
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💀 Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('💀 Process terminated');
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📊 Dashboard available at: http://localhost:${PORT}/api/dashboard`);
  console.log(`💾 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Connection string missing'}`);
});

// Set server timeout
server.timeout = 10000; // 10 seconds

module.exports = app;