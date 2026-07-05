'use client';

import { useEffect, useState, useCallback } from 'react';

import { useTheme, Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { AccessibilitySettings, NotificationSettings, Presence, PrivacySettings, Theme, UserProfile } from '@aimeetx/sdk';

import { useCurrentProfile, useSession } from '@/lib/sdk/hooks';
import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { TOKENS } from '@aimeetx/sdk';
import { usePalette } from '@/lib/hooks';
import { PageHeader, PageLayout, LoadingScreen } from '@/components/ui';

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'privacy' | 'accessibility' | 'language' | 'presence' | 'danger';

const SETTINGS_TABS: ReadonlyArray<{ key: SettingsTab; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'language', label: 'Language' },
  { key: 'presence', label: 'Presence' },
  { key: 'danger', label: 'Danger zone' },
];

const PRESENCE_OPTIONS: ReadonlyArray<{ value: Presence; label: string }> = [
  { value: 'online', label: 'Online' },
  { value: 'away', label: 'Away' },
  { value: 'busy', label: 'Busy' },
  { value: 'in_meeting', label: 'In meeting' },
  { value: 'do_not_disturb', label: 'Do not disturb' },
];

const THEME_OPTIONS: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const LANGUAGE_OPTIONS: ReadonlyArray<{ code: string; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
];

export default function SettingsPage() {
  ensureSdkInitialized();
  const [session] = useSession();
  const { profile, loading, reload } = useCurrentProfile();
  const { setMode } = useTheme();
  const { palette } = usePalette();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => { if (profile) setDisplayName(profile.displayName); }, [profile]);

  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => { setError(null); setSuccess(null); }, 3000);
      return () => clearTimeout(t);
    }
  }, [error, success]);

  const notify = useCallback((err: string | null, ok: string | null) => {
    setError(err); setSuccess(ok);
  }, []);

  if (loading) return <LoadingScreen text="Loading settings..." />;
  if (!profile || !session) return <p style={{ color: palette.textSecondary }}>Unable to load profile.</p>;

  const updateProfile = async (patch: Partial<UserProfile>) => {
    setSaving(true); notify(null, null);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').UpdateProfileUseCase>>(TOKENS.UpdateProfileUseCase).execute({ userId: session.userId, update: patch });
      if (r.isFailure) notify(r.error.message, null);
      else { notify(null, 'Saved'); await reload(); }
    } finally { setSaving(false); }
  };

  const updateNotifications = async (settings: NotificationSettings) => {
    setSaving(true); notify(null, null);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').UpdateNotificationSettingsUseCase>>(TOKENS.UpdateNotificationSettingsUseCase).execute({ userId: session.userId, settings });
      if (r.isFailure) notify(r.error.message, null);
      else { notify(null, 'Notification settings saved'); await reload(); }
    } finally { setSaving(false); }
  };

  const updatePrivacy = async (settings: PrivacySettings) => {
    setSaving(true); notify(null, null);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').UpdatePrivacySettingsUseCase>>(TOKENS.UpdatePrivacySettingsUseCase).execute({ userId: session.userId, settings });
      if (r.isFailure) notify(r.error.message, null);
      else { notify(null, 'Privacy settings saved'); await reload(); }
    } finally { setSaving(false); }
  };

  const updateAccessibility = async (settings: AccessibilitySettings) => {
    setSaving(true); notify(null, null);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').UpdateAccessibilitySettingsUseCase>>(TOKENS.UpdateAccessibilitySettingsUseCase).execute({ userId: session.userId, settings });
      if (r.isFailure) notify(r.error.message, null);
      else { notify(null, 'Accessibility settings saved'); await reload(); }
    } finally { setSaving(false); }
  };

  const updateLanguage = async (language: string, translationLanguage?: string, subtitleLanguage?: string) => {
    setSaving(true); notify(null, null);
    try {
      const fields: Record<string, string> = {};
      if (language) fields.preferredLanguage = language;
      if (translationLanguage !== undefined) fields.translationLanguage = translationLanguage;
      if (subtitleLanguage !== undefined) fields.subtitleLanguage = subtitleLanguage;
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').UpdateProfileUseCase>>(TOKENS.UpdateProfileUseCase).execute({ userId: session.userId, update: fields });
      if (r.isFailure) notify(r.error.message, null);
      else { notify(null, 'Language preferences saved'); await reload(); }
    } finally { setSaving(false); }
  };

  const updatePresence = async (presence: Presence) => {
    setSaving(true); notify(null, null);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').UpdatePresenceUseCase>>(TOKENS.UpdatePresenceUseCase).execute({ userId: session.userId, presence });
      if (r.isFailure) notify(r.error.message, null);
      else { notify(null, 'Presence updated'); await reload(); }
    } finally { setSaving(false); }
  };

  const deactivate = async () => {
    if (!confirm('Are you sure you want to deactivate your account? This action can be reversed by contacting support.')) return;
    await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').DeactivateAccountUseCase>>(TOKENS.DeactivateAccountUseCase).execute({ userId: session.userId });
    window.location.href = '/login';
  };

  return (
    <PageLayout>
      <PageHeader title="Settings" />

      <div style={{ display: 'flex', gap: spacing.xl, maxWidth: 960 }}>
        <nav style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: spacing.xs }} role="tablist" aria-label="Settings tabs">
          {SETTINGS_TABS.map((t) => (
            <button
              key={t.key} type="button" role="tab"
              aria-selected={activeTab === t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: `${spacing.sm} ${spacing.md}`, borderRadius: radius.md, border: 'none',
                backgroundColor: activeTab === t.key ? colors.brand.primary : 'transparent',
                color: activeTab === t.key ? '#FFFFFF' : palette.text, cursor: 'pointer',
                fontSize: typography.fontSize.sm, textAlign: 'left',
                fontWeight: activeTab === t.key ? typography.fontWeight.semibold : typography.fontWeight.normal,
                transition: 'background-color 150ms ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {(error || success) && (
            <div style={{ padding: spacing.sm, backgroundColor: error ? '#FEE2E2' : '#D1FAE5', color: error ? colors.semantic.error : colors.semantic.success, border: `1px solid ${error ? colors.semantic.error : colors.semantic.success}`, borderRadius: radius.md, fontSize: typography.fontSize.sm }}>
              {error ?? success}
            </div>
          )}

          {activeTab === 'profile' && (
            <Section title="Profile" palette={palette}>
              <label style={labelStyle(palette)}>
                <span>Display name</span>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle(palette, { maxWidth: 360 })} />
              </label>
              <div><Button variant="primary" size="sm" disabled={saving || displayName === profile.displayName} onClick={() => void updateProfile({ displayName })}>{saving ? 'Saving...' : 'Save'}</Button></div>
              <div style={{ padding: spacing.md, backgroundColor: palette.surfaceVariant, borderRadius: radius.md, fontSize: typography.fontSize.sm, color: palette.textSecondary }}>
                <strong>Email:</strong> {profile.email}<br />
                <strong>Role:</strong> {profile.role}<br />
                <strong>Account status:</strong> {profile.status}
              </div>
            </Section>
          )}

          {activeTab === 'appearance' && (
            <Section title="Appearance" palette={palette}>
              <label style={labelStyle(palette)}>
                <span>Theme</span>
                <div style={{ display: 'flex', gap: spacing.sm }}>
                  {THEME_OPTIONS.map((opt) => (
                    <Button key={opt.value} variant={profile.theme === opt.value ? 'primary' : 'secondary'} size="sm" disabled={saving} onClick={() => { void updateProfile({ theme: opt.value }); setMode(opt.value); }}>
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </label>
              <label style={labelStyle(palette)}>
                <span>Font scale: {profile.accessibility.fontScale.toFixed(1)}x</span>
                <input type="range" min={0.5} max={2.0} step={0.1} value={profile.accessibility.fontScale} disabled={saving} onChange={(e) => { void updateAccessibility({ ...profile.accessibility, fontScale: parseFloat(e.target.value) }); }} style={{ maxWidth: 300 }} />
              </label>
            </Section>
          )}

          {activeTab === 'notifications' && (
            <Section title="Notifications" palette={palette}>
              <Toggle label="Meeting notifications" checked={profile.notifications.meetingEnabled} palette={palette} onChange={(v) => void updateNotifications({ ...profile.notifications, meetingEnabled: v })} />
              <Toggle label="Chat notifications" checked={profile.notifications.chatEnabled} palette={palette} onChange={(v) => void updateNotifications({ ...profile.notifications, chatEnabled: v })} />
              <Toggle label="Push notifications" checked={profile.notifications.pushEnabled} palette={palette} onChange={(v) => void updateNotifications({ ...profile.notifications, pushEnabled: v })} />
              <Toggle label="Reminder notifications" checked={profile.notifications.reminderEnabled} palette={palette} onChange={(v) => void updateNotifications({ ...profile.notifications, reminderEnabled: v })} />
            </Section>
          )}

          {activeTab === 'privacy' && (
            <Section title="Privacy" palette={palette}>
              <label style={labelStyle(palette)}>
                <span>Profile visibility</span>
                <select value={profile.privacy.profileVisibility} onChange={(e) => void updatePrivacy({ ...profile.privacy, profileVisibility: e.target.value as 'public' | 'private' | 'contacts_only' })} style={inputStyle(palette, { maxWidth: 240 })}>
                  <option value="public">Public</option>
                  <option value="contacts_only">Contacts only</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <Toggle label="Show online status" checked={profile.privacy.onlineStatusVisible} palette={palette} onChange={(v) => void updatePrivacy({ ...profile.privacy, onlineStatusVisible: v })} />
              <Toggle label="Read receipts" checked={profile.privacy.readReceiptsEnabled} palette={palette} onChange={(v) => void updatePrivacy({ ...profile.privacy, readReceiptsEnabled: v })} />
              <Toggle label="Show activity status" checked={profile.privacy.activityVisible} palette={palette} onChange={(v) => void updatePrivacy({ ...profile.privacy, activityVisible: v })} />
            </Section>
          )}

          {activeTab === 'accessibility' && (
            <Section title="Accessibility" palette={palette}>
              <Toggle label="High contrast" checked={profile.accessibility.highContrast} palette={palette} onChange={(v) => void updateAccessibility({ ...profile.accessibility, highContrast: v })} />
              <Toggle label="Reduce animations" checked={profile.accessibility.reduceAnimations} palette={palette} onChange={(v) => void updateAccessibility({ ...profile.accessibility, reduceAnimations: v })} />
              <Toggle label="Screen reader hints" checked={profile.accessibility.screenReaderHints} palette={palette} onChange={(v) => void updateAccessibility({ ...profile.accessibility, screenReaderHints: v })} />
            </Section>
          )}

          {activeTab === 'language' && (
            <Section title="Language Preferences" palette={palette}>
              <LangSelect label="UI language" value={profile.preferredLanguage} palette={palette} onChange={(v) => void updateLanguage(v, profile.translationLanguage, profile.subtitleLanguage)} />
              <LangSelect label="Translation language" value={profile.translationLanguage} palette={palette} onChange={(v) => void updateLanguage(profile.preferredLanguage, v, profile.subtitleLanguage)} />
              <LangSelect label="Subtitle language" value={profile.subtitleLanguage} palette={palette} onChange={(v) => void updateLanguage(profile.preferredLanguage, profile.translationLanguage, v)} />
            </Section>
          )}

          {activeTab === 'presence' && (
            <Section title="Presence" palette={palette}>
              <p style={{ fontSize: typography.fontSize.sm, color: palette.textSecondary, margin: 0 }}>Set your current availability status.</p>
              <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
                {PRESENCE_OPTIONS.map((opt) => (
                  <Button key={opt.value} variant={profile.presence === opt.value ? 'primary' : 'secondary'} size="sm" disabled={saving} onClick={() => void updatePresence(opt.value)}>
                    {opt.label}
                  </Button>
                ))}
              </div>
            </Section>
          )}

          {activeTab === 'danger' && (
            <Section title="Danger zone" palette={palette}>
              <p style={{ color: palette.textSecondary, fontSize: typography.fontSize.sm, margin: 0 }}>
                Deactivating your account will disable access. You can reactivate by contacting support.
              </p>
              <Button variant="danger" onClick={() => void deactivate()}>Deactivate account</Button>
            </Section>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function Section({ title, children, palette }: { readonly title: string; readonly children: React.ReactNode; readonly palette: ReturnType<typeof usePalette>['palette'] }) {
  return (
    <section style={{ padding: spacing.lg, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.lg, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <h2 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: palette.text, margin: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

function Toggle({ label, checked, onChange, palette }: { readonly label: string; readonly checked: boolean; readonly onChange: (v: boolean) => void; readonly palette: ReturnType<typeof usePalette>['palette'] }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, fontSize: typography.fontSize.base, color: palette.text, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, cursor: 'inherit' }} />
      {label}
    </label>
  );
}

function LangSelect({ label, value, onChange, palette }: { readonly label: string; readonly value: string; readonly onChange: (v: string) => void; readonly palette: ReturnType<typeof usePalette>['palette'] }) {
  return (
    <label style={labelStyle(palette)}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle(palette, { maxWidth: 240 })}>
        {LANGUAGE_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </label>
  );
}

function labelStyle(palette: ReturnType<typeof usePalette>['palette']): React.CSSProperties {
  return { display: 'flex', flexDirection: 'column', gap: 4, fontSize: typography.fontSize.sm, color: palette.text };
}

function inputStyle(palette: ReturnType<typeof usePalette>['palette'], extra?: React.CSSProperties): React.CSSProperties {
  return { padding: spacing.sm, borderRadius: radius.md, border: `1px solid ${palette.border}`, backgroundColor: palette.background, color: palette.text, fontSize: typography.fontSize.sm, ...extra };
}
