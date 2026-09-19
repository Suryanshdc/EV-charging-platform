export function Chip({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'accent' | 'good' }) {
  const toneCls =
    tone === 'accent'
      ? 'bg-accent/10 text-accent border-accent/30'
      : tone === 'good'
      ? 'bg-avail/10 text-avail border-avail/30'
      : 'bg-white/5 text-dim border-bd';
  return (
    <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 border whitespace-nowrap ${toneCls}`}>
      {children}
    </span>
  );
}

const statusMeta = {
  AVAILABLE: { label: 'Available now', className: 'bg-avail' },
  CHARGING: { label: 'Charging in progress', className: 'bg-charge' },
  RESERVED: { label: 'Reserved', className: 'bg-reserve' },
  OFFLINE: { label: 'Offline', className: 'bg-off' },
} as const;

export function StatusDot({ status, pulse = false }: { status: keyof typeof statusMeta; pulse?: boolean }) {
  const meta = statusMeta[status];
  return (
    <span className="relative inline-flex items-center justify-center w-2.5 h-2.5">
      {pulse && <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${meta.className}`} />}
      <span className={`relative rounded-full w-2 h-2 ${meta.className}`} />
    </span>
  );
}

export function statusLabel(status: keyof typeof statusMeta) {
  return statusMeta[status].label;
}
