/* /*const mongoose = require('mongoose');

// ✅ Task Schema (Embedded in Project)
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: false, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    dueDate: { type: Date }
  },
  { timestamps: true } // track when each task is created/updated
);

// ✅ Project Schema
const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    tasks: [taskSchema] // ✅ Embedded tasks inside project
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
*/

/*
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null, // Optional
    },
  },
  { _id: false } // Prevents creation of a separate _id for each task
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: false, // Optional for now
      },
    ],
    tasks: [taskSchema], // Array of task objects
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Project', projectSchema);

*/


const mongoose = require('mongoose');

// Task Schema with progress tracking
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
      default: 'Not Started'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    dueDate: {
      type: Date,
      default: null
    },
    estimatedHours: {
      type: Number,
      default: 0
    },
    actualHours: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Daily Progress Update Schema
const progressUpdateSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    overallProgress: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    remarks: {
      type: String,
      trim: true,
      maxLength: 500
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    taskUpdates: [
      {
        taskId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },
        progress: {
          type: Number,
          min: 0,
          max: 100
        },
        hoursWorked: {
          type: Number,
          default: 0
        },
        status: {
          type: String,
          enum: ['Not Started', 'In Progress', 'Completed', 'On Hold']
        },
        notes: String
      }
    ],
    blockers: [
      {
        description: String,
        severity: {
          type: String,
          enum: ['Low', 'Medium', 'High', 'Critical'],
          default: 'Medium'
        }
      }
    ]
  },
  { timestamps: true }
);

// Project Schema with enhanced tracking
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
      default: 'Planning'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],
    tasks: [taskSchema],
    progressUpdates: [progressUpdateSchema],
    startDate: {
      type: Date,
      default: Date.now
    },
    expectedEndDate: {
      type: Date,
      default: null
    },
    actualEndDate: {
      type: Date,
      default: null
    },
    budget: {
      type: Number,
      default: 0
    },
    actualCost: {
      type: Number,
      default: 0
    },
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastProgressUpdate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

// Calculate overall progress based on task completion
projectSchema.methods.calculateProgress = function() {
  if (this.tasks.length === 0) return 0;
  
  const totalProgress = this.tasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(totalProgress / this.tasks.length);
};

// Update project status based on progress
projectSchema.methods.updateStatus = function() {
  const progress = this.calculateProgress();
  
  if (progress === 0) {
    this.status = 'Planning';
  } else if (progress === 100) {
    this.status = 'Completed';
    this.actualEndDate = new Date();
  } else {
    this.status = 'In Progress';
  }
  
  this.overallProgress = progress;
  this.lastProgressUpdate = new Date();
};

// Pre-save middleware to auto-calculate progress
projectSchema.pre('save', function(next) {
  this.updateStatus();
  next();
});

module.exports = mongoose.model('Project', projectSchema);