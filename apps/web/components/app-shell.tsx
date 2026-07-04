'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { useTheme, colors, radius, spacing, typography } from '@aimeetx/ui';

import { useSession, useCurrentProfile } from '@/lib/sdk/hooks';
import { clearSession } from '@/lib/sdk/session-store';

interface AppShellProps {
  readonly children: ReactNode;
}

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactNode;
}

const navItems: ReadonlyArray<NavItem> = [
  { href: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { href: '/meetings', label: 'Meetings', icon: <MeetingsIcon /> },
  { href: '/recordings', label: 'Recordings', icon: <RecordingsIcon /> },
  { href: '/notifications', label: 'Notifications', icon: <NotificationsIcon /> },
  { href: '/profile', label: 'Profile', icon: <ProfileIcon /> },
  { href: '/settings', label: 'Settings', icon: <SettingsIcon /> },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session] = useSession();
  const { profile } = useCurrentProfile();
  const { mode, setMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!session) {
      router.replace('/login');
    }
  }, [session, router]);

  if (!session) {
    return null;
  }

  const isDark = mode === 'dark';
  const palette = isDark ? colors.dark : colors.light;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gridTemplateRows: '60px 1fr',
        gridTemplateAreas: '"topbar topbar" "sidebar main"',
        backgroundColor: palette.background,
        color: palette.text,
        fontFamily: typography.fontFamily.sans,
      }}
    >
      <header
        style={{
          gridArea: 'topbar',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${spacing.xl}`,
          backgroundColor: palette.surface,
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            textDecoration: 'none',
            color: colors.brand.primary,
            fontWeight: typography.fontWeight.bold,
            fontSize: typography.fontSize.lg,
          }}
        >
          <Logo />
          AI MeetX
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'system')}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: radius.md,
              border: `1px solid ${palette.border}`,
              backgroundColor: palette.background,
              color: palette.text,
              fontSize: typography.fontSize.sm,
            }}
            aria-label="Theme"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              cursor: 'pointer',
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: radius.md,
            }}
            onClick={() => setMenuOpen((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setMenuOpen((v) => !v);
            }}
          >
            <Avatar name={profile?.displayName ?? 'User'} src={profile?.avatarUrl ?? null} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>
                {profile?.displayName ?? 'Loading...'}
              </span>
              <span style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary }}>
                {profile?.email ?? ''}
              </span>
            </div>
          </div>
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '54px',
                right: spacing.lg,
                backgroundColor: palette.surface,
                border: `1px solid ${palette.border}`,
                borderRadius: radius.md,
                boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
                padding: spacing.xs,
                minWidth: '160px',
                zIndex: 50,
              }}
            >
              <Link
                href="/profile"
                style={menuItemStyle(palette)}
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/settings"
                style={menuItemStyle(palette)}
                onClick={() => setMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  setMenuOpen(false);
                  router.replace('/login');
                }}
                style={{
                  ...menuItemStyle(palette),
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  width: '100%',
                  cursor: 'pointer',
                  color: colors.semantic.error,
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <nav
        style={{
          gridArea: 'sidebar',
          backgroundColor: palette.surface,
          borderRight: `1px solid ${palette.border}`,
          padding: spacing.lg,
        }}
      >
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderRadius: radius.md,
                    backgroundColor: active ? colors.brand.primary : 'transparent',
                    color: active ? '#FFFFFF' : palette.text,
                    textDecoration: 'none',
                    fontSize: typography.fontSize.base,
                    fontWeight: active ? typography.fontWeight.semibold : typography.fontWeight.normal,
                    transition: 'background-color 150ms ease',
                  }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <main
        style={{
          gridArea: 'main',
          padding: spacing.xl,
          overflow: 'auto',
        }}
      >
        {children}
      </main>
    </div>
  );
}

type Palette = {
  readonly background: string;
  readonly surface: string;
  readonly surfaceVariant: string;
  readonly border: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly textDisabled: string;
};

function menuItemStyle(palette: Palette): React.CSSProperties {
  return {
    display: 'block',
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: radius.sm,
    color: palette.text,
    textDecoration: 'none',
    fontSize: typography.fontSize.sm,
    cursor: 'pointer',
  };
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} style={{ width: 32, height: 32, borderRadius: radius.full, objectFit: 'cover' }} />;
  }
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: radius.full,
        backgroundColor: colors.brand.primary,
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
      }}
    >
      {initial}
    </div>
  );
}

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="4" width="20" height="14" rx="3" fill={colors.brand.primary} />
      <circle cx="12" cy="11" r="3" fill="#FFFFFF" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  );
}

function MeetingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10l5-3v10l-5-3z" />
    </svg>
  );
}

function RecordingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
    </svg>
  );
}

function NotificationsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2v1h16v-1z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
