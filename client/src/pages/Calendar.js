import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { 
  Plus, X, Calendar, Clock, User, Users, 
  AlertCircle, CheckCircle, Edit2, Trash2, 
  Filter, Search, RefreshCw 
} from 'lucide-react';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    showTasks: true,
    showEvents: true,
    showPersonalOnly: false,
    selectedProjects: [],
    selectedUsers: []
  });

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    allDay: false,
    type: 'event', // 'event', 'meeting', 'deadline', 'leave'
    attendees: [],
    projectId: '',
    priority: 'Medium',
    reminders: []
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [eventsRes, projectsRes, employeesRes] = await Promise.all([
        fetch('http://localhost:5000/api/calendar/events', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/employees', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      let calendarEvents = [];
      let projectTasks = [];

      // Fetch calendar events (if endpoint exists, otherwise use empty array)
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        calendarEvents = eventsData.events || [];
      }

      // Fetch projects and extract tasks
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        const projectsList = projectsData.projects || [];
        setProjects(projectsList);

        // Extract tasks from projects
        projectsList.forEach(project => {
          project.tasks?.forEach(task => {
            if (task.dueDate) {
              projectTasks.push({
                id: `task-${task._id}`,
                title: `Task: ${task.title}`,
                start: task.dueDate,
                allDay: true,
                backgroundColor: getTaskColor(task.priority, task.status),
                borderColor: getTaskColor(task.priority, task.status),
                extendedProps: {
                  type: 'task',
                  task: task,
                  project: project,
                  assignee: task.assignedTo,
                  priority: task.priority,
                  status: task.status,
                  progress: task.progress
                }
              });
            }
          });
        });
        setTasks(projectTasks);
      }

      // Fetch employees
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData.employees || []);
      }

      // Combine all events
      const allEvents = [
        ...calendarEvents.map(event => ({
          ...event,
          backgroundColor: getEventColor(event.type),
          borderColor: getEventColor(event.type)
        })),
        ...projectTasks
      ];

      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskColor = (priority, status) => {
    if (status === 'Completed') return '#10B981'; // Green
    
    switch (priority) {
      case 'Critical': return '#EF4444'; // Red
      case 'High': return '#F59E0B'; // Orange
      case 'Medium': return '#3B82F6'; // Blue
      case 'Low': return '#8B5CF6'; // Purple
      default: return '#6B7280'; // Gray
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'meeting': return '#059669'; // Emerald
      case 'deadline': return '#DC2626'; // Red
      case 'leave': return '#7C3AED'; // Violet
      case 'event':
      default: return '#2563EB'; // Blue
    }
  };

  const handleDateClick = (selectInfo) => {
    const clickedDate = selectInfo.dateStr || selectInfo.startStr;
    setEventForm({
      ...eventForm,
      start: clickedDate,
      end: clickedDate,
      allDay: true
    });
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    const eventProps = event.extendedProps;

    if (eventProps.type === 'task') {
      // Handle task click - show task details
      alert(`Task: ${event.title}\nProject: ${eventProps.project.name}\nStatus: ${eventProps.status}\nProgress: ${eventProps.progress}%`);
    } else {
      // Handle calendar event click
      setSelectedEvent({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        ...eventProps
      });
      setEventForm({
        title: event.title,
        description: eventProps.description || '',
        start: event.startStr,
        end: event.endStr,
        allDay: event.allDay,
        type: eventProps.type || 'event',
        attendees: eventProps.attendees || [],
        projectId: eventProps.projectId || '',
        priority: eventProps.priority || 'Medium',
        reminders: eventProps.reminders || []
      });
      setShowEventModal(true);
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = selectedEvent 
        ? `http://localhost:5000/api/calendar/events/${selectedEvent.id}`
        : 'http://localhost:5000/api/calendar/events';
      
      const method = selectedEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(eventForm)
      });

      if (response.ok) {
        setShowEventModal(false);
        resetEventForm();
        fetchData(); // Refresh calendar data
      } else {
        throw new Error('Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  const handleEventDelete = async () => {
    if (!selectedEvent || !window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/calendar/events/${selectedEvent.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setShowEventModal(false);
        resetEventForm();
        fetchData();
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      start: '',
      end: '',
      allDay: false,
      type: 'event',
      attendees: [],
      projectId: '',
      priority: 'Medium',
      reminders: []
    });
    setSelectedEvent(null);
  };

  const filteredEvents = events.filter(event => {
    const props = event.extendedProps || {};
    
    // Filter by event type
    if (props.type === 'task' && !filterOptions.showTasks) return false;
    if (props.type !== 'task' && !filterOptions.showEvents) return false;
    
    // Filter by personal only
    if (filterOptions.showPersonalOnly && currentUser) {
      if (props.type === 'task') {
        return props.assignee?._id === currentUser._id;
      } else {
        return event.createdBy === currentUser._id || 
               (event.attendees && event.attendees.includes(currentUser._id));
      }
    }
    
    // Filter by selected projects
    if (filterOptions.selectedProjects.length > 0 && props.project) {
      return filterOptions.selectedProjects.includes(props.project._id);
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">
            Manage events, tasks, and deadlines
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            <RefreshCw size={20} />
            Refresh
          </button>
          <button
            onClick={() => {
              resetEventForm();
              setShowEventModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Event
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filterOptions.showTasks}
                onChange={(e) => setFilterOptions(prev => ({
                  ...prev,
                  showTasks: e.target.checked
                }))}
                className="rounded"
              />
              <span className="text-sm">Show Tasks</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filterOptions.showEvents}
                onChange={(e) => setFilterOptions(prev => ({
                  ...prev,
                  showEvents: e.target.checked
                }))}
                className="rounded"
              />
              <span className="text-sm">Show Events</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filterOptions.showPersonalOnly}
                onChange={(e) => setFilterOptions(prev => ({
                  ...prev,
                  showPersonalOnly: e.target.checked
                }))}
                className="rounded"
              />
              <span className="text-sm">Personal Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          weekends={true}
          events={filteredEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          eventDisplay="block"
          eventDidMount={(info) => {
            // Add tooltip
            info.el.title = info.event.title;
            
            // Add custom styling
            const props = info.event.extendedProps;
            if (props.type === 'task') {
              info.el.style.fontSize = '12px';
              info.el.style.opacity = props.status === 'Completed' ? '0.7' : '1';
            }
          }}
        />
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedEvent ? 'Edit Event' : 'Create Event'}
              </h2>
              <div className="flex gap-2">
                {selectedEvent && (
                  <button
                    onClick={handleEventDelete}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    resetEventForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleEventSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  rows="3"
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={eventForm.type}
                  onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="event">General Event</option>
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                  <option value="leave">Leave/Holiday</option>
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type={eventForm.allDay ? "date" : "datetime-local"}
                    value={eventForm.start}
                    onChange={(e) => setEventForm(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type={eventForm.allDay ? "date" : "datetime-local"}
                    value={eventForm.end}
                    onChange={(e) => setEventForm(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* All Day Toggle */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={eventForm.allDay}
                    onChange={(e) => setEventForm(prev => ({ ...prev, allDay: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">All Day Event</span>
                </label>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={eventForm.priority}
                  onChange={(e) => setEventForm(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Project Association */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Associated Project (Optional)
                </label>
                <select
                  value={eventForm.projectId}
                  onChange={(e) => setEventForm(prev => ({ ...prev, projectId: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">None</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Attendees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendees
                </label>
                <select
                  multiple
                  value={eventForm.attendees}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setEventForm(prev => ({ ...prev, attendees: selected }));
                  }}
                  className="w-full p-2 border rounded-lg"
                  size="4"
                >
                  {employees.map(employee => (
                    <option key={employee._id} value={employee._id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl/Cmd to select multiple attendees
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    resetEventForm();
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg border p-4 mt-6">
        <h3 className="font-medium mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">General Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span className="text-sm">Meetings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span className="text-sm">Deadlines/Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-violet-600 rounded"></div>
            <span className="text-sm">Leave/Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm">High Priority Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Completed Tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;