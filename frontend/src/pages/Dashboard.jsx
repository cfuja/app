import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Trash2, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    course_name: '',
    due_date: ''
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Sort by due date
      const sorted = response.data.sort((a, b) => 
        new Date(a.due_date) - new Date(b.due_date)
      );
      setAssignments(sorted);
    } catch (error) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/assignments`, newAssignment, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Assignment added!');
      setShowAddDialog(false);
      setNewAssignment({ title: '', description: '', course_name: '', due_date: '' });
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to add assignment');
    }
  };

  const toggleComplete = async (assignmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/assignments/${assignmentId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to update assignment');
    }
  };

  const deleteAssignment = async (assignmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Assignment deleted');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const syncLMS = async () => {
    setSyncLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/lms/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(response.data.message);
      fetchAssignments();
    } catch (error) {
      if (error.response?.status === 400) {
        toast.info('Please configure your LMS API keys in Settings first.');
        setTimeout(() => navigate('/settings'), 2000);
      } else {
        toast.error('Sync failed');
      }
    } finally {
      setSyncLoading(false);
    }
  };

  const upcomingAssignments = assignments.filter(a => !a.completed).slice(0, 10);
  const completedCount = assignments.filter(a => a.completed).length;

  return (
    <Layout user={user} onLogout={onLogout} currentPage="dashboard">
      <div data-testid="dashboard-page" className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Dashboard</h1>
            <p className="text-gray-600 mt-1" style={{fontFamily: 'Inter, sans-serif'}}>Welcome back, {user.full_name}!</p>
          </div>
          <div className="flex gap-2">
            <Button
              data-testid="sync-lms-btn"
              onClick={syncLMS}
              disabled={syncLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
              Sync LMS
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button data-testid="add-assignment-btn" className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Assignment</DialogTitle>
                  <DialogDescription>Create a new task to track</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddAssignment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      data-testid="assignment-title-input"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      data-testid="assignment-course-input"
                      value={newAssignment.course_name}
                      onChange={(e) => setNewAssignment({...newAssignment, course_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Due Date *</Label>
                    <Input
                      id="due-date"
                      data-testid="assignment-duedate-input"
                      type="datetime-local"
                      value={newAssignment.due_date}
                      onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      data-testid="assignment-description-input"
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                    <Button type="submit" data-testid="submit-assignment-btn">Add Assignment</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <CardHeader>
              <CardTitle className="text-teal-900">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-teal-700">{upcomingAssignments.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-700">{completedCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-700">{assignments.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Upcoming Assignments
            </CardTitle>
            <CardDescription>Your tasks ordered by due date</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-gray-500">Loading...</p>
            ) : upcomingAssignments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No pending assignments</p>
                <p className="text-sm text-gray-400">Sync with Learning Suite or Canvas, or add tasks manually</p>
              </div>
            ) : (
              <div data-testid="assignments-list" className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    data-testid={`assignment-item-${assignment.id}`}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      data-testid={`assignment-checkbox-${assignment.id}`}
                      checked={assignment.completed}
                      onCheckedChange={() => toggleComplete(assignment.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>{assignment.title}</h3>
                          {assignment.course_name && (
                            <p className="text-sm text-gray-600 mt-1">{assignment.course_name}</p>
                          )}
                          {assignment.description && (
                            <p className="text-sm text-gray-500 mt-1">{assignment.description}</p>
                          )}
                        </div>
                        <Button
                          data-testid={`delete-assignment-${assignment.id}`}
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteAssignment(assignment.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-xs text-gray-500">
                          Due: {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
                        </p>
                        {assignment.source && assignment.source !== 'manual' && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {assignment.source === 'learning_suite' ? 'Learning Suite' : 'Canvas'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ad Zone */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-dashed">
          <CardContent className="py-8">
            <p className="text-center text-gray-400" style={{fontFamily: 'Inter, sans-serif'}}>Advertisement Space - Integration Ready</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
