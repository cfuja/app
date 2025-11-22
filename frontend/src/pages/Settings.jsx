import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Moon, Sun } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = ({ user, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [lmsConfig, setLmsConfig] = useState({
    learning_suite_api_key: '',
    canvas_api_key: '',
    canvas_domain: '',
    canvas_access_token: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLMSConfig();
  }, []);

  const fetchLMSConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/lms/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLmsConfig(response.data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/lms/config`, lmsConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCanvasOAuth = () => {
    // Placeholder for Canvas OAuth integration
    toast.info('Canvas OAuth integration coming soon!');
  };

  return (
    <Layout user={user} onLogout={onLogout} currentPage="settings">
      <div data-testid="settings-page" className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Configure your preferences and integrations</p>
        </div>

        {/* Theme Settings */}
        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Appearance</CardTitle>
            <CardDescription className="dark:text-gray-400">Customize how YOUNIVITY looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="dark:text-gray-200">Theme</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </p>
              </div>
              <Button
                data-testid="settings-theme-toggle-btn"
                variant="outline"
                onClick={toggleTheme}
                className="flex items-center gap-2"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4" />
                    Switch to Light
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    Switch to Dark
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Profile Information</CardTitle>
            <CardDescription className="dark:text-gray-400">Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={user.full_name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Authentication Type</Label>
              <Input value={user.auth_type} disabled className="capitalize" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">LMS Integration</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Connect Learning Suite and Canvas to automatically sync your assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-4 text-gray-500">Loading...</p>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold dark:text-gray-100">Learning Suite</h3>
                  <div className="space-y-2">
                    <Label htmlFor="ls-key" className="dark:text-gray-200">API Key</Label>
                    <Input
                      id="ls-key"
                      data-testid="learning-suite-key-input"
                      type="password"
                      placeholder="Enter your Learning Suite API key"
                      value={lmsConfig.learning_suite_api_key}
                      onChange={(e) => setLmsConfig({...lmsConfig, learning_suite_api_key: e.target.value})}
                      className="dark:bg-gray-800 dark:text-gray-100"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get your API key from Learning Suite settings. Once configured, assignments will sync automatically.
                    </p>
                  </div>
                </div>

                <div className="border-t dark:border-gray-700 pt-6 space-y-4">
                  <h3 className="text-lg font-semibold dark:text-gray-100">Canvas</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Canvas OAuth Integration</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-400 mb-3">
                      Connect your Canvas account securely using OAuth. This will automatically fetch all your courses and assignments.
                    </p>
                    <Button
                      type="button"
                      data-testid="canvas-oauth-btn"
                      onClick={handleCanvasOAuth}
                      className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                    >
                      {lmsConfig.canvas_access_token ? 'Reconnect Canvas' : 'Connect with Canvas'}
                    </Button>
                    {lmsConfig.canvas_access_token && (
                      <p className="text-sm text-green-700 dark:text-green-400 mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Canvas connected
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Integration Status</h4>
                  <p className="text-sm text-blue-800">
                    The backend API endpoints are ready for Learning Suite and Canvas integration. 
                    Add your API credentials above, and the system will automatically fetch and sync your assignments.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    data-testid="save-settings-btn"
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Google OAuth Configuration</CardTitle>
            <CardDescription>Independent Google authentication setup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                To enable Google OAuth:
                <br />1. Create a project in Google Cloud Console
                <br />2. Enable Google+ API
                <br />3. Create OAuth 2.0 credentials
                <br />4. Add authorized redirect URIs
                <br />5. Update backend with client ID and secret
              </p>
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

export default Settings;
