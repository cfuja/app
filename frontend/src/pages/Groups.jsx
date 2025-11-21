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
import { Plus, Users, MessageCircle, UserPlus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Groups = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
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

  const fetchGroupMembers = async (groupId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroupMembers(response.data);
    } catch (error) {
      toast.error('Failed to load group members');
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

  const handleInviteUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/groups/${selectedGroup.id}/invite?email=${encodeURIComponent(inviteEmail)}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Successfully invited ${inviteEmail}`);
      setInviteEmail('');
      fetchGroupMembers(selectedGroup.id);
      fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to invite user');
    }
  };

  const openInviteDialog = (group) => {
    setSelectedGroup(group);
    fetchGroupMembers(group.id);
    setShowInviteDialog(true);
  };

  return (
    <Layout user={user} onLogout={onLogout} currentPage="groups">
      <div data-testid="groups-page" className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Groups</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Collaborate with your classmates</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="create-group-btn" className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                <Plus className="w-4 h-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-gray-900">
              <DialogHeader>
                <DialogTitle className="dark:text-gray-100">Create New Group</DialogTitle>
                <DialogDescription className="dark:text-gray-400">Start collaborating with your classmates</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name" className="dark:text-gray-200">Group Name *</Label>
                  <Input
                    id="group-name"
                    data-testid="group-name-input"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    placeholder="CS 450 Study Group"
                    required
                    className="dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-desc" className="dark:text-gray-200">Description</Label>
                  <Textarea
                    id="group-desc"
                    data-testid="group-description-input"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                    placeholder="Group for discussing assignments and projects"
                    rows={3}
                    className="dark:bg-gray-800 dark:text-gray-100"
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
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading groups...</p>
        ) : groups.length === 0 ? (
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No groups yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create a group to start collaborating with classmates</p>
              <Button onClick={() => setShowCreateDialog(true)}>Create Your First Group</Button>
            </CardContent>
          </Card>
        ) : (
          <div data-testid="groups-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Card
                key={group.id}
                data-testid={`group-card-${group.id}`}
                className="hover:shadow-lg transition-all duration-200 group dark:bg-gray-900 dark:border-gray-700"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg dark:text-gray-100">{group.name}</CardTitle>
                      <CardDescription className="mt-1 dark:text-gray-400">{group.description || 'No description'}</CardDescription>
                    </div>
                    <img src="/younivity-logo.png" alt="Group" className="w-12 h-12 group-hover:scale-110 transition-transform" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{group.member_ids.length} {group.member_ids.length === 1 ? 'member' : 'members'}</span>
                    <div className="flex gap-2">
                      <Button
                        data-testid={`open-chat-${group.id}`}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                        onClick={() => navigate(`/groups/${group.id}/chat`)}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                      <Button
                        data-testid={`invite-member-${group.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => openInviteDialog(group)}
                        className="flex items-center gap-1"
                      >
                        <UserPlus className="w-4 h-4" />
                        Invite
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Invite Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100">Invite Member to {selectedGroup?.name}</DialogTitle>
              <DialogDescription className="dark:text-gray-400">Enter the email address of the person you want to invite</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Current Members */}
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Current Members ({groupMembers.length})</Label>
                <div className="border dark:border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {groupMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                      <div>
                        <p className="text-sm font-medium dark:text-gray-200">{member.full_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                      </div>
                      {member.id === user.id && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">You</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite Form */}
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email" className="dark:text-gray-200">Email Address *</Label>
                  <Input
                    id="invite-email"
                    data-testid="invite-email-input"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="friend@example.com"
                    required
                    className="dark:bg-gray-800 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">The user must already have a YOUNIVITY account</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowInviteDialog(false);
                    setInviteEmail('');
                  }}>Cancel</Button>
                  <Button type="submit" data-testid="submit-invite-btn">Send Invite</Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ad Zone */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-dashed p-8">
          <p className="text-center text-gray-400">Advertisement Space - Integration Ready</p>
        </Card>
      </div>
    </Layout>
  );
};

export default Groups;
