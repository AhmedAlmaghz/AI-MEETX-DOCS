'use client';

import { useEffect, useState } from 'react';

import { useTheme, Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type {
  AccessibilitySettings,
  NotificationSettings,
  Presence,
  PrivacySettings,
  Theme,
  UserProfile,
} from '@aimeetx/sdk';

import { useCurrentProfile, useSession } from '@/lib/sdk/hooks';
import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { TOKENS } from '@aimeetx/sdk';

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

export default function SettingsPage() {
  ensureSdkInitialized();
  const [session] = useSession();
  const { profile, loading, reload } = useCurrentProfile();
  const { setMode } = useTheme();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3_000);
      return () => clearTimeout(t);
    }
    return;
  }, [error, success]);

  if (loading || !profile || !session) {
    return <p style={{ color: colors.light.textSecondary }}>Loading settings...</p>;
  }

  const updateProfile = async (patch: Partial<UserProfile>) => {
    setSaving(true);
    setError(null);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').UpdateProfileUseCase>
      >(TOKENS.UpdateProfileUseCase).execute({
        userId: session.userId,
        update: patch,
      });
      if (result.isFailure) {
        setError(result.error.message);
      } else {
        setSuccess('Settings updated');
        await reload();
      }
    } finally {
      setSaving(false);
    }
  };

  const updateNotifications = async (settings: NotificationSettings) => {
    setSaving(true);
    setError(null);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').UpdateNotificationSettingsUseCase>
      >(TOKENS.UpdateNotificationSettingsUseCase).execute({
        userId: session.userId,
        settings,
      });
      if (result.isFailure) {
        setError(result.error.message);
      } else {
        setSuccess('Notification settings updated');
        await reload();
      }
    } finally {
      setSaving(false);
    }
  };

  const updatePrivacy = async (settings: PrivacySettings) => {
    setSaving(true);
    setError(null);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').UpdatePrivacySettingsUseCase>
      >(TOKENS.UpdatePrivacySettingsUseCase).execute({
        userId: session.userId,
        settings,
      });
      if (result.isFailure) {
        setError(result.error.message);
      } else {
        setSuccess('Privacy settings updated');
        await reload();
      }
    } finally {
      setSaving(false);
    }
  };

  const updateAccessibility = async (settings: AccessibilitySettings) => {
    setSaving(true);
    setError(null);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').UpdateAccessibilitySettingsUseCase>
      >(TOKENS.UpdateAccessibilitySettingsUseCase).execute({
        userId: session.userId,
        settings,
      });
      if (result.isFailure) {
        setError(result.error.message);
      } else {
        setSuccess('Accessibility settings updated');
        await reload();
      }
    } finally {
      setSaving(false);
    }
  };

  const updatePresence = async (presence: Presence) => {
    setSaving(true);
    setError(null);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').UpdatePresenceUseCase>
      >(TOKENS.UpdatePresenceUseCase).execute({
        userId: session.userId,
        presence,
      });
      if (result.isFailure) {
        setError(result.error.message);
      } else {
        setSuccess('Presence updated');
        await reload();
      }
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    if (!confirm('Are you sure you want to deactivate your account?')) return;
    await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').DeactivateAccountUseCase>>(
      TOKENS.DeactivateAccountUseCase,
    ).execute({ userId: session.userId });
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, maxWidth: 720 }}>
      <h1
        style={{
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.light.text,
        }}
      >
        Settings
      </h1>

      {(error || success) && (
        <div
          style={{
            padding: spacing.sm,
            backgroundColor: error ? '#FEE2E2' : '#D1FAE5',
            color: error ? colors.semantic.error : colors.semantic.success,
            border: `1px solid ${error ? colors.semantic.error : colors.semantic.success}`,
            borderRadius: radius.md,
            fontSize: typography.fontSize.sm,
          }}
        >
          {error ?? success}
        </div>
      )}

      <Section title="Appearance" palette={colors.light}>
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
          {THEME_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={profile.theme === opt.value ? 'primary' : 'secondary'}
              size="sm"
              disabled={saving}
              onClick={() => {
                void updateProfile({ theme: opt.value });
                setMode(opt.value);
              }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Notifications" palette={colors.light}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <Toggle
            label="Meeting notifications"
            checked={profile.notifications.meetingEnabled}
            disabled={saving}
            onChange={(v) => {
              void updateNotifications({ ...profile.notifications, meetingEnabled: v });
            }}
          />
          <Toggle
            label="Chat notifications"
            checked={profile.notifications.chatEnabled}
            disabled={saving}
            onChange={(v) => {
              void updateNotifications({ ...profile.notifications, chatEnabled: v });
            }}
          />
          <Toggle
            label="Push notifications"
            checked={profile.notifications.pushEnabled}
            disabled={saving}
            onChange={(v) => {
              void updateNotifications({ ...profile.notifications, pushEnabled: v });
            }}
          />
          <Toggle
            label="Reminder notifications"
            checked={profile.notifications.reminderEnabled}
            disabled={saving}
            onChange={(v) => {
              void updateNotifications({ ...profile.notifications, reminderEnabled: v });
            }}
          />
        </div>
      </Section>

      <Section title="Privacy" palette={colors.light}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <label style={{ fontSize: 14, color: colors.light.text, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Profile visibility</span>
            <select
              value={profile.privacy.profileVisibility}
              disabled={saving}
              onChange={(e) => {
                void updatePrivacy({
                  ...profile.privacy,
                  profileVisibility: e.target.value as 'public' | 'private' | 'contacts_only',
                });
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${colors.light.border}`,
                backgroundColor: colors.light.background,
                color: colors.light.text,
                fontSize: 14,
                maxWidth: 240,
              }}
            >
              <option value="public">Public</option>
              <option value="contacts_only">Contacts only</option>
              <option value="private">Private</option>
            </select>
          </label>
          <Toggle
            label="Show online status"
            checked={profile.privacy.onlineStatusVisible}
            disabled={saving}
            onChange={(v) => {
              void updatePrivacy({ ...profile.privacy, onlineStatusVisible: v });
            }}
          />
          <Toggle
            label="Read receipts"
            checked={profile.privacy.readReceiptsEnabled}
            disabled={saving}
            onChange={(v) => {
              void updatePrivacy({ ...profile.privacy, readReceiptsEnabled: v });
            }}
          />
          <Toggle
            label="Show activity status"
            checked={profile.privacy.activityVisible}
            disabled={saving}
            onChange={(v) => {
              void updatePrivacy({ ...profile.privacy, activityVisible: v });
            }}
          />
        </div>
      </Section>

      <Section title="Accessibility" palette={colors.light}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <label style={{ fontSize: 14, color: colors.light.text, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Font scale: {profile.accessibility.fontScale.toFixed(1)}x</span>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={profile.accessibility.fontScale}
              disabled={saving}
              onChange={(e) => {
                void updateAccessibility({
                  ...profile.accessibility,
                  fontScale: parseFloat(e.target.value),
                });
              }}
              style={{ maxWidth: 300 }}
            />
          </label>
          <Toggle
            label="High contrast"
            checked={profile.accessibility.highContrast}
            disabled={saving}
            onChange={(v) => {
              void updateAccessibility({ ...profile.accessibility, highContrast: v });
            }}
          />
          <Toggle
            label="Reduce animations"
            checked={profile.accessibility.reduceAnimations}
            disabled={saving}
            onChange={(v) => {
              void updateAccessibility({ ...profile.accessibility, reduceAnimations: v });
            }}
          />
          <Toggle
            label="Screen reader hints"
            checked={profile.accessibility.screenReaderHints}
            disabled={saving}
            onChange={(v) => {
              void updateAccessibility({ ...profile.accessibility, screenReaderHints: v });
            }}
          />
        </div>
      </Section>

      <Section title="Presence" palette={colors.light}>
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
          {PRESENCE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={profile.presence === opt.value ? 'primary' : 'secondary'}
              size="sm"
              disabled={saving}
              onClick={() => {
                void updatePresence(opt.value);
              }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Danger zone" palette={colors.light}>
        <p style={{ color: colors.light.textSecondary, fontSize: typography.fontSize.sm, marginBottom: spacing.sm }}>
          Deactivating your account will disable access. You can reactivate by contacting support.
        </p>
        <Button variant="danger" onClick={() => void deactivate()}>
          Deactivate account
        </Button>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
  palette,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly palette: typeof colors.light;
}) {
  return (
    <section
      style={{
        padding: spacing.lg,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: radius.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
    >
      <h2
        style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: palette.text,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
  readonly disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        fontSize: typography.fontSize.base,
        color: colors.light.text,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 18, height: 18, cursor: 'inherit' }}
      />
      {label}
    </label>
  );
}
