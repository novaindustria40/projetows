import React from 'react';
import { LayoutDashboard, Smartphone, MessageSquare, Calendar, Settings, LogOut, Zap } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLogout: () => void;
  isMobileOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, isMobileOpen }) => {
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.CONNECTION, label: 'Conexão', icon: Smartphone },
    { id: AppView.MESSAGES, label: 'Mensagens', icon: MessageSquare },
    { id: AppView.CAMPAIGNS, label: 'Campanhas', icon: Calendar },
    { id: AppView.SETTINGS, label: 'Configurações', icon: Settings },
  ];

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-850 border-r border-gray-200 dark:border-slate-700 
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static
      `}
    >
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-slate-700">
          <Zap className="h-8 w-8 text-primary-500 mr-2" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            ZapScale
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`
                  w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                    : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}
                `}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
