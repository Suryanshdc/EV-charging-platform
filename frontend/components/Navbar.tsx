'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/Button';
import { StatusDot } from './ui/Badge';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-5 pt-5">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="rounded-lg p-2 bg-accent">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <div className="font-display text-lg font-semibold leading-none">Voltway</div>
          <div className="text-xs text-faint mt-0.5">EV charging, mapped and managed</div>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-avail/10 text-avail border border-avail/30">
          <StatusDot status="AVAILABLE" pulse />
          Live
        </span>
        {user && (
          <>
            <span className="text-sm text-dim hidden sm:inline">{user.name}</span>
            <Button variant="secondary" onClick={logout}>
              Log out
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
