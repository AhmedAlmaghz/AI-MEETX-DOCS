'use client';

import { useEffect, useState, useCallback } from 'react';

import { useTheme, Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { Notification } from '@aimeetx/sdk';
import type { NotificationId, UserId } from '@aimeetx/types';

import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { useSession } from '@/lib/sdk/hooks';
import { TOKENS } from '@aimeetx/sdk';

export default function NotificationsPage() {
  ensureSdkInitialized();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const palette = isDark ? colors.dark : colors.light;
  const [session] = useSession();

  const [notifications, setNotifications] = useState<ReadonlyArray<Notification>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await resolveUseCase<
        InstanceType<typeof import('@aimeetx/sdk').GetNotificationHistoryUseCase>
      >(TOKENS.GetNotificationHistoryUseCase).execute({
        userId: session.userId,
        page: 1,
        pageSize: 50,
      });
      if (result.isSuccess) setNotifications(result.value.items);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMarkRead = useCallback(
    async (id: NotificationId) => {
      await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').MarkReadUseCase>>(
        TOKENS.MarkReadUseCase,
      ).execute({ userId: session?.userId as UserId, notificationId: id });
      void load();
    },
    [load, session],
  );

  const handleClearAll = useCallback(async () => {
    if (!confirm('Clear all notifications?')) return;
    if (!session) return;
    await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').ClearNotificationsUseCase>>(
      TOKENS.ClearNotificationsUseCase,
    ).execute({ userId: session.userId });
    void load();
  }, [load, session]);

  const unreadCount = notifications.filter((n) => n.readAt === null).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1
            style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: palette.text,
            }}
          >
            Notifications
          </h1>
          <p style={{ color: palette.textSecondary, marginTop: spacing.xs }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {notifications.length > 0 && (
          <Button variant="secondary" onClick={() => void handleClearAll()}>
            Clear all
          </Button>
        )}
      </header>

      {loading ? (
        <p style={{ color: palette.textSecondary }}>Loading...</p>
      ) : notifications.length === 0 ? (
        <div
          style={{
            padding: spacing['2xl'],
            textAlign: 'center',
            color: palette.textSecondary,
            backgroundColor: palette.surface,
            border: `1px dashed ${palette.border}`,
            borderRadius: radius.lg,
          }}
        >
          You have no notifications.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {notifications.map((n) => (
            <li
              key={n.id}
              style={{
                padding: spacing.md,
                backgroundColor: palette.surface,
                border: `1px solid ${n.readAt ? palette.border : colors.brand.primary}`,
                borderRadius: radius.lg,
                opacity: n.readAt ? 0.85 : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: palette.text, fontSize: typography.fontSize.base }}>{n.title}</strong>
                <span style={{ color: palette.textSecondary, fontSize: typography.fontSize.xs }}>
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p style={{ color: palette.textSecondary, fontSize: typography.fontSize.sm }}>{n.body}</p>
              <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.xs }}>
                <span
                  style={{
                    padding: `2px ${spacing.xs}`,
                    borderRadius: radius.sm,
                    backgroundColor: palette.surfaceVariant,
                    color: palette.textSecondary,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  {n.channel}
                </span>
                {!n.readAt && (
                  <button
                    type="button"
                    onClick={() => void handleMarkRead(n.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: colors.brand.primary,
                      cursor: 'pointer',
                      fontSize: typography.fontSize.xs,
                      padding: 0,
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
