import Link from 'next/link';
import { Zap, Car, Bike, Building2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto px-5">
      <nav className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-2 bg-accent">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-display text-lg font-semibold">Voltway</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-dim hover:text-txt">
            Log in
          </Link>
          <Link href="/register">
            <Button>Create account</Button>
          </Link>
        </div>
      </nav>

      <section className="grid md:grid-cols-2 gap-10 items-center py-14">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight">
            Find a charger. Any brand, car or bike.
          </h1>
          <p className="text-dim mt-5 text-lg max-w-md">
            Voltway connects riders, station operators, and administrators on one platform — live
            availability, one-tap booking, and real-time session tracking as you charge.
          </p>
          <div className="flex items-center gap-3 mt-8">
            <Link href="/register">
              <Button className="px-6 py-3 text-base">Get started</Button>
            </Link>
            <Link href="/login" className="text-sm text-dim hover:text-txt">
              I already have an account
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-bd bg-surface p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Car size={18} className="text-accent" />
            <span className="text-sm">CCS2, CHAdeMO, and Type 2 support for cars</span>
          </div>
          <div className="flex items-center gap-3">
            <Bike size={18} className="text-accent" />
            <span className="text-sm">Bharat AC001 support for two-wheelers</span>
          </div>
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-accent" />
            <span className="text-sm">Dashboards for station operators to manage a fleet</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-accent" />
            <span className="text-sm">Role-based access with JWT-secured accounts</span>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-5 py-10 border-t border-bd">
        <div>
          <div className="font-display text-2xl font-semibold">For riders</div>
          <p className="text-sm text-dim mt-2">
            See real nearby stations, filter by car or bike, check brand compatibility, and book in one tap.
          </p>
        </div>
        <div>
          <div className="font-display text-2xl font-semibold">For operators</div>
          <p className="text-sm text-dim mt-2">
            Monitor your stations live, track utilization and revenue, and manage status remotely.
          </p>
        </div>
        <div>
          <div className="font-display text-2xl font-semibold">For admins</div>
          <p className="text-sm text-dim mt-2">
            A network-wide view of stations, sessions, and riders — with alerts for stations that need attention.
          </p>
        </div>
      </section>

      <footer className="py-8 text-xs text-faint border-t border-bd">
        Station location data for cars is sourced from{' '}
        <a href="https://openchargemap.org" className="underline" target="_blank" rel="noreferrer">
          Open Charge Map
        </a>
        .
      </footer>
    </main>
  );
}
