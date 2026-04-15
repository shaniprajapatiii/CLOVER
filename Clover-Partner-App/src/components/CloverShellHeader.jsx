
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clover, ChevronRight, Menu, X } from 'lucide-react';

const defaultNavItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Earnings', to: '/earnings' },
  { label: 'Delivery', to: '/active-delivery' },
  { label: 'Profile', to: '/profile' },
  { label: 'Support', to: '/support' }
];

export const CloverShellHeader = ({
  title,
  subtitle,
  eyebrow = 'Clover partner',
  badge,
  actions = [],
  navItems = defaultNavItems
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="page-card sticky top-3 z-20 overflow-hidden">
      <div className="bg-gradient-to-r from-white via-white to-emerald-50/70 px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4 lg:items-center">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg">
              <Clover size={26} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{eyebrow}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p>}
              {badge && <div className="mt-3 hidden lg:flex">{badge}</div>}
            </div>
          </div>

          <div className="hidden flex-wrap items-center justify-end gap-2 lg:flex">
            {actions.map((action, index) => (
              <button
                key={`${action.label}-${index}`}
                type="button"
                onClick={action.onClick}
                className={`inline-flex items-center gap-2 rounded-[1.15rem] px-4 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${
                  action.tone === 'danger'
                    ? 'border border-rose-200 bg-rose-50 text-rose-700 shadow-sm hover:shadow-md'
                    : action.tone === 'secondary'
                      ? 'border border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:shadow-md'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-[0_16px_30px_rgba(16,185,129,0.22)]'
                }`}
              >
                {action.icon}
                {action.label}
                {action.chevron !== false && <ChevronRight size={14} />}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div className="hidden border-t border-white/70 bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:block">
        <div className="flex flex-wrap gap-3">
          {navItems.map((item) => {
            const active = location.pathname === item.to;

            return (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate(item.to)}
                className={`rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition hover:-translate-y-0.5 ${
                  active
                    ? 'bg-slate-950 text-white shadow-lg'
                    : 'border border-slate-200 bg-white/90 text-slate-700 hover:border-emerald-200 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/70 bg-white/95 px-4 py-4 backdrop-blur-sm lg:hidden sm:px-6">
          {badge && <div className="mb-4">{badge}</div>}

          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {navItems.map((item) => {
                const active = location.pathname === item.to;

                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => navigate(item.to)}
                    className={`rounded-full px-4 py-3 text-sm font-bold uppercase tracking-wider transition ${
                      active
                        ? 'bg-slate-950 text-white shadow-lg'
                        : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 pt-3 sm:grid-cols-2">
              {actions.map((action, index) => (
                <button
                  key={`${action.label}-${index}`}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    action.onClick?.();
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-[1.15rem] px-4 py-3 text-sm font-bold transition ${
                    action.tone === 'danger'
                      ? 'border border-rose-200 bg-rose-50 text-rose-700'
                      : action.tone === 'secondary'
                        ? 'border border-slate-200 bg-white text-slate-700'
                        : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white'
                  }`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default CloverShellHeader;