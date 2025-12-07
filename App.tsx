
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { authService } from './services/authService';
import { firestoreService } from './services/firestoreService';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './pages/AdminDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { TechnicianView } from './pages/TechnicianView';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize DB defaults (Admin user, Products)
    firestoreService.initializeDefaults();

    // Check for existing session
    const savedUser = authService.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading Portal...</div>;
  }

  // If not logged in, show Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  const renderView = () => {
    // Normalize role to uppercase to handle legacy/manual data issues
    const role = currentUser.role?.toUpperCase();

    switch (role) {
      case UserRole.ADMIN:
        return <AdminDashboard />;
      case UserRole.DOCTOR:
        return <DoctorDashboard user={currentUser} />;
      case UserRole.TECHNICIAN:
        return <TechnicianView user={currentUser} />;
      default:
        return <div className="p-12 text-center text-red-500 font-bold">Error: Unknown User Role ({currentUser.role})</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="relative pt-4">
        {renderView()}
      </main>
    </div>
  );
}
