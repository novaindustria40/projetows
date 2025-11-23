
import React, { useState, useEffect } from 'react';
import { Zap, Menu } from 'lucide-react';
import { AppView, User } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Campaigns from './pages/Campaigns';
import Settings from './pages/Settings';
import Connection from './pages/Connection';
import Login from './pages/Login';
import Register from './pages/Register';

type AuthView = 'login' | 'register';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [isDark, setIsDark] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const [categories, setCategories] = useState<string[]>(['Promocional', 'Informativo', 'Cobrança', 'Saudação', 'Aniversário']);
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');

  // Check for user in localStorage on initial load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('zapscale-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('zapscale-user');
    }
  }, []);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem('zapscale-user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleRegister = (registeredUser: User) => {
    // Automatically log in the user after registration
    localStorage.setItem('zapscale-user', JSON.stringify(registeredUser));
    setUser(registeredUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('zapscale-user');
    setUser(null);
    setView(AppView.DASHBOARD); // Reset view on logout
  };

  const renderContent = () => {
    if (!user) return null; // Should not happen if this component is rendered
    
    switch (view) {
      case AppView.DASHBOARD: return <Dashboard user={user} />;
      case AppView.MESSAGES: 
        return <Messages categories={categories} />;
      case AppView.CAMPAIGNS: return <Campaigns />;
      case AppView.SETTINGS: 
        return <Settings user={user} theme={{ isDark, toggleTheme }} categories={categories} setCategories={setCategories} />;
      case AppView.CONNECTION: return <Connection />;
      default: return <Dashboard user={user} />;
    }
  };

  // If there's no user, show Login or Register page
  if (!user) {
    if (authView === 'login') {
      return <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />;
    }
    return <Register onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} />;
  }

  // If there is a user, show the main application
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden">
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <Sidebar 
        currentView={view} 
        onChangeView={(v) => { setView(v); setIsMobileOpen(false); }} 
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden h-16 bg-white dark:bg-slate-850 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 shrink-0">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-gray-600 dark:text-gray-300">
            <Menu />
          </button>
          <div className="flex items-center gap-2 font-bold text-lg">
            <Zap className="w-6 h-6 text-primary-500"/>
            ZapScale
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
