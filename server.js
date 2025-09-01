
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const projectRoutes = require('./routes/projects'); // Add this line

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes); // Add this line

// Dashboard route (you can enhance this with real data)
app.get('/api/dashboard', async (req, res) => {
  try {
    const Employee = require('./models/Employee');
    const Project = require('./models/Project');
    
    // Get basic counts
    const employeeCount = await Employee.countDocuments();
    const projectCount = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ 
      status: { $in: ['In Progress', 'Planning'] } 
    });
    const completedTasks = await Project.aggregate([
      { $unwind: '$tasks' },
      { $match: { 'tasks.status': 'Completed' } },
      { $count: 'count' }
    ]);

    // Get project progress data for charts
    const projects = await Project.find()
      .select('name overallProgress status lastProgressUpdate')
      .limit(10);

    const projectStatus = projects.map(p => ({
      project: p.name.substring(0, 15) + (p.name.length > 15 ? '...' : ''),
      completion: p.overallProgress || 0
    }));

    // Mock attendance data (you can replace with real data)
    const attendance = {
      present: Math.floor(Math.random() * 50) + 30,
      absent: Math.floor(Math.random() * 10) + 2,
      late: Math.floor(Math.random() * 15) + 3
    };

    // Get latest project updates
    const latestUpdates = await Project.find({ lastProgressUpdate: { $exists: true } })
      .select('name status lastProgressUpdate')
      .sort({ lastProgressUpdate: -1 })
      .limit(5);

    res.json({
      employees: employeeCount,
      projects: activeProjects,
      tasksCompleted: completedTasks[0]?.count || 0,
      leaves: Math.floor(Math.random() * 20) + 5, // Mock data
      projectStatus,
      attendance,
      latestUpdates: latestUpdates.map(p => ({
        name: p.name,
        status: p.status,
        lastActivity: p.lastProgressUpdate
      }))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
