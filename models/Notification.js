const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['project_assigned', 'task_assigned', 'project_updated', 'task_completed', 'comment_added'],
    required: true 
  },
  link: { type: String },
  read: { type: Boolean, default: false },
  relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
