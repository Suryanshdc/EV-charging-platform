'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Zap, Users, ShieldCheck } from 'lucide-react';
import { RequireAuth } from '@/components/RequireAuth';
import { Navbar } from '@/components/Navbar';
import { api } from '@/lib/api';

interface Overview {
  totalUsers: number;
  totalStations: number;
  activeSessions: number;
  usersByRole: Record<string, number>;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

function StatBlock({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-xl p-4 flex items-start gap-3 bg-surface border border-bd">
      <div className="rounded-lg p-2 bg-accent/10 text-accent shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <div className="font-data text-xl leading-none">{value}</div>
        <div className="text-xs mt-1 text-dim">{label}</div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => (await api.get<Overview>('/api/users/stats/overview')).data,
  });

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => (await api.get<{ users: AdminUser[] }>('/api/users')).data.users,
  });

  const overview = overviewQuery.data;
  const users = usersQuery.data ?? [];

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <Navbar />
      <div className="px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatBlock icon={Building2} label="Total stations" value={overview?.totalStations ?? '—'} />
          <StatBlock icon={Zap} label="Active sessions now" value={overview?.activeSessions ?? '—'} />
          <StatBlock icon={Users} label="Registered users" value={overview?.totalUsers ?? '—'} />
          <StatBlock icon={ShieldCheck} label="Operators" value={overview?.usersByRole?.OPERATOR ?? 0} />
        </div>

        <div className="rounded-xl overflow-hidden bg-surface border border-bd">
          <div className="grid grid-cols-4 text-xs px-4 py-2 border-b border-bd text-dim">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Joined</span>
          </div>
          {usersQuery.isLoading && <div className="px-4 py-3 text-sm text-dim">Loading users…</div>}
          {users.map((u) => (
            <div key={u.id} className="grid grid-cols-4 items-center text-sm px-4 py-3 border-b border-bd">
              <span>{u.name}</span>
              <span className="text-dim">{u.email}</span>
              <span className="text-dim">{u.role}</span>
              <span className="text-dim">{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth role="ADMIN">
      <AdminDashboard />
    </RequireAuth>
  );
}
