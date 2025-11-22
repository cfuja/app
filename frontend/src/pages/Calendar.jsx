import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const localizer = momentLocalizer(moment);
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Calendar = ({ user, onLogout }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Convert assignments to calendar events
      const calendarEvents = response.data.map(assignment => ({
        id: assignment.id,
        title: `${assignment.course_name ? `[${assignment.course_name}] ` : ''}${assignment.title}`,
        start: new Date(assignment.due_date),
        end: new Date(assignment.due_date),
        resource: assignment,
        style: {
          backgroundColor: assignment.completed ? '#10b981' : '#3b82f6',
        }
      }));
      
      setEvents(calendarEvents);
    } catch (error) {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    const assignment = event.resource;
    toast.info(`${assignment.title}${assignment.description ? ` - ${assignment.description}` : ''}`);
  };

  const eventStyleGetter = (event) => {
    const backgroundColor = event.resource.completed ? '#10b981' : '#0891b2';
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        padding: '4px 8px',
        fontSize: '0.875rem',
      }
    };
  };

  return (
    <Layout user={user} onLogout={onLogout} currentPage="calendar">
      <div data-testid="calendar-page" className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Calendar</h1>
          <p className="text-gray-600 mt-1" style={{fontFamily: 'Inter, sans-serif'}}>View all your assignments in calendar format</p>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading calendar...</p>
            </div>
          ) : (
            <div data-testid="calendar-widget" style={{ height: '700px' }}>
              <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={currentView}
                onView={(view) => setCurrentView(view)}
                date={currentDate}
                onNavigate={(date) => setCurrentDate(date)}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day', 'agenda']}
                style={{ height: '100%' }}
              />
            </div>
          )}
        </Card>

        {/* Ad Zone */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-dashed p-8">
          <p className="text-center text-gray-400" style={{fontFamily: 'Inter, sans-serif'}}>Advertisement Space - Integration Ready</p>
        </Card>
      </div>
    </Layout>
  );
};

export default Calendar;
