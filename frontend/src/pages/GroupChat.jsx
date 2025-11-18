import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Send, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GroupChat = ({ user, onLogout }) => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchGroupInfo();
    fetchMessages();
    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const connectWebSocket = () => {
    try {
      const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
      socketRef.current = io(wsUrl, {
        transports: ['websocket'],
        path: '/ws/socket.io',
      });

      socketRef.current.on('connect', () => {
        console.log('WebSocket connected');
        socketRef.current.emit('join_group', groupId);
      });

      socketRef.current.on('new_message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      socketRef.current.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };

  const fetchGroupInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const group = response.data.find(g => g.id === groupId);
      if (!group) {
        toast.error('Group not found');
        navigate('/groups');
        return;
      }
      setGroupInfo(group);
    } catch (error) {
      toast.error('Failed to load group info');
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You are not a member of this group');
        navigate('/groups');
      } else {
        toast.error('Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/groups/${groupId}/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Message will be added via WebSocket or refresh
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} currentPage="groups">
      <div data-testid="group-chat-page" className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            data-testid="back-to-groups-btn"
            variant="outline"
            size="icon"
            onClick={() => navigate('/groups')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              {groupInfo?.name || 'Group Chat'}
            </h1>
            <p className="text-gray-600 mt-1" style={{fontFamily: 'Inter, sans-serif'}}>
              {groupInfo?.member_ids.length} {groupInfo?.member_ids.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        <Card className="h-[calc(100vh-16rem)]">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Messages Area */}
            <div data-testid="messages-container" className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <p className="text-center py-8 text-gray-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-2">Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.user_id === user.id;
                  return (
                    <div
                      key={message.id}
                      data-testid={`message-${message.id}`}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isOwnMessage && (
                          <span className="text-xs font-semibold text-gray-700 mb-1">{message.user_name}</span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {format(new Date(message.created_at), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  data-testid="message-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button
                  data-testid="send-message-btn"
                  type="submit"
                  className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Ad Zone */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-dashed p-8">
          <p className="text-center text-gray-400" style={{fontFamily: 'Inter, sans-serif'}}>Advertisement Space - Integration Ready</p>
        </Card>
      </div>
    </Layout>
  );
};

export default GroupChat;
