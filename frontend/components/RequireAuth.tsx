'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type Role } from '@/lib/auth-context';

const homeForRole: Record<Role, string> = {
  RIDER: '/dashboard/rider',
  OPERATOR: '/dashboard/operator',
  ADMIN: '/dashboard/admin',
};

export function RequireAuth({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== role) {
      router.replace(homeForRole[user.role]);
    }
  }, [user, loading, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center text-dim text-sm">
        Loading your dashboard&hellip;
      </div>
    );
  }

  return <>{children}</>;
}
