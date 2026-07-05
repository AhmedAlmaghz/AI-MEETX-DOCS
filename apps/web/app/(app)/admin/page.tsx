'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { Tenant, TenantFeatureFlags, AuditLogEntry, PlatformMetricsSummary } from '@aimeetx/sdk';

import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { useCurrentProfile, useSession } from '@/lib/sdk/hooks';
import { TOKENS } from '@aimeetx/sdk';
import { usePalette } from '@/lib/hooks';
import {
  PageHeader, PageLayout, Card, StatCard, LoadingScreen, EmptyState,
} from '@/components/ui';
import { inMemoryStore } from '@/lib/sdk/in-memory-repositories';
import { formatMinutes } from '@/lib/utils';

type AdminTab = 'overview' | 'tenants' | 'flags' | 'audit' | 'metrics';

const ADMIN_TABS: ReadonlyArray<{ key: AdminTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'tenants', label: 'Tenants' },
  { key: 'flags', label: 'Feature flags' },
  { key: 'audit', label: 'Audit log' },
  { key: 'metrics', label: 'Metrics' },
];

const FEATURE_LABELS: Record<keyof TenantFeatureFlags, string> = {
  recording: 'Recording',
  translation: 'Translation',
  aiSummaries: 'AI Summaries',
  classroom: 'Classroom',
  whiteboard: 'Whiteboard',
};

export default function AdminPage() {
  ensureSdkInitialized();
  const router = useRouter();
  const [session] = useSession();
  const { profile, loading: profileLoading } = useCurrentProfile();
  const { palette } = usePalette();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [tenants, setTenants] = useState<ReadonlyArray<Tenant>>([]);
  const [auditLogs, setAuditLogs] = useState<ReadonlyArray<AuditLogEntry>>([]);
  const [metrics, setMetrics] = useState<PlatformMetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [inviteTenantId, setInviteTenantId] = useState('');

  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [flags, setFlags] = useState<TenantFeatureFlags | null>(null);

  const notify = useCallback((err: string | null, ok: string | null) => {
    setError(err); setSuccess(ok);
    setTimeout(() => { setError(null); setSuccess(null); }, 3000);
  }, []);

  const loadAll = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const tList: Tenant[] = [];
      for (const [, t] of inMemoryStore.tenants) tList.push(t);
      setTenants(tList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

      const [auditResult, metricsResult] = await Promise.all([
        resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').QueryAuditLogUseCase>>(TOKENS.QueryAuditLogUseCase).execute({
          actor: { userId: session.userId, role: 'super_admin' }, query: { limit: 100 },
        }),
        resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').GetPlatformMetricsUseCase>>(TOKENS.GetPlatformMetricsUseCase).execute({
          actor: { userId: session.userId, role: 'super_admin' }, range: { from: '2026-01-01', to: '2026-01-31' },
        }),
      ]);
      if (auditResult.isSuccess) setAuditLogs(auditResult.value);
      if (metricsResult.isSuccess) setMetrics(metricsResult.value);
    } finally { setLoading(false); }
  }, [session]);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const handleCreateTenant = useCallback(async () => {
    if (!session || !name.trim() || !slug.trim()) return;
    setSaving(true);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').CreateTenantUseCase>>(TOKENS.CreateTenantUseCase).execute({
        actor: { userId: session.userId, role: 'super_admin' }, input: { name: name.trim(), slug: slug.trim() },
      });
      if (r.isFailure) notify(r.error.message, null);
      else { notify(null, 'Tenant created'); setName(''); setSlug(''); setShowCreate(false); void loadAll(); }
    } finally { setSaving(false); }
  }, [session, name, slug, loadAll, notify]);

  const handleSuspend = useCallback(async (tenantId: string) => {
    if (!session) return;
    if (!confirm('Suspend this tenant? Users will lose access.')) return;
    setSaving(true);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').SuspendTenantUseCase>>(TOKENS.SuspendTenantUseCase).execute({
        actor: { userId: session.userId, role: 'super_admin' }, tenantId: tenantId as never,
      });
      if (r.isFailure) notify(r.error.message, null);
      else { notify(null, 'Tenant suspended'); void loadAll(); }
    } finally { setSaving(false); }
  }, [session, loadAll, notify]);

  const handleLoadFlags = useCallback(async (tenantId: string) => {
    if (!session) return;
    setSelectedTenant(tenantId);
    const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').GetTenantFeatureFlagsUseCase>>(TOKENS.GetTenantFeatureFlagsUseCase).execute({
      actor: { userId: session.userId, role: 'super_admin' }, tenantId: tenantId as never,
    });
    if (r.isSuccess) setFlags(r.value);
  }, [session]);

  const handleToggleFlag = useCallback(async (flag: keyof TenantFeatureFlags) => {
    if (!session || !flags || !selectedTenant) return;
    const next = { ...flags, [flag]: !flags[flag] };
    setFlags(next);
    const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').UpdateFeatureFlagsUseCase>>(TOKENS.UpdateFeatureFlagsUseCase).execute({
      actor: { userId: session.userId, role: 'super_admin' }, tenantId: selectedTenant as never, featureFlags: next,
    });
    if (r.isFailure) { notify(r.error.message, null); void handleLoadFlags(selectedTenant); }
    else notify(null, 'Feature flags updated');
  }, [session, flags, selectedTenant, handleLoadFlags, notify]);

  const handleInvite = useCallback(async () => {
    if (!session || !inviteTenantId || !email.trim()) return;
    setSaving(true);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').InviteTenantMemberUseCase>>(TOKENS.InviteTenantMemberUseCase).execute({
        actor: { userId: session.userId, role: 'super_admin' }, input: { tenantId: inviteTenantId as never, email: email.trim(), role: 'tenant_member', invitedBy: session.userId },
      });
      if (r.isFailure) notify(r.error.message, null);
      else { notify(null, 'Invitation sent'); setEmail(''); }
    } finally { setSaving(false); }
  }, [session, inviteTenantId, email, notify]);

  const canAdmin = profile?.role === 'owner' || profile?.role === 'admin';

  if (!profileLoading && !canAdmin) {
    return (
      <PageLayout>
        <PageHeader title="Access denied" subtitle="You do not have permission to access the admin panel." actions={<Button variant="primary" onClick={() => router.push('/dashboard')}>Go to dashboard</Button>} />
      </PageLayout>
    );
  }

  if (loading) return <LoadingScreen text="Loading admin panel..." />;

  return (
    <PageLayout>
      <PageHeader title="Admin panel" />

      {(error || success) && (
        <div style={{ padding: spacing.sm, backgroundColor: error ? '#FEE2E2' : '#D1FAE5', color: error ? colors.semantic.error : colors.semantic.success, border: `1px solid ${error ? colors.semantic.error : colors.semantic.success}`, borderRadius: radius.md, fontSize: typography.fontSize.sm }}>
          {error ?? success}
        </div>
      )}

      <div style={{ display: 'flex', gap: spacing.xl }}>
        <nav style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          {ADMIN_TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              style={{ padding: `${spacing.sm} ${spacing.md}`, borderRadius: radius.md, border: 'none', backgroundColor: tab === t.key ? colors.brand.primary : 'transparent', color: tab === t.key ? '#FFFFFF' : palette.text, cursor: 'pointer', fontSize: typography.fontSize.sm, textAlign: 'left', fontWeight: tab === t.key ? typography.fontWeight.semibold : typography.fontWeight.normal }}>
              {t.label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
              <StatCard label="Total tenants" value={String(tenants.length)} color={colors.brand.primary} />
              <StatCard label="Active" value={String(tenants.filter((t) => t.status === 'active').length)} color={colors.semantic.success} />
              <StatCard label="Suspended" value={String(tenants.filter((t) => t.status === 'suspended').length)} color={colors.semantic.error} />
              <StatCard label="Audit entries" value={String(auditLogs.length)} color={colors.semantic.info} />
            </div>
          )}

          {tab === 'tenants' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <div><Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : 'Create tenant'}</Button></div>
              {showCreate && (
                <div style={{ display: 'flex', gap: spacing.sm, padding: spacing.md, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.lg, flexWrap: 'wrap' }}>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tenant name" style={{ padding: spacing.sm, borderRadius: radius.md, border: `1px solid ${palette.border}`, backgroundColor: palette.background, color: palette.text, fontSize: typography.fontSize.sm, flex: 1, minWidth: 160 }} />
                  <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug" style={{ padding: spacing.sm, borderRadius: radius.md, border: `1px solid ${palette.border}`, backgroundColor: palette.background, color: palette.text, fontSize: typography.fontSize.sm, width: 120 }} />
                  <Button variant="primary" size="sm" disabled={saving || !name.trim() || !slug.trim()} onClick={() => void handleCreateTenant()}>{saving ? 'Creating...' : 'Create'}</Button>
                </div>
              )}
              {tenants.length === 0 ? (
                <EmptyState icon="🏢" title="No tenants yet" body="Create the first tenant to get started." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  {tenants.map((t) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.lg }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                          <strong style={{ color: palette.text }}>{t.name}</strong>
                          <span style={{ padding: `1px ${spacing.xs}`, borderRadius: radius.sm, fontSize: typography.fontSize.xs, fontWeight: 500, color: t.status === 'active' ? '#22C55E' : '#EF4444', backgroundColor: t.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', textTransform: 'capitalize' }}>{t.status}</span>
                        </div>
                        <p style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary, margin: '2px 0 0' }}>/{t.slug} · Created {new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: 'flex', gap: spacing.xs }}>
                        <Button variant="secondary" size="sm" onClick={() => { void handleLoadFlags(t.id); setTab('flags'); }}>Flags</Button>
                        {t.status === 'active' && <Button variant="danger" size="sm" onClick={() => { void handleSuspend(t.id); }}>Suspend</Button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Card title="Invite member">
                <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
                  <select value={inviteTenantId} onChange={(e) => setInviteTenantId(e.target.value)} style={{ padding: spacing.sm, borderRadius: radius.md, border: `1px solid ${palette.border}`, backgroundColor: palette.background, color: palette.text, fontSize: typography.fontSize.sm }}>
                    <option value="">Select tenant...</option>
                    {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" style={{ padding: spacing.sm, borderRadius: radius.md, border: `1px solid ${palette.border}`, backgroundColor: palette.background, color: palette.text, fontSize: typography.fontSize.sm, flex: 1, minWidth: 200 }} />
                  <Button variant="primary" size="sm" disabled={saving || !email.trim() || !inviteTenantId} onClick={() => void handleInvite()}>Invite</Button>
                </div>
              </Card>
            </div>
          )}

          {tab === 'flags' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <select value={selectedTenant} onChange={(e) => { if (e.target.value) void handleLoadFlags(e.target.value); }} style={{ padding: spacing.sm, borderRadius: radius.md, border: `1px solid ${palette.border}`, backgroundColor: palette.background, color: palette.text, fontSize: typography.fontSize.sm, maxWidth: 300 }}>
                <option value="">Select a tenant...</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {!flags && <p style={{ color: palette.textSecondary }}>Select a tenant to view and edit feature flags.</p>}
              {flags && (
                <Card title="Feature flags">
                  {(Object.keys(FEATURE_LABELS) as Array<keyof TenantFeatureFlags>).map((key) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, fontSize: typography.fontSize.base, color: palette.text, cursor: 'pointer' }}>
                      <input type="checkbox" checked={flags[key]} onChange={() => void handleToggleFlag(key)} style={{ width: 18, height: 18 }} />
                      {FEATURE_LABELS[key]}
                    </label>
                  ))}
                </Card>
              )}
            </div>
          )}

          {tab === 'audit' && (
            auditLogs.length === 0 ? (
              <EmptyState icon="📋" title="No audit log entries" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                {auditLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: spacing.sm, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.md, fontSize: typography.fontSize.sm }}>
                    <div>
                      <strong style={{ color: palette.text }}>{log.action}</strong>
                      <span style={{ color: palette.textSecondary, marginLeft: spacing.sm }}>by {log.actorId.slice(0, 12)}...</span>
                    </div>
                    <span style={{ color: palette.textSecondary, fontSize: typography.fontSize.xs }}>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'metrics' && (
            metrics ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
                <StatCard label="Daily active users" value={metrics.dailyActiveUsers.toLocaleString()} color={colors.brand.primary} />
                <StatCard label="Monthly active users" value={metrics.monthlyActiveUsers.toLocaleString()} color={colors.semantic.success} />
                <StatCard label="Total meetings" value={metrics.totalMeetings.toLocaleString()} color={colors.semantic.warning} />
                <StatCard label="Meeting minutes" value={metrics.totalMeetingMinutes.toLocaleString()} color={colors.semantic.info} />
                <StatCard label="Recording minutes" value={formatMinutes(metrics.totalRecordingMinutes)} color={colors.semantic.info} />
                <StatCard label="Translation minutes" value={formatMinutes(metrics.totalTranslationMinutes)} color={colors.semantic.info} />
              </div>
            ) : (
              <p style={{ color: palette.textSecondary }}>Metrics unavailable.</p>
            )
          )}
        </div>
      </div>
    </PageLayout>
  );
}
