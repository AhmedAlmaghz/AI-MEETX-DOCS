'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

import { Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { Notification } from '@aimeetx/sdk';
import type { NotificationId, UserId } from '@aimeetx/types';

import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { useSession } from '@/lib/sdk/hooks';
import { TOKENS } from '@aimeetx/sdk';
import { usePalette } from '@/lib/hooks';
import {
  PageHeader, PageLayout, FilterBar, LoadingScreen, EmptyState,
} from '@/components/ui';
import { timeAgo } from '@/lib/utils';

function notificationIcon(type: string): string {
  const map: Record<string, string> = {
    meeting_invite: '📅', meeting_started: '▶', meeting_ended: '⏹',
    chat_message: '💬', recording_ready: '📹', translation_ready: '🌐',
    ai_summary: '🤖', classroom: '📚', system: '⚙', reminder: '⏰',
  };
  return map[type] ?? '•';
}

const CHANNELS = ['all', 'in_app', 'email', 'push', 'sms'] as const;
type ChannelFilter = (typeof CHANNELS)[number];

export default function NotificationsPage() {
  ensureSdkInitialized();
  const { palette } = usePalette();
  const [session] = useSession();

  const [notifications, setNotifications] = useState<ReadonlyArray<Notification>>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [selected, setSelected] = useState<Set<NotificationId>>(new Set());

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').GetNotificationHistoryUseCase>>(TOKENS.GetNotificationHistoryUseCase).execute({ userId: session.userId, page: 1, pageSize: 50 });
      if (r.isSuccess) setNotifications(r.value.items);
    } finally { setLoading(false); }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(
    () => channelFilter === 'all' ? notifications : notifications.filter((n) => n.channel === channelFilter),
    [notifications, channelFilter],
  );

  const unreadCount = useMemo(() => notifications.filter((n) => n.readAt === null).length, [notifications]);

  const filterOptions = useMemo(() => {
    const counts: Record<string, number> = { all: notifications.length };
    for (const ch of CHANNELS) if (ch !== 'all') counts[ch] = notifications.filter((n) => n.channel === ch).length;
    return CHANNELS.map((ch) => ({ value: ch, label: ch === 'in_app' ? 'In-App' : ch, count: counts[ch] }));
  }, [notifications]);

  const handleMarkRead = useCallback(async (id: NotificationId) => {
    await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').MarkReadUseCase>>(TOKENS.MarkReadUseCase).execute({ userId: session?.userId as UserId, notificationId: id });
    void load();
  }, [load, session]);

  const handleMarkSelectedRead = useCallback(async () => {
    for (const id of selected) {
      await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').MarkReadUseCase>>(TOKENS.MarkReadUseCase).execute({ userId: session?.userId as UserId, notificationId: id });
    }
    setSelected(new Set());
    void load();
  }, [selected, load, session]);

  const handleClearAll = useCallback(async () => {
    if (!confirm('Clear all notifications?')) return;
    if (!session) return;
    await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').ClearNotificationsUseCase>>(TOKENS.ClearNotificationsUseCase).execute({ userId: session.userId });
    void load();
  }, [load, session]);

  const toggleSelect = useCallback((id: NotificationId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  if (loading) return <LoadingScreen text="Loading notifications..." />;

  return (
    <PageLayout>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        actions={
          <>
            {selected.size > 0 && (
              <Button variant="primary" size="sm" onClick={() => void handleMarkSelectedRead()}>Mark {selected.size} read</Button>
            )}
            {notifications.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => void handleClearAll()}>Clear all</Button>
            )}
          </>
        }
      />

      <FilterBar options={filterOptions} selected={channelFilter} onChange={(v) => setChannelFilter(v)} />

      {filtered.length === 0 ? (
        <EmptyState icon="🔔" title={channelFilter === 'all' ? 'No notifications yet' : `No ${channelFilter.replace('_', ' ')} notifications`} body={channelFilter === 'all' ? 'You are all caught up!' : 'Try changing the filter.'} />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {filtered.map((n) => {
            const isUnread = n.readAt === null;
            const isSelected = selected.has(n.id);
            return (
              <li
                key={n.id} onClick={() => toggleSelect(n.id)}
                style={{
                  padding: spacing.md, backgroundColor: isSelected ? 'rgba(59,130,246,0.08)' : palette.surface,
                  border: `1px solid ${isUnread ? colors.brand.primary : palette.border}`,
                  borderRadius: radius.lg, opacity: isUnread ? 1 : 0.75,
                  display: 'flex', gap: spacing.md, cursor: 'pointer',
                  transition: 'background-color 150ms ease',
                  borderLeft: `4px solid ${isUnread ? colors.semantic.info : 'transparent'}`,
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = palette.surface; }}
              >
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{notificationIcon(n.type)}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ color: palette.text, fontSize: typography.fontSize.base }}>{n.title}</strong>
                    <span style={{ color: palette.textSecondary, fontSize: typography.fontSize.xs, flexShrink: 0, marginLeft: spacing.sm }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <p style={{ color: palette.textSecondary, fontSize: typography.fontSize.sm, margin: 0 }}>{n.body}</p>
                  <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.xs, alignItems: 'center' }}>
                    <span style={{ padding: `1px ${spacing.xs}`, borderRadius: radius.sm, backgroundColor: palette.surfaceVariant, color: palette.textSecondary, fontSize: typography.fontSize.xs }}>
                      {n.channel.replace('_', ' ')}
                    </span>
                    {isUnread && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); void handleMarkRead(n.id); }}
                        style={{ background: 'transparent', border: 'none', color: colors.brand.primary, cursor: 'pointer', fontSize: typography.fontSize.xs, padding: 0 }}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageLayout>
  );
}
