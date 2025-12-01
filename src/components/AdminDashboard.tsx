import { Users, MapPin, TrendingUp, BarChart3, Shield, CheckCircle, XCircle } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface AdminDashboardProps {
  darkMode?: boolean;
}

export function AdminDashboard({ darkMode = false }: AdminDashboardProps) {
  const adminStats = [
    {
      icon: Users,
      label: 'Total Users',
      value: '1,234',
      change: '+12%',
      color: 'from-teal-400 to-cyan-500',
    },
    {
      icon: MapPin,
      label: 'Active Destinations',
      value: '456',
      change: '+8%',
      color: 'from-blue-400 to-teal-400',
    },
    {
      icon: TrendingUp,
      label: 'Active Trips',
      value: '89',
      change: '+24%',
      color: 'from-cyan-400 to-blue-500',
    },
    {
      icon: BarChart3,
      label: 'Total Revenue',
      value: '₱625k',
      change: '+15%',
      color: 'from-teal-300 to-cyan-400',
    },
  ];

  const recentUsers = [
    { id: 1, name: 'Maria Santos', email: 'maria@example.com', type: 'user', joined: '2025-10-15' },
    { id: 2, name: 'Juan dela Cruz', email: 'juan@example.com', type: 'user', joined: '2025-10-14' },
    { id: 3, name: 'Sofia Reyes', email: 'sofia@example.com', type: 'admin', joined: '2025-10-13' },
    { id: 4, name: 'Carlos Mendoza', email: 'carlos@example.com', type: 'user', joined: '2025-10-12' },
  ];

  const pendingDestinations = [
    {
      id: 1,
      name: 'Mayon Volcano',
      location: 'Albay, Philippines',
      submittedBy: 'Juan dela Cruz',
      status: 'pending',
    },
    {
      id: 2,
      name: 'Hundred Islands',
      location: 'Pangasinan, Philippines',
      submittedBy: 'Maria Santos',
      status: 'pending',
    },
    {
      id: 3,
      name: 'Taal Volcano',
      location: 'Batangas, Philippines',
      submittedBy: 'Sofia Reyes',
      status: 'pending',
    },
  ];

  const topRatedDestinations = [
    { name: 'Boracay White Beach', rating: 4.9, visits: 234 },
    { name: 'El Nido Lagoons', rating: 4.8, visits: 189 },
    { name: 'Chocolate Hills', rating: 4.7, visits: 156 },
  ];

  return (
    <div className={`min-h-screen pb-24 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
        : 'bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-500'
    }`}>
      <div className="pt-12 px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-yellow-400" size={32} />
            <h1 className="text-white text-3xl">Admin Dashboard</h1>
          </div>
          <p className="text-white/80">Manage your platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {adminStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <GlassCard key={index} className="p-4">
                <div className={`bg-gradient-to-br ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-3`}>
                  <Icon size={24} className="text-white" />
                </div>
                <p className="text-white/70 text-sm mb-1">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-white text-2xl">{stat.value}</p>
                  <span className="text-teal-300 text-sm">{stat.change}</span>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Recent Users */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl">Recent Users</h2>
            <button className="text-white/80 text-sm hover:text-white">View All</button>
          </div>

          <GlassCard className="overflow-hidden">
            {recentUsers.map((user, index) => (
              <div key={user.id}>
                <div className="p-4 flex items-center justify-between hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-teal-400 to-cyan-500 w-10 h-10 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">{user.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm mb-0.5">{user.name}</p>
                      <p className="text-white/60 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.type === 'admin'
                        ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                        : 'bg-white/10 text-white/70 border border-white/20'
                    }`}>
                      {user.type}
                    </span>
                    <p className="text-white/50 text-xs mt-1">
                      {new Date(user.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                {index < recentUsers.length - 1 && <div className="h-px bg-white/10 mx-4"></div>}
              </div>
            ))}
          </GlassCard>
        </div>

        {/* Pending Destinations */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl">Pending Approvals</h2>
            <span className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-sm border border-yellow-400/30">
              {pendingDestinations.length}
            </span>
          </div>

          <div className="space-y-3">
            {pendingDestinations.map((destination) => (
              <GlassCard key={destination.id} className="p-4">
                <div className="mb-3">
                  <h3 className="text-white mb-1">{destination.name}</h3>
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <MapPin size={14} />
                    <span>{destination.location}</span>
                  </div>
                  <p className="text-white/60 text-xs mt-2">Submitted by {destination.submittedBy}</p>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-gradient-to-r from-teal-400 to-cyan-500 text-white py-2.5 rounded-2xl shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 text-sm">
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-2xl border border-white/20 flex items-center justify-center gap-2 text-sm transition-all">
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Top Rated Destinations */}
        <div className="mb-6">
          <h2 className="text-white text-xl mb-4">Top Rated Destinations</h2>
          <div className="space-y-3">
            {topRatedDestinations.map((dest, index) => (
              <GlassCard key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center">
                      <span className="text-white text-xl">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-white mb-1">{dest.name}</p>
                      <p className="text-white/60 text-sm">{dest.visits} visits</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <svg
                        className="w-4 h-4 text-yellow-400 fill-current"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                      <span className="text-white text-sm">{dest.rating}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-white text-xl mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="p-4 text-center cursor-pointer hover:bg-white/30 transition-all">
              <Users className="text-white mx-auto mb-2" size={24} />
              <p className="text-white text-sm">Manage Users</p>
            </GlassCard>
            <GlassCard className="p-4 text-center cursor-pointer hover:bg-white/30 transition-all">
              <MapPin className="text-white mx-auto mb-2" size={24} />
              <p className="text-white text-sm">Destinations</p>
            </GlassCard>
            <GlassCard className="p-4 text-center cursor-pointer hover:bg-white/30 transition-all">
              <BarChart3 className="text-white mx-auto mb-2" size={24} />
              <p className="text-white text-sm">Analytics</p>
            </GlassCard>
            <GlassCard className="p-4 text-center cursor-pointer hover:bg-white/30 transition-all">
              <Shield className="text-white mx-auto mb-2" size={24} />
              <p className="text-white text-sm">Settings</p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
