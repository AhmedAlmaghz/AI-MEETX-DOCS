'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';

import { Button, Input, colors, radius, spacing, typography } from '@aimeetx/ui';

import { useProfileViewModel } from '@/components/profile-view-model';

// Demo user ID — in production, this would come from the auth session
const DEMO_USER_ID = 'user_demo_123' as unknown as import('@aimeetx/types').UserId;

/**
 * ProfileScreen — view and edit user profile.
 *
 * Per `feature-profile/SPECIFICATION.md`: ProfileScreen with display name, avatar, language.
 * Per `feature-profile/REQUIREMENTS.md` PROFILE-FR-001/002: view and edit profile.
 */
export default function ProfileScreen() {
  const vm = useProfileViewModel(DEMO_USER_ID);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  // Load profile on mount
  useEffect(() => {
    vm.loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync form state when profile loads
  useEffect(() => {
    if (vm.state.status === 'loaded') {
      setDisplayName(vm.state.profile.displayName);
      setPreferredLanguage(vm.state.profile.preferredLanguage);
    }
  }, [vm.state]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await vm.updateProfile({ displayName, preferredLanguage });
    setEditing(false);
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await vm.uploadAvatar(file);
    }
  };

  const handleDeleteAvatar = async () => {
    await vm.deleteAvatar();
  };

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
        <p style={{ color: colors.light.textSecondary }}>Loading profile...</p>
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
          maxWidth: '600px',
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
          My Profile
        </h1>

        {/* Avatar Section */}
        <section style={{ marginBottom: spacing.xl, textAlign: 'center' }}>
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: radius.full,
              backgroundColor: colors.light.surfaceVariant,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: `2px solid ${colors.light.border}`,
            }}
          >
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  fontSize: typography.fontSize['3xl'],
                  color: colors.light.textSecondary,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {profile.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              justifyContent: 'center',
              marginTop: spacing.md,
            }}
          >
            <label
              style={{
                display: 'inline-block',
                padding: `${spacing.xs} ${spacing.md}`,
                backgroundColor: colors.brand.primary,
                color: '#FFFFFF',
                borderRadius: radius.md,
                cursor: 'pointer',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              Upload avatar
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </label>
            {profile.avatarUrl && (
              <Button variant="ghost" size="sm" onClick={handleDeleteAvatar}>
                Remove
              </Button>
            )}
          </div>
        </section>

        {/* Profile Info */}
        {!editing ? (
          <section>
            <div style={{ marginBottom: spacing.md }}>
              <label
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.light.textSecondary,
                  display: 'block',
                  marginBottom: spacing.xs,
                }}
              >
                Display Name
              </label>
              <p
                style={{
                  fontSize: typography.fontSize.lg,
                  color: colors.light.text,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                {profile.displayName}
              </p>
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <label
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.light.textSecondary,
                  display: 'block',
                  marginBottom: spacing.xs,
                }}
              >
                Email
              </label>
              <p style={{ fontSize: typography.fontSize.base, color: colors.light.text }}>
                {profile.email}
              </p>
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <label
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.light.textSecondary,
                  display: 'block',
                  marginBottom: spacing.xs,
                }}
              >
                Preferred Language
              </label>
              <p style={{ fontSize: typography.fontSize.base, color: colors.light.text }}>
                {profile.preferredLanguage}
              </p>
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <label
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.light.textSecondary,
                  display: 'block',
                  marginBottom: spacing.xs,
                }}
              >
                Role
              </label>
              <p style={{ fontSize: typography.fontSize.base, color: colors.light.text }}>
                {profile.role}
              </p>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.light.textSecondary,
                  display: 'block',
                  marginBottom: spacing.xs,
                }}
              >
                Account Status
              </label>
              <p style={{ fontSize: typography.fontSize.base, color: colors.light.text }}>
                {profile.status}
              </p>
            </div>

            <div style={{ display: 'flex', gap: spacing.md }}>
              <Button variant="primary" onClick={() => setEditing(true)}>
                Edit profile
              </Button>
              <Button variant="secondary">
                <a href="/settings" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Settings
                </a>
              </Button>
            </div>
          </section>
        ) : (
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={3}
                maxLength={50}
              />
              <div>
                <label
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.light.text,
                    fontWeight: typography.fontWeight.medium,
                    display: 'block',
                    marginBottom: spacing.xs,
                  }}
                >
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    fontSize: typography.fontSize.base,
                    border: `1px solid ${colors.light.border}`,
                    borderRadius: radius.md,
                    backgroundColor: colors.light.background,
                    color: colors.light.text,
                    width: '100%',
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
              </div>

              <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.md }}>
                <Button type="submit" variant="primary">
                  Save changes
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}