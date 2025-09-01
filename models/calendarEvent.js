const mongoose = require('mongoose');

// Reminder Schema
const reminderSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email', 'notification', 'popup'],
    default: 'notification'
  },
  minutesBefore: {
    type: Number,
    required: true,
    min: 0
  },
  sent: {
    type: Boolean,
    default: false
  }
});

// Calendar Event Schema
const calendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    default: '',
    maxLength: 1000
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['event', 'meeting', 'deadline', 'leave', 'holiday', 'personal'],
    default: 'event'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  location: {
    type: String,
    default: '',
    maxLength: 200
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  reminders: [reminderSchema],
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'weekly'
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    endDate: {
      type: Date,
      default: null
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: 50
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  meetingLink: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: '',
    maxLength: 2000
  }
}, {
  timestamps: true
});

// Indexes for better performance
calendarEventSchema.index({ start: 1, end: 1 });
calendarEventSchema.index({ createdBy: 1 });
calendarEventSchema.index({ attendees: 1 });
calendarEventSchema.index({ projectId: 1 });
calendarEventSchema.index({ type: 1 });
calendarEventSchema.index({ status: 1 });

// Virtual for duration
calendarEventSchema.virtual('duration').get(function() {
  if (this.allDay) return 'All Day';
  const duration = (this.end - this.start) / (1000 * 60); // Duration in minutes
  if (duration < 60) return `${duration} minutes`;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
});

// Virtual to check if event is upcoming
calendarEventSchema.virtual('isUpcoming').get(function() {
  return this.start > new Date();
});

// Virtual to check if event is ongoing
calendarEventSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.start <= now && this.end > now;
});

// Virtual to check if event is past
calendarEventSchema.virtual('isPast').get(function() {
  return this.end < new Date();
});

// Method to check if user is attending
calendarEventSchema.methods.isUserAttending = function(userId) {
  return this.attendees.some(attendee => 
    attendee.toString() === userId.toString()
  );
};

// Method to check if user can edit
calendarEventSchema.methods.canUserEdit = function(userId, userRole) {
  return this.createdBy.toString() === userId.toString() || userRole === 'admin';
};

// Method to get event for calendar display
calendarEventSchema.methods.toCalendarEvent = function() {
  return {
    id: this._id,
    title: this.title,
    start: this.start,
    end: this.end,
    allDay: this.allDay,
    backgroundColor: this.color,
    borderColor: this.color,
    textColor: this.getTextColor(),
    extendedProps: {
      description: this.description,
      type: this.type,
      priority: this.priority,
      status: this.status,
      location: this.location,
      attendees: this.attendees,
      projectId: this.projectId,
      isPrivate: this.isPrivate,
      meetingLink: this.meetingLink,
      notes: this.notes
    }
  };
};

// Method to get appropriate text color based on background
calendarEventSchema.methods.getTextColor = function() {
  // Simple algorithm to determine if text should be black or white
  const hex = this.color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

// Pre-save middleware
calendarEventSchema.pre('save', function(next) {
  // Ensure end date is after start date
  if (this.end <= this.start) {
    if (this.allDay) {
      // For all-day events, set end to end of start day
      this.end = new Date(this.start);
      this.end.setHours(23, 59, 59, 999);
    } else {
      // For timed events, set end to 1 hour after start
      this.end = new Date(this.start.getTime() + 60 * 60 * 1000);
    }
  }
  
  // Set color based on type and priority if not already set
  if (!this.color || this.color === '#3B82F6') {
    this.color = this.getDefaultColor();
  }
  
  next();
});

// Method to get default color based on type and priority
calendarEventSchema.methods.getDefaultColor = function() {
  if (this.priority === 'Critical') return '#DC2626'; // Red
  
  switch (this.type) {
    case 'meeting': return '#059669'; // Emerald
    case 'deadline': return '#DC2626'; // Red
    case 'leave': return '#7C3AED'; // Violet
    case 'holiday': return '#10B981'; // Green
    case 'personal': return '#8B5CF6'; // Purple
    case 'event':
    default:
      switch (this.priority) {
        case 'High': return '#F59E0B'; // Orange
        case 'Medium': return '#3B82F6'; // Blue
        case 'Low': return '#6B7280'; // Gray
        default: return '#3B82F6'; // Blue
      }
  }
};

// Static method to get events for date range
calendarEventSchema.statics.getEventsForRange = async function(startDate, endDate, userId = null) {
  let query = {
    $or: [
      {
        start: { $gte: startDate, $lte: endDate }
      },
      {
        end: { $gte: startDate, $lte: endDate }
      },
      {
        $and: [
          { start: { $lte: startDate } },
          { end: { $gte: endDate } }
        ]
      }
    ]
  };
  
  // If userId provided, filter for user's events
  if (userId) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { createdBy: userId },
        { attendees: { $in: [userId] } },
        { isPrivate: false }
      ]
    });
  }
  
  return this.find(query)
    .populate('createdBy', 'firstName lastName email')
    .populate('attendees', 'firstName lastName email')
    .populate('projectId', 'name')
    .sort({ start: 1 });
};

// Static method to get upcoming events for a user
calendarEventSchema.statics.getUpcomingEvents = async function(userId, limit = 10) {
  const now = new Date();
  return this.find({
    $or: [
      { createdBy: userId },
      { attendees: { $in: [userId] } }
    ],
    start: { $gte: now },
    status: { $ne: 'cancelled' }
  })
  .populate('createdBy', 'firstName lastName')
  .populate('projectId', 'name')
  .sort({ start: 1 })
  .limit(limit);
};

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);