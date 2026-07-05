import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import Whiteboard from './whiteboard';

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

describe('Whiteboard component', () => {
  it('renders canvas', () => {
    const { container } = render(<Whiteboard isDark={false} palette={mockPalette} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('renders color buttons', () => {
    const { container } = render(<Whiteboard isDark={false} palette={mockPalette} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders undo and clear buttons', () => {
    const { getByText } = render(<Whiteboard isDark={false} palette={mockPalette} />);
    expect(getByText('Undo')).toBeTruthy();
    expect(getByText('Clear')).toBeTruthy();
  });

  it('renders in dark mode', () => {
    const { container } = render(<Whiteboard isDark={true} palette={mockPalette} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });
});