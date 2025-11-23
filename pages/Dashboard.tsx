
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Send, CheckCircle, Eye, AlertCircle, Wifi, RefreshCw } from 'lucide-react';
import { User, DashboardStats, Campaign } from '../types';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Carregando dados...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Bem-vindo de volta, {user.name}</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={fetchStats} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
               <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
            <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full text-green-700 dark:text-green-400">
              <Wifi className="h-4 w-4 animate-pulse" />
              <span className="text-sm font-medium">Sistema Operacional</span>
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Envios Totais', value: stats?.totalSent || 0, icon: Send, color: 'bg-blue-500' },
          { label: 'Entregues', value: stats?.totalDelivered || 0, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'Estimativa Leitura', value: stats?.totalRead || 0, icon: Eye, color: 'bg-purple-500' },
          { label: 'Falhas', value: stats?.totalFailed || 0, icon: AlertCircle, color: 'bg-red-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value.toLocaleString()}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg text-white bg-opacity-90 shadow-lg shadow-${stat.color}/30`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance por Campanha</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData || []}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="sent" stroke="#22c55e" fillOpacity={1} fill="url(#colorSent)" name="Enviados" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Últimas Campanhas</h2>
          <div className="space-y-4">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((item: Campaign, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 last:border-0 pb-3 last:pb-0">
                    <div className="min-w-0 max-w-[70%]">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                          Destino: {item.targetName || 'Lista'} ({item.targetCount || 0})
                      </p>
                    </div>
                    <span className={`text-xs font-medium ${
                        item.status === 'completed' ? 'text-green-500' : 
                        item.status === 'running' ? 'text-blue-500' : 
                        item.status === 'failed' ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                        {item.status}
                    </span>
                  </div>
                ))
            ) : (
                <p className="text-sm text-gray-500">Nenhuma atividade recente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
