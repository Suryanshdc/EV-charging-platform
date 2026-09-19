'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';

const roleHome = { RIDER: '/dashboard/rider', OPERATOR: '/dashboard/operator', ADMIN: '/dashboard/admin' } as const;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('rider@voltway.app');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      router.push(roleHome[user.role]);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not log in. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="rounded-lg p-2 bg-accent">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-display text-lg font-semibold">Voltway</span>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-bd bg-surface p-6 space-y-4">
          <h1 className="font-display text-xl font-semibold">Log in</h1>

          {error && <div className="text-sm text-off bg-off/10 border border-off/30 rounded-lg px-3 py-2">{error}</div>}

          <div>
            <label className="text-xs text-dim block mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 bg-raised border border-bd text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-dim block mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 bg-raised border border-bd text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>

          <p className="text-xs text-dim text-center">
            No account?{' '}
            <Link href="/register" className="text-accent">
              Create one
            </Link>
          </p>
          <p className="text-xs text-faint text-center pt-2 border-t border-bd">
            Demo accounts (seeded): rider@voltway.app, operator@voltway.app, admin@voltway.app — password: password123
          </p>
        </form>
      </div>
    </main>
  );
}
