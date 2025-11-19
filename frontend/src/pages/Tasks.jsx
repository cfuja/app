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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Trash2, RefreshCw, ListTodo, CheckCircle2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Tasks = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
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

  const pendingAssignments = assignments.filter(a => !a.completed);
  const completedAssignments = assignments.filter(a => a.completed);

  const renderAssignmentsList = (tasksList) => (
    <div data-testid="assignments-list" className="space-y-3">
      {tasksList.map((assignment) => (
        <div
          key={assignment.id}
          data-testid={`assignment-item-${assignment.id}`}
          className="flex items-start gap-4 p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                <h3 className={`font-semibold ${assignment.completed ? 'line-through text-gray-500 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}`}>{assignment.title}</h3>
                {assignment.course_name && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{assignment.course_name}</p>
                )}
                {assignment.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{assignment.description}</p>
                )}
              </div>
              <Button
                data-testid={`delete-assignment-${assignment.id}`}
                size="icon"
                variant="ghost"
                onClick={() => deleteAssignment(assignment.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Due: {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
              </p>
              {assignment.source && assignment.source !== 'manual' && (
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  {assignment.source === 'learning_suite' ? 'Learning Suite' : 'Canvas'}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Layout user={user} onLogout={onLogout} currentPage="tasks">
      <div data-testid="tasks-page" className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all your assignments and tasks</p>
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
              <DialogContent className="dark:bg-gray-900">
                <DialogHeader>
                  <DialogTitle className="dark:text-gray-100">Add New Assignment</DialogTitle>
                  <DialogDescription className="dark:text-gray-400">Create a new task to track</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddAssignment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="dark:text-gray-200">Title *</Label>
                    <Input
                      id="title"
                      data-testid="assignment-title-input"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                      required
                      className="dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course" className="dark:text-gray-200">Course</Label>
                    <Input
                      id="course"
                      data-testid="assignment-course-input"
                      value={newAssignment.course_name}
                      onChange={(e) => setNewAssignment({...newAssignment, course_name: e.target.value})}
                      className="dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date" className="dark:text-gray-200">Due Date *</Label>
                    <Input
                      id="due-date"
                      data-testid="assignment-duedate-input"
                      type="datetime-local"
                      value={newAssignment.due_date}
                      onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                      required
                      className="dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="dark:text-gray-200">Description</Label>
                    <Textarea
                      id="description"
                      data-testid="assignment-description-input"
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                      rows={3}
                      className="dark:bg-gray-800 dark:text-gray-100"
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 dark:bg-gray-800">
            <TabsTrigger value="pending" data-testid="pending-tab" className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Pending ({pendingAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="completed-tab" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed ({completedAssignments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card className="dark:bg-gray-900 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                  <CalendarIcon className="w-5 h-5" />
                  Pending Tasks
                </CardTitle>
                <CardDescription className="dark:text-gray-400">Tasks you need to complete</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</p>
                ) : pendingAssignments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No pending assignments</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Add tasks manually or sync with your LMS</p>
                  </div>
                ) : (
                  renderAssignmentsList(pendingAssignments)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <Card className="dark:bg-gray-900 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                  <CheckCircle2 className="w-5 h-5" />
                  Completed Tasks
                </CardTitle>
                <CardDescription className="dark:text-gray-400">Tasks you've finished</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</p>
                ) : completedAssignments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No completed assignments yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Mark tasks as complete to see them here</p>
                  </div>
                ) : (
                  renderAssignmentsList(completedAssignments)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ad Zone */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-dashed p-8">
          <p className="text-center text-gray-400">Advertisement Space - Integration Ready</p>
        </Card>
      </div>
    </Layout>
  );
};

export default Tasks;
