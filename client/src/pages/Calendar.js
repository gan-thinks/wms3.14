import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { Calendar, Clock, Users, Plus, X, Check, Trash2 } from 'lucide-react';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'meeting',
    startTime: '',
    endTime: '',
    attendees: []
  });
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  // Fetch employees for attendee selection
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/employees/list/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(response.data || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch events from backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch project events
        const projectResponse = await axios.get('/api/projects/calendar/events', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch meeting events (you can add this endpoint later)
        // const meetingResponse = await axios.get('/api/meetings/calendar/events', {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        
        // Combine all events
        const allEvents = [
          ...projectResponse.data,
          // Sample meeting events for now
          { 
            id: 'meeting-1', 
            title: 'Team Standup', 
            start: '2025-01-20T09:00:00',
            end: '2025-01-20T09:30:00',
            type: 'meeting',
            backgroundColor: '#f59e0b',
            borderColor: '#f59e0b'
          },
          { 
            id: 'meeting-2', 
            title: 'Client Review', 
            start: '2025-01-22T14:00:00',
            end: '2025-01-22T15:00:00',
            type: 'meeting',
            backgroundColor: '#ef4444',
            borderColor: '#ef4444'
          }
        ];
        
        setEvents(allEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        // Fallback to sample events
        setEvents([
          { 
            id: '1', 
            title: 'Team Meeting', 
            start: '2025-01-20T10:00:00',
            type: 'meeting',
            backgroundColor: '#f59e0b'
          },
          { 
            id: '2', 
            title: 'Project Deadline', 
            start: '2025-01-25',
            type: 'project',
            backgroundColor: '#3b82f6'
          }
        ]);
      }
    };
    
    fetchEvents();
  }, []);

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setNewEvent({
      ...newEvent,
      startTime: info.dateStr + 'T09:00',
      endTime: info.dateStr + 'T10:00'
    });
    setShowModal(true);
  };

  const handleEventClick = (info) => {
    const event = info.event;
    const confirmDelete = window.confirm(`Delete event "${event.title}"?`);
    if (confirmDelete) {
      // Remove event from calendar
      info.event.remove();
      // TODO: Also remove from backend
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim()) {
      alert('Please enter an event title');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        id: Date.now().toString(),
        title: newEvent.title,
        start: newEvent.startTime,
        end: newEvent.endTime,
        description: newEvent.description,
        type: newEvent.type,
        backgroundColor: newEvent.type === 'meeting' ? '#f59e0b' : 
                        newEvent.type === 'project' ? '#3b82f6' : '#10b981',
        borderColor: newEvent.type === 'meeting' ? '#f59e0b' : 
                    newEvent.type === 'project' ? '#3b82f6' : '#10b981'
      };

      // Add to calendar immediately
      setEvents(prev => [...prev, eventData]);
      
      // TODO: Save to backend
      // await axios.post('/api/meetings', eventData, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      // });

      setShowModal(false);
      setNewEvent({
        title: '',
        description: '',
        type: 'meeting',
        startTime: '',
        endTime: '',
        attendees: []
      });
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'project':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Calendar</h1>
        <p className="text-gray-600">Manage meetings, project deadlines, and team schedules</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600">Total Events</p>
              <p className="text-2xl font-bold text-blue-900">{events.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-600">Meetings</p>
              <p className="text-2xl font-bold text-yellow-900">
                {events.filter(e => e.type === 'meeting').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600">Tasks</p>
              <p className="text-2xl font-bold text-green-900">
                {events.filter(e => e.type === 'task').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-purple-600">Projects</p>
              <p className="text-2xl font-bold text-purple-900">
                {events.filter(e => e.type === 'project').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          views={{
            dayGridMonth: { buttonText: 'Month' },
            timeGridWeek: { buttonText: 'Week' },
            timeGridDay: { buttonText: 'Day' },
            listWeek: { buttonText: 'Agenda' }
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          height="700px"
          eventDisplay="block"
          displayEventTime={true}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          expandRows={true}
          stickyHeaderDates={true}
          nowIndicator={true}
        />
      </div>

      {/* Event Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Event</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Event description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="meeting">Meeting</option>
                  <option value="task">Task</option>
                  <option value="deadline">Deadline</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
