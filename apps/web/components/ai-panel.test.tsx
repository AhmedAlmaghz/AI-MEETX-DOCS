import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import type { MeetingId } from '@aimeetx/types';
import AiPanel from './ai-panel';

const testMeetingId = 'meeting_1' as MeetingId;

afterEach(() => cleanup());

const mockPalette = {
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceVariant: '#F3F4F6',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
};

describe('AiPanel component', () => {
  it('renders three sub-tabs', () => {
    const { getByText } = render(<AiPanel meetingId={testMeetingId} isDark={false} palette={mockPalette} />);
    expect(getByText('AI Chat')).toBeTruthy();
    expect(getByText('Summary')).toBeTruthy();
    expect(getByText('Actions')).toBeTruthy();
  });

  it('renders input field', () => {
    const { container } = render(<AiPanel meetingId={testMeetingId} isDark={false} palette={mockPalette} />);
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
  });

  it('shows Ask button', () => {
    const { getByText } = render(<AiPanel meetingId={testMeetingId} isDark={false} palette={mockPalette} />);
    expect(getByText('Ask')).toBeTruthy();
  });
});