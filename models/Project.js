/*const mongoose = require('mongoose');

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
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
      default: 'Not Started'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
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
