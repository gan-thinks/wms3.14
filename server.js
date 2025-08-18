const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workforce-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/Tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/password', require('./routes/passwordReset'));

// Health check route
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Server is up and running!' });
});

// Serve frontend (React) for all other routes
const clientPath = path.join(__dirname, 'client', 'public');
app.use(express.static(clientPath));

app.get('*', (req, res) => {
  // If request does not start with /api, serve React app
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientPath, 'index.html'));
  } else {
    res.status(404).json({ message: 'API route not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
