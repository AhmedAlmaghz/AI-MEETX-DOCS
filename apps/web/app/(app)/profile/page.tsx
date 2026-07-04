'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';

import { useTheme, Button, Input, colors, radius, spacing, typography } from '@aimeetx/ui';

import { useCurrentProfile } from '@/lib/sdk/hooks';
import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { TOKENS } from '@aimeetx/sdk';
import type { Theme } from '@aimeetx/sdk';
import type { UserId } from '@aimeetx/types';

type Palette = {
  readonly background: string;
  readonly surface: string;
  readonly surfaceVariant: string;
  readonly border: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly textDisabled: string;
};

export default function ProfilePage() {
  ensureSdkInitialized();
  const [session] = useSession();
  const { profile, loading, reload } = useCurrentProfile();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const palette: Palette = isDark ? colors.dark : colors.light;

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [theme, setTheme] = useState<Theme>('system');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setPreferredLanguage(profile.preferredLanguage);
      setTheme(profile.theme);
    }
  }, [profile]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').UpdateProfileUseCase>
      >(TOKENS.UpdateProfileUseCase).execute({
        userId: session.userId,
        update: {
          displayName,
          preferredLanguage,
          theme,
        },
      });
      if (result.isFailure) {
        setError(result.error.message);
      } else {
        setSuccess(true);
        setEditing(false);
        await reload();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setSaving(true);
    setError(null);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').UploadAvatarUseCase>
      >(TOKENS.UploadAvatarUseCase).execute({
        userId: session.userId,
        avatar: {
          file,
          filename: file.name,
          mimeType: file.type,
        },
      });
      if (result.isFailure) {
        setError(result.error.message);
      } else {
        await reload();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!session) return;
    if (!confirm('Remove your avatar?')) return;
    await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').DeleteAvatarUseCase>>(
      TOKENS.DeleteAvatarUseCase,
    ).execute({ userId: session.userId });
    await reload();
  };

  if (loading || !profile) {
    return <p style={{ color: palette.textSecondary }}>Loading profile...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl, maxWidth: 720 }}>
      <h1
        style={{
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
          color: palette.text,
        }}
      >
        My Profile
      </h1>

      <section
        style={{
          padding: spacing.lg,
          backgroundColor: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: radius.lg,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.lg,
            paddingBottom: spacing.lg,
            borderBottom: `1px solid ${palette.border}`,
            marginBottom: spacing.lg,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: radius.full,
              backgroundColor: colors.brand.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 32,
              fontWeight: typography.fontWeight.bold,
              overflow: 'hidden',
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
              profile.displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <h2 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold }}>
              {profile.displayName}
            </h2>
            <p style={{ color: palette.textSecondary, fontSize: typography.fontSize.sm }}>{profile.email}</p>
            <div style={{ display: 'flex', gap: spacing.xs }}>
              <span
                style={{
                  padding: `2px ${spacing.xs}`,
                  borderRadius: radius.sm,
                  backgroundColor: palette.surfaceVariant,
                  color: palette.text,
                  fontSize: typography.fontSize.xs,
                }}
              >
                {profile.role}
              </span>
              <span
                style={{
                  padding: `2px ${spacing.xs}`,
                  borderRadius: radius.sm,
                  backgroundColor: colors.semantic.success,
                  color: '#FFFFFF',
                  fontSize: typography.fontSize.xs,
                }}
              >
                {profile.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
              <label
                style={{
                  display: 'inline-block',
                  padding: `${spacing.xs} ${spacing.md}`,
                  backgroundColor: colors.brand.primary,
                  color: '#FFFFFF',
                  borderRadius: radius.md,
                  cursor: 'pointer',
                  fontSize: typography.fontSize.sm,
                }}
              >
                Upload avatar
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => void handleAvatarChange(e)}
                  style={{ display: 'none' }}
                />
              </label>
              {profile.avatarUrl && (
                <Button variant="ghost" size="sm" onClick={() => void handleDeleteAvatar()}>
                  Remove avatar
                </Button>
              )}
            </div>
          </div>
        </div>

        {!editing ? (
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: spacing.md,
              margin: 0,
            }}
          >
            <Field label="Display name" value={profile.displayName} />
            <Field label="Email" value={profile.email} />
            <Field label="Role" value={profile.role} />
            <Field label="Status" value={profile.status} />
            <Field label="Preferred language" value={profile.preferredLanguage} />
            <Field label="Translation language" value={profile.translationLanguage} />
            <Field label="Subtitle language" value={profile.subtitleLanguage} />
            <Field label="Theme" value={profile.theme} />
            <Field label="Presence" value={profile.presence} />
          </dl>
        ) : (
          <form onSubmit={(e) => void handleSave(e)} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={3}
              maxLength={50}
            />
            <label style={labelStyle}>
              <span>Preferred language</span>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                style={selectStyle(palette)}
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
              </select>
            </label>
            <label style={labelStyle}>
              <span>Theme</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
                style={selectStyle(palette)}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            {error && (
              <div
                style={{
                  padding: spacing.sm,
                  backgroundColor: '#FEE2E2',
                  color: colors.semantic.error,
                  border: `1px solid ${colors.semantic.error}`,
                  borderRadius: radius.md,
                  fontSize: typography.fontSize.sm,
                }}
              >
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {success && (
          <div
            style={{
              marginTop: spacing.md,
              padding: spacing.sm,
              backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)',
              color: colors.semantic.success,
              borderRadius: radius.md,
              fontSize: typography.fontSize.sm,
            }}
          >
            Profile saved successfully.
          </div>
        )}

        {!editing && (
          <div style={{ marginTop: spacing.lg, textAlign: 'right' }}>
            <Button variant="primary" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { readonly label: string; readonly value: string }) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const palette = isDark ? colors.dark : colors.light;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <dt style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary, textTransform: 'uppercase' }}>
        {label}
      </dt>
      <dd
        style={{
          fontSize: typography.fontSize.base,
          color: palette.text,
          margin: 0,
          fontWeight: typography.fontWeight.medium,
        }}
      >
        {value}
      </dd>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 14,
};

function selectStyle(palette: Palette): React.CSSProperties {
  return {
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${palette.border}`,
    backgroundColor: palette.background,
    color: palette.text,
    fontSize: 14,
  };
}
