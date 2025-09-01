/*
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

*/

const mongoose = require('mongoose');

// Task Schema with progress tracking
const taskSchema = new mongoose.Schema({
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
    },
    // New fields for enhanced task management
    tags: [{
        type: String
    }],
    comments: [{
        text: String,
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    attachments: [{
        filename: String,
        originalname: String,
        path: String,
        size: Number,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

// Daily Progress Update Schema
const progressUpdateSchema = new mongoose.Schema({
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
    taskUpdates: [{
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
    }],
    blockers: [{
        description: String,
        severity: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Medium'
        }
    }]
}, { timestamps: true });

// Project Schema with enhanced tracking
const projectSchema = new mongoose.Schema({
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
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
    }],
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
    },
    // New enhanced features
    files: [{
        filename: String,
        originalname: String,
        path: String,
        size: Number,
        mimetype: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        description: String
    }],
    tags: [{
        type: String
    }],
    milestones: [{
        title: String,
        description: String,
        dueDate: Date,
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: Date,
        completedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        }
    }],
    discussions: [{
        title: String,
        message: String,
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        },
        replies: [{
            message: String,
            author: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Employee'
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    settings: {
        isPublic: {
            type: Boolean,
            default: false
        },
        allowMemberInvites: {
            type: Boolean,
            default: true
        },
        notifications: {
            taskAssigned: { type: Boolean, default: true },
            taskCompleted: { type: Boolean, default: true },
            projectUpdates: { type: Boolean, default: true }
        }
    }
}, { 
    timestamps: true 
});

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

// Get project analytics
projectSchema.methods.getAnalytics = function() {
    const tasks = this.tasks;
    const members = this.members;
    
    return {
        overview: {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'Completed').length,
            inProgressTasks: tasks.filter(t => t.status === 'In Progress').length,
            notStartedTasks: tasks.filter(t => t.status === 'Not Started').length,
            onHoldTasks: tasks.filter(t => t.status === 'On Hold').length,
            overallProgress: this.overallProgress
        },
        timeTracking: {
            totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
            totalActualHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
            efficiency: 0 // Calculated later
        },
        taskDistribution: {
            byStatus: [
                { name: 'Not Started', value: tasks.filter(t => t.status === 'Not Started').length },
                { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
                { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length },
                { name: 'On Hold', value: tasks.filter(t => t.status === 'On Hold').length }
            ].filter(item => item.value > 0),
            byPriority: [
                { name: 'Low', value: tasks.filter(t => t.priority === 'Low').length },
                { name: 'Medium', value: tasks.filter(t => t.priority === 'Medium').length },
                { name: 'High', value: tasks.filter(t => t.priority === 'High').length },
                { name: 'Critical', value: tasks.filter(t => t.priority === 'Critical').length }
            ].filter(item => item.value > 0)
        },
        memberProgress: members.map(memberId => {
            const memberTasks = tasks.filter(t => t.assignedTo && t.assignedTo.toString() === memberId.toString());
            const completedTasks = memberTasks.filter(t => t.status === 'Completed').length;
            return {
                memberId,
                totalTasks: memberTasks.length,
                completedTasks,
                progress: memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0
            };
        })
    };
};

// Pre-save middleware to auto-calculate progress
projectSchema.pre('save', function(next) {
    this.updateStatus();
    next();
});

module.exports = mongoose.model('Project', projectSchema);
