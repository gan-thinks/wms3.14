const express = require('express');
const router = express.Router();
const CalendarEvent = require('../models/CalendarEvent');
const Project = require('../models/Project');
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth');

// Get all calendar events and tasks
router.get('/events', auth, async (req, res) => {
  try {
    const { start, end, type, projectId, userId } = req.query;
    
    let query = {};
    
    // Date range filter
    if (start && end) {
      query.$or = [
        {
          start: {
            $gte: new Date(start),
            $lte: new Date(end)
          }
        },
        {
          end: {
            $gte: new Date(start),
            $lte: new Date(end)
          }
        },
        {
          $and: [
            { start: { $lte: new Date(start) } },
            { end: { $gte: new Date(end) } }
          ]
        }
      ];
    }
    
    // Type filter
    if (type) {
      query.type = type;
    }
    
    // Project filter
    if (projectId) {
      query.projectId = projectId;
    }
    
    // User filter (events created by or attending)
    if (userId) {
      query.$or = [
        { createdBy: userId },
        { attendees: { $in: [userId] } }
      ];
    }

    const events = await CalendarEvent.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .populate('projectId', 'name')
      .sort({ start: 1 });

    res.json({
      success: true,
      events: events.map(event => ({
        id: event._id,
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        type: event.type,
        priority: event.priority,
        createdBy: event.createdBy,
        attendees: event.attendees,
        projectId: event.projectId,
        reminders: event.reminders,
        backgroundColor: getEventColor(event.type, event.priority),
        borderColor: getEventColor(event.type, event.priority),
        extendedProps: {
          description: event.description,
          type: event.type,
          priority: event.priority,
          attendees: event.attendees,
          projectId: event.projectId,
          reminders: event.reminders
        }
      }))
    });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar events',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get events with tasks from projects
router.get('/events-with-tasks', auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    // Get calendar events
    const eventsQuery = {};
    if (start && end) {
      eventsQuery.start = { $gte: new Date(start), $lte: new Date(end) };
    }
    
    const calendarEvents = await CalendarEvent.find(eventsQuery)
      .populate('createdBy', 'firstName lastName')
      .populate('attendees', 'firstName lastName')
      .populate('projectId', 'name');

    // Get project tasks with due dates
    const projects = await Project.find({
      'tasks.dueDate': { $exists: true, $ne: null }
    })
    .populate('tasks.assignedTo', 'firstName lastName')
    .populate('createdBy', 'firstName lastName');

    let taskEvents = [];
    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.dueDate && (!start || !end || 
            (new Date(task.dueDate) >= new Date(start) && new Date(task.dueDate) <= new Date(end)))) {
          taskEvents.push({
            id: `task-${task._id}`,
            title: `Task: ${task.title}`,
            start: task.dueDate,
            allDay: true,
            backgroundColor: getTaskColor(task.priority, task.status),
            borderColor: getTaskColor(task.priority, task.status),
            extendedProps: {
              type: 'task',
              task: task.toObject(),
              project: { _id: project._id, name: project.name },
              assignee: task.assignedTo,
              priority: task.priority,
              status: task.status,
              progress: task.progress
            }
          });
        }
      });
    });

    // Combine events
    const allEvents = [
      ...calendarEvents.map(event => ({
        id: event._id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        backgroundColor: getEventColor(event.type, event.priority),
        borderColor: getEventColor(event.type, event.priority),
        extendedProps: {
          type: event.type || 'event',
          description: event.description,
          priority: event.priority,
          attendees: event.attendees,
          projectId: event.projectId
        }
      })),
      ...taskEvents
    ];

    res.json({
      success: true,
      events: allEvents
    });
  } catch (error) {
    console.error('Get events with tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create new calendar event
router.post('/events', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      start,
      end,
      allDay,
      type,
      priority,
      attendees,
      projectId,
      reminders
    } = req.body;

    // Validate required fields
    if (!title || !start) {
      return res.status(400).json({
        success: false,
        message: 'Title and start date are required'
      });
    }

    // Validate attendees exist
    if (attendees && attendees.length > 0) {
      const attendeeCount = await Employee.countDocuments({ 
        _id: { $in: attendees } 
      });
      if (attendeeCount !== attendees.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more attendees not found'
        });
      }
    }

    // Validate project exists
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(400).json({
          success: false,
          message: 'Project not found'
        });
      }
    }

    const event = new CalendarEvent({
      title: title.trim(),
      description: description ? description.trim() : '',
      start: new Date(start),
      end: end ? new Date(end) : new Date(start),
      allDay: allDay || false,
      type: type || 'event',
      priority: priority || 'Medium',
      createdBy: req.user.id,
      attendees: attendees || [],
      projectId: projectId || null,
      reminders: reminders || []
    });

    await event.save();

    // Populate the saved event
    await event.populate([
      { path: 'createdBy', select: 'firstName lastName email' },
      { path: 'attendees', select: 'firstName lastName email' },
      { path: 'projectId', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        type: event.type,
        priority: event.priority,
        createdBy: event.createdBy,
        attendees: event.attendees,
        projectId: event.projectId,
        reminders: event.reminders
      }
    });
  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update calendar event
router.put('/events/:id', auth, async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permissions (creator or admin)
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this event'
      });
    }

    const {
      title,
      description,
      start,
      end,
      allDay,
      type,
      priority,
      attendees,
      projectId,
      reminders
    } = req.body;

    // Validate attendees exist
    if (attendees && attendees.length > 0) {
      const attendeeCount = await Employee.countDocuments({ 
        _id: { $in: attendees } 
      });
      if (attendeeCount !== attendees.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more attendees not found'
        });
      }
    }

    // Validate project exists
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(400).json({
          success: false,
          message: 'Project not found'
        });
      }
    }

    // Update fields
    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description ? description.trim() : '';
    if (start !== undefined) event.start = new Date(start);
    if (end !== undefined) event.end = end ? new Date(end) : event.start;
    if (allDay !== undefined) event.allDay = allDay;
    if (type !== undefined) event.type = type;
    if (priority !== undefined) event.priority = priority;
    if (attendees !== undefined) event.attendees = attendees;
    if (projectId !== undefined) event.projectId = projectId;
    if (reminders !== undefined) event.reminders = reminders;

    event.updatedAt = new Date();

    await event.save();

    // Populate the updated event
    await event.populate([
      { path: 'createdBy', select: 'firstName lastName email' },
      { path: 'attendees', select: 'firstName lastName email' },
      { path: 'projectId', select: 'name' }
    ]);

    res.json({
      success: true,
      message: 'Event updated successfully',
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        type: event.type,
        priority: event.priority,
        createdBy: event.createdBy,
        attendees: event.attendees,
        projectId: event.projectId,
        reminders: event.reminders
      }
    });
  } catch (error) {
    console.error('Update calendar event error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete calendar event
router.delete('/events/:id', auth, async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permissions (creator or admin)
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this event'
      });
    }

    await CalendarEvent.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete calendar event error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's calendar events (events created by or attending)
router.get('/my-events', auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    let query = {
      $or: [
        { createdBy: req.user.id },
        { attendees: { $in: [req.user.id] } }
      ]
    };
    
    if (start && end) {
      query.start = { $gte: new Date(start), $lte: new Date(end) };
    }

    const events = await CalendarEvent.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .populate('projectId', 'name')
      .sort({ start: 1 });

    res.json({
      success: true,
      events: events.map(event => ({
        id: event._id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        backgroundColor: getEventColor(event.type, event.priority),
        borderColor: getEventColor(event.type, event.priority),
        extendedProps: {
          description: event.description,
          type: event.type,
          priority: event.priority,
          attendees: event.attendees,
          projectId: event.projectId,
          isCreator: event.createdBy._id.toString() === req.user.id
        }
      }))
    });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user events',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get events for a specific project
router.get('/projects/:projectId/events', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const events = await CalendarEvent.find({ projectId })
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .sort({ start: 1 });

    res.json({
      success: true,
      events: events.map(event => ({
        id: event._id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        backgroundColor: getEventColor(event.type, event.priority),
        borderColor: getEventColor(event.type, event.priority),
        extendedProps: {
          description: event.description,
          type: event.type,
          priority: event.priority,
          attendees: event.attendees,
          projectId: event.projectId
        }
      }))
    });
  } catch (error) {
    console.error('Get project events error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project events',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions
function getEventColor(type, priority) {
  if (priority === 'Critical') return '#DC2626'; // Red
  
  switch (type) {
    case 'meeting': return '#059669'; // Emerald
    case 'deadline': return '#DC2626'; // Red
    case 'leave': return '#7C3AED'; // Violet
    case 'event':
    default: 
      switch (priority) {
        case 'High': return '#F59E0B'; // Orange
        case 'Medium': return '#3B82F6'; // Blue
        case 'Low': return '#8B5CF6'; // Purple
        default: return '#2563EB'; // Blue
      }
  }
}

function getTaskColor(priority, status) {
  if (status === 'Completed') return '#10B981'; // Green
  
  switch (priority) {
    case 'Critical': return '#EF4444'; // Red
    case 'High': return '#F59E0B'; // Orange
    case 'Medium': return '#3B82F6'; // Blue
    case 'Low': return '#8B5CF6'; // Purple
    default: return '#6B7280'; // Gray
  }
}

module.exports = router;