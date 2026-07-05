'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, type FormEvent } from 'react';

import { Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { ClassroomSession, Quiz, AttendanceRecord } from '@aimeetx/sdk';
import type { ClassroomSessionId } from '@aimeetx/types';

import { ensureSdkInitialized, resolveUseCase } from '@/lib/sdk/bootstrap';
import { useSession } from '@/lib/sdk/hooks';
import { TOKENS } from '@aimeetx/sdk';
import { usePalette } from '@/lib/hooks';
import { PageLayout, LoadingScreen, EmptyState, Card, StatusBadge } from '@/components/ui';
import { inMemoryStore } from '@/lib/sdk/in-memory-repositories';

type DetailTab = 'quizzes' | 'attendance' | 'breakout';

export default function ClassroomDetailPage() {
  ensureSdkInitialized();
  const params = useParams<{ id: string }>();
  const sessionId = (params?.id ?? '') as ClassroomSessionId;
  const router = useRouter();
  const { palette } = usePalette();
  const [session] = useSession();

  const [cs, setCs] = useState<ClassroomSession | null>(null);
  const [quizzes, setQuizzes] = useState<ReadonlyArray<Quiz>>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<ReadonlyArray<AttendanceRecord>>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>('quizzes');

  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState<string[]>(['', '']);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [submitLabel, setSubmitLabel] = useState('Create quiz');

  const [gradingQuiz, setGradingQuiz] = useState<string | null>(null);
  const [gradeResult, setGradeResult] = useState<{ quizId: string; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').GetClassroomSessionUseCase>>(TOKENS.GetClassroomSessionUseCase).execute({ sessionId });
      if (r.isSuccess) setCs(r.value);
      const qs: Quiz[] = [];
      for (const q of inMemoryStore.quizzes.values()) if (q.classroomSessionId === sessionId) qs.push(q);
      setQuizzes(qs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

      const attR = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').ListAttendanceRecordsUseCase>>(TOKENS.ListAttendanceRecordsUseCase).execute({ sessionId });
      if (attR.isSuccess) setAttendanceRecords(attR.value);
    } finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => { void load(); }, [load, sessionId]);

  const handleCreateQuiz = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !cs || cs.status === 'ended') return;
    const filteredOptions = quizOptions.filter((o) => o.trim().length > 0);
    if (filteredOptions.length < 2) return;
    setSubmitLabel('Creating...');
    try {
      const options = filteredOptions.map((text) => ({ id: crypto.randomUUID(), text }));
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').CreateQuizUseCase>>(TOKENS.CreateQuizUseCase).execute({
        classroomSessionId: cs.id, instructorId: session.userId, question: quizQuestion, options,
        correctOptionId: correctOption !== null ? options[correctOption]?.id : undefined, showCorrectAnswer: showCorrect,
      });
      if (r.isSuccess) {
        setQuizQuestion(''); setQuizOptions(['', '']); setCorrectOption(null); setShowCorrect(false);
        void load();
      }
    } finally { setSubmitLabel('Create quiz'); }
  }, [session, cs, quizQuestion, quizOptions, correctOption, showCorrect, load]);

  const handleActivateQuiz = useCallback(async (quizId: string) => {
    if (!session) return;
    await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').ActivateQuizUseCase>>(TOKENS.ActivateQuizUseCase).execute({ quizId: quizId as never, activatedBy: session.userId });
    void load();
  }, [session, load]);

  const handleCloseQuiz = useCallback(async (quizId: string) => {
    if (!session) return;
    await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').CloseQuizUseCase>>(TOKENS.CloseQuizUseCase).execute({ quizId: quizId as never, closedBy: session.userId });
    void load();
  }, [session, load]);

  const handleGradeQuiz = useCallback(async (quizId: string) => {
    setGradingQuiz(quizId);
    try {
      const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').GradeQuizUseCase>>(TOKENS.GradeQuizUseCase).execute({ quizId: quizId as never });
      if (r.isSuccess) {
        const g = r.value;
        const lines = [`${g.totalParticipants} participant${g.totalParticipants !== 1 ? 's' : ''}`];
        lines.push(`${g.correctResponses} correct (${g.accuracyPercentage.toFixed(0)}%)`);
        lines.push(`${g.incorrectResponses} incorrect`);
        if (g.resultsByOption.size > 0) {
          const quiz = quizzes.find((q) => q.id === quizId);
          if (quiz) {
            for (const [optId, count] of g.resultsByOption) {
              const opt = quiz.options.find((o) => o.id === optId);
              lines.push(`  ${opt?.text ?? optId}: ${count}`);
            }
          }
        }
        setGradeResult({ quizId, text: lines.join('\n') });
      }
    } finally { setGradingQuiz(null); }
  }, [quizzes]);

  const handleEndSession = useCallback(async () => {
    if (!session || !cs) return;
    await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').EndClassroomSessionUseCase>>(TOKENS.EndClassroomSessionUseCase).execute({ sessionId: cs.id, endedBy: session.userId });
    void load();
  }, [session, cs, load]);

  const handleExportAttendance = useCallback(async () => {
    if (!cs) return;
    const r = await resolveUseCase<InstanceType<typeof import('@aimeetx/sdk').ExportAttendanceReportUseCase>>(TOKENS.ExportAttendanceReportUseCase).execute({ sessionId: cs.id });
    if (r.isSuccess) {
      const blob = new Blob([r.value], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `attendance-${cs.id}.csv`; a.click();
      URL.revokeObjectURL(url);
    }
  }, [cs]);

  if (loading) return <LoadingScreen text="Loading classroom..." />;
  if (!cs) return <EmptyState icon="❌" title="Classroom session not found." />;

  const statusColor = cs.status === 'active' ? colors.semantic.success : cs.status === 'paused' ? colors.semantic.warning : colors.semantic.error;

  return (
    <PageLayout>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: statusColor, display: 'inline-block' }} />
          <h1 style={{ fontSize: typography.fontSize['2xl'], fontWeight: 700, color: palette.text, margin: 0 }}>Classroom Session</h1>
          <StatusBadge status={cs.status === 'active' ? 'success' : cs.status === 'paused' ? 'warning' : 'error'} />
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          {cs.status !== 'ended' && <Button variant="danger" size="sm" onClick={() => void handleEndSession()}>End session</Button>}
          <Button variant="secondary" size="sm" onClick={() => router.push('/classroom')}>Back</Button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: spacing.sm }}>
        {(['quizzes', 'attendance', 'breakout'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{ padding: `${spacing.sm} ${spacing.md}`, borderRadius: radius.md, border: `1px solid ${tab === t ? colors.brand.primary : palette.border}`, backgroundColor: tab === t ? colors.brand.primary : 'transparent', color: tab === t ? '#FFFFFF' : palette.text, cursor: 'pointer', fontSize: typography.fontSize.sm, textTransform: 'capitalize' }}>
            {t === 'quizzes' ? `Quizzes (${quizzes.length})` : t === 'attendance' ? `Attendance (${attendanceRecords.length})` : 'Breakout rooms'}
          </button>
        ))}
      </div>

      {tab === 'quizzes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {cs.status !== 'ended' && (
            <form onSubmit={(e) => void handleCreateQuiz(e)} style={{ padding: spacing.md, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.lg }}>
              <h3 style={{ fontSize: typography.fontSize.base, fontWeight: 600, color: palette.text, margin: '0 0 12px' }}>Create Quiz</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                <input type="text" value={quizQuestion} onChange={(e) => setQuizQuestion(e.target.value)} placeholder="Enter your question" required style={{ padding: spacing.sm, borderRadius: radius.md, border: `1px solid ${palette.border}`, backgroundColor: palette.background, color: palette.text, fontSize: typography.fontSize.sm }} />
                {quizOptions.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
                    <input type="text" value={opt} onChange={(e) => { const next = [...quizOptions]; next[i] = e.target.value; setQuizOptions(next); }} placeholder={`Option ${i + 1}`} required style={{ flex: 1, padding: spacing.sm, borderRadius: radius.md, border: `1px solid ${palette.border}`, backgroundColor: palette.background, color: palette.text, fontSize: typography.fontSize.sm }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: typography.fontSize.xs, color: palette.textSecondary, cursor: 'pointer' }}>
                      <input type="radio" name="correct" checked={correctOption === i} onChange={() => setCorrectOption(i)} /> Correct
                    </label>
                    {quizOptions.length > 2 && <button type="button" onClick={() => setQuizOptions(quizOptions.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', color: colors.semantic.error, cursor: 'pointer', fontSize: 16 }}>×</button>}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setQuizOptions([...quizOptions, ''])}>+ Add option</Button>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: typography.fontSize.xs, color: palette.textSecondary, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showCorrect} onChange={() => setShowCorrect(!showCorrect)} /> Show correct answer
                  </label>
                </div>
                <Button type="submit" variant="primary" disabled={submitLabel === 'Creating...'}>{submitLabel}</Button>
              </div>
            </form>
          )}

          {quizzes.length === 0 ? (
            <p style={{ color: palette.textSecondary, textAlign: 'center', padding: spacing.xl }}>No quizzes yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {quizzes.map((q) => (
                <Card key={q.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                        <strong style={{ color: palette.text, fontSize: typography.fontSize.base }}>{q.question}</strong>
                        <StatusBadge status={q.status === 'active' ? 'success' : q.status === 'draft' ? 'neutral' : 'info'} label={q.status} />
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: `${spacing.xs} 0 0`, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {q.options.map((o) => (
                          <li key={o.id} style={{ fontSize: typography.fontSize.sm, color: o.id === q.correctOptionId ? colors.semantic.success : palette.text }}>
                            {o.id === q.correctOptionId && q.showCorrectAnswer ? '✓ ' : ''}{o.text} <span style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary }}>({q.responses.filter((r) => r.selectedOptionId === o.id).length} votes)</span>
                          </li>
                        ))}
                      </ul>
                      <p style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary, marginTop: spacing.xs }}>{q.responses.length} response{q.responses.length !== 1 ? 's' : ''} · Created {new Date(q.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: spacing.xs, flexShrink: 0, flexWrap: 'wrap' }}>
                      {q.status === 'draft' && <Button variant="primary" size="sm" onClick={() => void handleActivateQuiz(q.id)}>Activate</Button>}
                      {q.status === 'active' && <Button variant="secondary" size="sm" onClick={() => void handleCloseQuiz(q.id)}>Close</Button>}
                      {q.correctOptionId && <Button variant="secondary" size="sm" disabled={gradingQuiz === q.id} onClick={() => void handleGradeQuiz(q.id)}>{gradingQuiz === q.id ? 'Grading...' : 'Grade'}</Button>}
                    </div>
                  </div>
                  {gradeResult?.quizId === q.id && (
                    <pre style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: palette.surfaceVariant, borderRadius: radius.sm, fontSize: typography.fontSize.xs, color: palette.text, whiteSpace: 'pre-wrap' }}>{gradeResult.text}</pre>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'attendance' && (
        <Card actions={<Button variant="secondary" size="sm" onClick={() => void handleExportAttendance()}>Export CSV</Button>}>
          {attendanceRecords.length === 0 ? (
            <p style={{ color: palette.textSecondary, textAlign: 'center', padding: spacing.xl }}>No attendance records yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
              {attendanceRecords.map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: spacing.sm, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.md, fontSize: typography.fontSize.sm }}>
                  <span style={{ color: palette.text }}>Participant: {r.participantId}</span>
                  <span style={{ color: palette.textSecondary }}>{new Date(r.joinedAt).toLocaleTimeString()} · {r.totalDurationMinutes}min</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'breakout' && (
        cs.breakoutRooms.length === 0 ? (
          <p style={{ color: palette.textSecondary, textAlign: 'center', padding: spacing.xl }}>
            No breakout rooms created yet. Use the classroom dashboard during a live meeting to create them.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {cs.breakoutRooms.map((br) => (
              <div key={br.id} style={{ padding: spacing.md, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: radius.lg }}>
                <strong style={{ color: palette.text, fontSize: typography.fontSize.base }}>{br.name}</strong>
                <p style={{ fontSize: typography.fontSize.xs, color: palette.textSecondary, marginTop: 4 }}>
                  Room: {br.livekitRoomName} · {br.assignedParticipants.length} participant{br.assignedParticipants.length !== 1 ? 's' : ''}
                </p>
                {br.assignedParticipants.length > 0 && (
                  <div style={{ display: 'flex', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap' }}>
                    {br.assignedParticipants.map((p) => (
                      <span key={p} style={{ padding: `1px ${spacing.xs}`, borderRadius: radius.sm, backgroundColor: palette.surfaceVariant, color: palette.textSecondary, fontSize: typography.fontSize.xs }}>{p}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </PageLayout>
  );
}
