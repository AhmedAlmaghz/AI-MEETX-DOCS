'use client';

import { useEffect, useState } from 'react';

import { Button, colors, radius, spacing, typography } from '@aimeetx/ui';

import { useProfileViewModel } from '@/components/profile-view-model';
import { useTheme } from '@aimeetx/ui';

// Demo user ID — in production, this would come from the auth session
const DEMO_USER_ID = 'user_demo_123' as unknown as import('@aimeetx/types').UserId;

/**
 * AccountSettingsScreen — manage user preferences, notifications, privacy, and accessibility.
 *
 * Per `feature-profile/SPECIFICATION.md`: AccountSettingsScreen with theme, language, notifications, privacy.
 * Per `feature-profile/REQUIREMENTS.md` PROFILE-FR-004/005/006/007/008: language, theme, notifications, accessibility, privacy.
 */
export default function AccountSettingsScreen() {
  const vm = useProfileViewModel(DEMO_USER_ID);
  const { mode: themeMode, setMode: setThemeMode } = useTheme();

  // Load profile on mount
  useEffect(() => {
    vm.loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (vm.state.status === 'loading' || vm.state.status === 'idle') {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.light.background,
          fontFamily: typography.fontFamily.sans,
        }}
      >
        <p style={{ color: colors.light.textSecondary }}>Loading settings...</p>
      </main>
    );
  }

  if (vm.state.status === 'error') {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.light.background,
          fontFamily: typography.fontFamily.sans,
        }}
      >
        <div
          style={{
            padding: spacing.lg,
            backgroundColor: '#FEE2E2',
            border: `1px solid ${colors.semantic.error}`,
            borderRadius: radius.md,
            color: colors.semantic.error,
          }}
        >
          Error: {vm.state.error}
        </div>
      </main>
    );
  }

  const profile = vm.state.status === 'loaded' || vm.state.status === 'updating' ? vm.state.profile : null;
  if (!profile) return null;

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: spacing.xl,
        backgroundColor: colors.light.background,
        fontFamily: typography.fontFamily.sans,
      }}
    >
      <div
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          padding: spacing.xl,
          backgroundColor: colors.light.surface,
          border: `1px solid ${colors.light.border}`,
          borderRadius: radius.lg,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h1
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing.lg,
            color: colors.light.text,
          }}
        >
          Account Settings
        </h1>

        {/* Theme Section */}
        <SettingsSection title="Theme">
          <p style={{ fontSize: typography.fontSize.sm, color: colors.light.textSecondary, marginBottom: spacing.sm }}>
            Choose how AI MeetX looks. Changes apply instantly.
          </p>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            {(['light', 'dark', 'system'] as const).map((t) => (
              <Button
                key={t}
                variant={themeMode === t ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setThemeMode(t);
                  vm.updateTheme(t);
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        </SettingsSection>

        {/* Language Section */}
        <SettingsSection title="Language">
          <p style={{ fontSize: typography.fontSize.sm, color: colors.light.textSecondary, marginBottom: spacing.sm }}>
            Choose your preferred UI language.
          </p>
          <select
            value={profile.preferredLanguage}
            onChange={(e) => vm.updateLanguage(e.target.value)}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              fontSize: typography.fontSize.base,
              border: `1px solid ${colors.light.border}`,
              borderRadius: radius.md,
              backgroundColor: colors.light.background,
              color: colors.light.text,
              minWidth: '200px',
            }}
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </select>
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title="Notifications">
          <p style={{ fontSize: typography.fontSize.sm, color: colors.light.textSecondary, marginBottom: spacing.sm }}>
            Choose what notifications you want to receive.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <ToggleRow
              label="Push notifications"
              checked={profile.notifications.pushEnabled}
              onChange={(v) =>
                vm.updateNotifications({ ...profile.notifications, pushEnabled: v })
              }
            />
            <ToggleRow
              label="Meeting notifications"
              checked={profile.notifications.meetingEnabled}
              onChange={(v) =>
                vm.updateNotifications({ ...profile.notifications, meetingEnabled: v })
              }
            />
            <ToggleRow
              label="Chat notifications"
              checked={profile.notifications.chatEnabled}
              onChange={(v) =>
                vm.updateNotifications({ ...profile.notifications, chatEnabled: v })
              }
            />
            <ToggleRow
              label="Reminder notifications"
              checked={profile.notifications.reminderEnabled}
              onChange={(v) =>
                vm.updateNotifications({ ...profile.notifications, reminderEnabled: v })
              }
            />
          </div>
        </SettingsSection>

        {/* Privacy Section */}
        <SettingsSection title="Privacy">
          <p style={{ fontSize: typography.fontSize.sm, color: colors.light.textSecondary, marginBottom: spacing.sm }}>
            Control who can see your information.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <div>
              <label
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.light.text,
                  display: 'block',
                  marginBottom: spacing.xs,
                }}
              >
                Profile visibility
              </label>
              <select
                value={profile.privacy.profileVisibility}
                onChange={(e) =>
                  vm.updatePrivacy({
                    ...profile.privacy,
                    profileVisibility: e.target.value as 'public' | 'private' | 'contacts_only',
                  })
                }
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  fontSize: typography.fontSize.base,
                  border: `1px solid ${colors.light.border}`,
                  borderRadius: radius.md,
                  backgroundColor: colors.light.background,
                  color: colors.light.text,
                  minWidth: '200px',
                }}
              >
                <option value="public">Public</option>
                <option value="contacts_only">Contacts only</option>
                <option value="private">Private</option>
              </select>
            </div>
            <ToggleRow
              label="Show online status"
              checked={profile.privacy.onlineStatusVisible}
              onChange={(v) =>
                vm.updatePrivacy({ ...profile.privacy, onlineStatusVisible: v })
              }
            />
            <ToggleRow
              label="Read receipts"
              checked={profile.privacy.readReceiptsEnabled}
              onChange={(v) =>
                vm.updatePrivacy({ ...profile.privacy, readReceiptsEnabled: v })
              }
            />
            <ToggleRow
              label="Show activity status"
              checked={profile.privacy.activityVisible}
              onChange={(v) =>
                vm.updatePrivacy({ ...profile.privacy, activityVisible: v })
              }
            />
          </div>
        </SettingsSection>

        {/* Accessibility Section */}
        <SettingsSection title="Accessibility">
          <p style={{ fontSize: typography.fontSize.sm, color: colors.light.textSecondary, marginBottom: spacing.sm }}>
            Customize the interface for your needs.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <div>
              <label
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.light.text,
                  display: 'block',
                  marginBottom: spacing.xs,
                }}
              >
                Font scale: {profile.accessibility.fontScale.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={profile.accessibility.fontScale}
                onChange={(e) =>
                  vm.updateAccessibility({
                    ...profile.accessibility,
                    fontScale: parseFloat(e.target.value),
                  })
                }
                style={{ width: '100%', maxWidth: '300px' }}
              />
            </div>
            <ToggleRow
              label="High contrast"
              checked={profile.accessibility.highContrast}
              onChange={(v) =>
                vm.updateAccessibility({ ...profile.accessibility, highContrast: v })
              }
            />
            <ToggleRow
              label="Reduce animations"
              checked={profile.accessibility.reduceAnimations}
              onChange={(v) =>
                vm.updateAccessibility({ ...profile.accessibility, reduceAnimations: v })
              }
            />
            <ToggleRow
              label="Screen reader hints"
              checked={profile.accessibility.screenReaderHints}
              onChange={(v) =>
                vm.updateAccessibility({ ...profile.accessibility, screenReaderHints: v })
              }
            />
          </div>
        </SettingsSection>

        {/* Presence Section */}
        <SettingsSection title="Presence">
          <p style={{ fontSize: typography.fontSize.sm, color: colors.light.textSecondary, marginBottom: spacing.sm }}>
            Set your current availability.
          </p>
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
            {(['online', 'away', 'busy', 'in_meeting', 'do_not_disturb'] as const).map((p) => (
              <Button
                key={p}
                variant={profile.presence === p ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => vm.updatePresence(p)}
              >
                {p.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Button>
            ))}
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Danger Zone">
          <p style={{ fontSize: typography.fontSize.sm, color: colors.light.textSecondary, marginBottom: spacing.sm }}>
            Deactivating your account will disable access. You can reactivate by contacting support.
          </p>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Are you sure you want to deactivate your account?')) {
                vm.deactivateAccount();
              }
            }}
          >
            Deactivate account
          </Button>
        </SettingsSection>

        <div style={{ marginTop: spacing.xl, textAlign: 'center' }}>
          <a
            href="/profile"
            style={{
              color: colors.brand.primary,
              textDecoration: 'none',
              fontSize: typography.fontSize.sm,
            }}
          >
            ← Back to profile
          </a>
        </div>
      </div>
    </main>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function SettingsSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom: spacing.xl,
        paddingBottom: spacing.lg,
        borderBottom: `1px solid ${colors.light.border}`,
      }}
    >
      <h2
        style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
          marginBottom: spacing.md,
          color: colors.light.text,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        cursor: 'pointer',
        padding: `${spacing.xs} 0`,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
      />
      <span style={{ fontSize: typography.fontSize.base, color: colors.light.text }}>{label}</span>
    </label>
  );
}