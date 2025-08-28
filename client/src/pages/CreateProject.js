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