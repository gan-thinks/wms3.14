import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';


const CalendarPage = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchedEvents = [
      { title: 'Team Meeting', date: '2025-08-10' },
      { title: 'Leave - Ganga', date: '2025-08-14' },
      { title: 'Project Deadline', date: '2025-08-18' },
    ];
    setEvents(fetchedEvents);
  }, []);

  const handleDateClick = (info) => {
    alert(`Clicked on date: ${info.dateStr}`);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Company Calendar</h1>
      <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        dateClick={handleDateClick}
        events={events}
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: ''
        }}
      />
    </div>
  );
};

export default CalendarPage;
