import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Users, MessageCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Groups = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(response.data);
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/groups`, newGroup, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Group created!');
      setShowCreateDialog(false);
      setNewGroup({ name: '', description: '' });
      fetchGroups();
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} currentPage="groups">
      <div data-testid="groups-page" className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Groups</h1>
            <p className="text-gray-600 mt-1" style={{fontFamily: 'Inter, sans-serif'}}>Collaborate with your classmates</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="create-group-btn" className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                <Plus className="w-4 h-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>Start collaborating with your classmates</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Group Name *</Label>
                  <Input
                    id="group-name"
                    data-testid="group-name-input"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    placeholder="CS 450 Study Group"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-desc">Description</Label>
                  <Textarea
                    id="group-desc"
                    data-testid="group-description-input"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                    placeholder="Group for discussing assignments and projects"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button type="submit" data-testid="submit-group-btn">Create Group</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-500">Loading groups...</p>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No groups yet</h3>
              <p className="text-gray-500 mb-4">Create a group to start collaborating with classmates</p>
              <Button onClick={() => setShowCreateDialog(true)}>Create Your First Group</Button>
            </CardContent>
          </Card>
        ) : (
          <div data-testid="groups-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Card
                key={group.id}
                data-testid={`group-card-${group.id}`}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/groups/${group.id}/chat`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg" style={{fontFamily: 'Space Grotesk, sans-serif'}}>{group.name}</CardTitle>
                      <CardDescription className="mt-1">{group.description || 'No description'}</CardDescription>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{group.member_ids.length} {group.member_ids.length === 1 ? 'member' : 'members'}</span>
                    <Button
                      data-testid={`open-chat-${group.id}`}
                      size="sm"
                      className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/groups/${group.id}/chat`);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Ad Zone */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-dashed p-8">
          <p className="text-center text-gray-400" style={{fontFamily: 'Inter, sans-serif'}}>Advertisement Space - Integration Ready</p>
        </Card>
      </div>
    </Layout>
  );
};

export default Groups;
