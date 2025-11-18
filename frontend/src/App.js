import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Groups from './pages/Groups';
import GroupChat from './pages/GroupChat';
import Settings from './pages/Settings';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#0a1929]">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth setUser={setUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/calendar" element={user ? <Calendar user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/groups" element={user ? <Groups user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/groups/:groupId/chat" element={user ? <GroupChat user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/settings" element={user ? <Settings user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
