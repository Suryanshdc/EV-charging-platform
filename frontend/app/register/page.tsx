'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';

const roleHome = { RIDER: '/dashboard/rider', OPERATOR: '/dashboard/operator', ADMIN: '/dashboard/admin' } as const;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'RIDER' | 'OPERATOR'>('RIDER');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await register(name, email, password, role);
      router.push(roleHome[user.role]);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not create your account.');
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
          <h1 className="font-display text-xl font-semibold">Create your account</h1>

          {error && <div className="text-sm text-off bg-off/10 border border-off/30 rounded-lg px-3 py-2">{error}</div>}

          <div>
            <label className="text-xs text-dim block mb-1.5">Full name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 bg-raised border border-bd text-sm focus:outline-none focus:border-accent"
            />
          </div>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 bg-raised border border-bd text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-dim block mb-1.5">I am a</label>
            <div className="flex gap-2">
              {(['RIDER', 'OPERATOR'] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 text-sm px-3 py-2 rounded-lg border ${
                    role === r ? 'bg-accent text-white border-accent' : 'bg-raised border-bd text-dim'
                  }`}
                >
                  {r === 'RIDER' ? 'Rider' : 'Station operator'}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>

          <p className="text-xs text-dim text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-accent">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
