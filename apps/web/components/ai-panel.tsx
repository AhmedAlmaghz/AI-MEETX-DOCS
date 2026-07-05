'use client';

import { useState, type FormEvent } from 'react';

import { Button, colors, radius, spacing, typography } from '@aimeetx/ui';
import type { MeetingId } from '@aimeetx/types';

interface AiPanelProps {
  readonly meetingId: MeetingId;
  readonly isDark: boolean;
  readonly palette: {
    readonly background: string;
    readonly surface: string;
    readonly surfaceVariant: string;
    readonly border: string;
    readonly text: string;
    readonly textSecondary: string;
    readonly textDisabled: string;
  };
}

interface Message {
  readonly role: 'user' | 'ai';
  readonly content: string;
}

const MOCK_SUMMARY = 'The meeting discussed the Q4 roadmap, focusing on three key initiatives: launching the real-time collaboration feature, improving platform performance, and expanding to enterprise customers. The team agreed to prioritize the collaboration feature for the next sprint.';

const MOCK_ACTION_ITEMS: ReadonlyArray<{ description: string; assignee: string }> = [
  { description: 'Finalize collaboration feature spec', assignee: 'Product Team' },
  { description: 'Set up performance benchmarks', assignee: 'Engineering' },
  { description: 'Prepare enterprise sales deck', assignee: 'Marketing' },
];

export default function AiPanel({ meetingId: _meetingId, isDark, palette }: AiPanelProps) {
  const [activeView, setActiveView] = useState<'chat' | 'summary' | 'actions'>('chat');
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<ReadonlyArray<Message>>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAsk = async (e: FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setConversation((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setLoading('Thinking...');
    await new Promise((r) => setTimeout(r, 1200));
    setConversation((prev) => [
      ...prev,
      {
        role: 'ai',
        content: getMockAnswer(q),
      },
    ]);
    setLoading(null);
  };

  const handleGenerateSummary = async () => {
    setLoading('Generating summary...');
    await new Promise((r) => setTimeout(r, 2000));
    setSummary(MOCK_SUMMARY);
    setLoading(null);
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: `${spacing.xs} ${spacing.sm}`,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: typography.fontSize.xs,
    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.normal,
    color: isActive ? palette.text : palette.textSecondary,
    borderBottom: isActive ? `2px solid ${colors.semantic.info}` : `2px solid transparent`,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, height: '100%' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${palette.border}`, marginBottom: spacing.sm }}>
        <button type="button" onClick={() => setActiveView('chat')} style={tabStyle(activeView === 'chat')}>
          AI Chat
        </button>
        <button type="button" onClick={() => setActiveView('summary')} style={tabStyle(activeView === 'summary')}>
          Summary
        </button>
        <button type="button" onClick={() => setActiveView('actions')} style={tabStyle(activeView === 'actions')}>
          Actions
        </button>
      </div>

      {activeView === 'chat' && (
        <>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs,
              padding: spacing.xs,
            }}
          >
            {conversation.map((msg, i) => (
              <div
                key={i}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: radius.sm,
                  backgroundColor:
                    msg.role === 'ai'
                      ? isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)'
                      : isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)',
                  fontSize: typography.fontSize.sm,
                  color: palette.text,
                  borderLeft: `3px solid ${msg.role === 'ai' ? colors.semantic.success : colors.semantic.info}`,
                }}
              >
                <span style={{ fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.xs }}>
                  {msg.role === 'ai' ? 'AI' : 'You'}
                </span>
                <p style={{ margin: '4px 0 0', fontSize: typography.fontSize.sm }}>{msg.content}</p>
              </div>
            ))}
            {loading && (
              <div style={{ color: palette.textSecondary, fontSize: typography.fontSize.xs, fontStyle: 'italic' }}>
                {loading}
              </div>
            )}
            {conversation.length === 0 && !loading && (
              <p style={{ color: palette.textSecondary, fontSize: typography.fontSize.xs, textAlign: 'center', padding: spacing.md }}>
                Ask the AI a question about this meeting
              </p>
            )}
          </div>
          <form onSubmit={(e) => void handleAsk(e)} style={{ display: 'flex', gap: spacing.xs, flexShrink: 0 }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask AI..."
              style={{
                flex: 1,
                padding: `${spacing.xs} ${spacing.sm}`,
                borderRadius: radius.md,
                border: `1px solid ${palette.border}`,
                backgroundColor: palette.background,
                color: palette.text,
                fontSize: typography.fontSize.sm,
              }}
            />
            <Button type="submit" variant="primary" size="sm" disabled={loading !== null}>
              Ask
            </Button>
          </form>
        </>
      )}

      {activeView === 'summary' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.sm, padding: spacing.xs }}>
          {summary ? (
            <div
              style={{
                padding: spacing.sm,
                borderRadius: radius.sm,
                backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)',
                fontSize: typography.fontSize.sm,
                color: palette.text,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              {summary}
            </div>
          ) : (
            <p style={{ color: palette.textSecondary, fontSize: typography.fontSize.xs, textAlign: 'center', padding: spacing.md }}>
              No summary generated yet
            </p>
          )}
          {loading && (
            <div style={{ color: palette.textSecondary, fontSize: typography.fontSize.xs, fontStyle: 'italic' }}>
              {loading}
            </div>
          )}
          <div style={{ marginTop: 'auto' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleGenerateSummary()}
              disabled={loading !== null}
              style={{ width: '100%' }}
            >
              {summary ? 'Regenerate' : 'Generate Summary'}
            </Button>
          </div>
        </div>
      )}

      {activeView === 'actions' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.sm, padding: spacing.xs }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {MOCK_ACTION_ITEMS.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: spacing.sm,
                  borderRadius: radius.sm,
                  backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)',
                  borderLeft: `3px solid ${colors.semantic.warning}`,
                }}
              >
                <p style={{ margin: 0, fontSize: typography.fontSize.sm, color: palette.text }}>{item.description}</p>
                <p style={{ margin: '4px 0 0', fontSize: typography.fontSize.xs, color: palette.textSecondary }}>
                  Assigned to: {item.assignee}
                </p>
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleGenerateSummary()}
            disabled={loading !== null}
          >
            Refresh Actions
          </Button>
        </div>
      )}
    </div>
  );
}

const MOCK_ANSWERS: Record<string, string> = {
  agenda: 'Based on the meeting context, the agenda includes discussing the Q4 roadmap, reviewing current sprint progress, and planning resource allocation for the collaboration feature.',
  deadline: 'The key deadlines mentioned in this meeting are: Q4 roadmap finalization by end of next week, collaboration feature prototype due in 2 sprints, and enterprise sales deck ready by next month.',
  decision: 'The team decided to prioritize the real-time collaboration feature over performance improvements for the next sprint. The performance work will be scheduled for the following sprint.',
  action: 'The action items from this meeting are: finalize the collaboration feature spec (Product Team), set up performance benchmarks (Engineering), and prepare the enterprise sales deck (Marketing).',
};

function getMockAnswer(question: string): string {
  const q = question.toLowerCase();
  for (const [key, answer] of Object.entries(MOCK_ANSWERS)) {
    if (q.includes(key)) return answer;
  }
  return 'Based on the meeting context, I can help you with questions about agenda, deadlines, decisions, and action items. Could you provide more specific details about what you\'d like to know?';
}
