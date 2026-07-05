import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ThemeProvider } from '@aimeetx/ui';
import { EmptyState } from './empty-state';

afterEach(() => cleanup());

function Wrapper({ children }: { readonly children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('EmptyState component', () => {
  it('renders title', () => {
    const { getByText } = render(<EmptyState title="No meetings yet" />, { wrapper: Wrapper });
    expect(getByText('No meetings yet')).toBeTruthy();
  });

  it('renders icon', () => {
    const { container } = render(<EmptyState title="Empty" icon="📭" />, { wrapper: Wrapper });
    expect(container.textContent).toContain('📭');
  });

  it('renders body text', () => {
    const { getByText } = render(<EmptyState title="Empty" body="Create your first meeting." />, { wrapper: Wrapper });
    expect(getByText('Create your first meeting.')).toBeTruthy();
  });

  it('renders action element', () => {
    const { getByText } = render(<EmptyState title="Empty" action={<button type="button">Create</button>} />, { wrapper: Wrapper });
    expect(getByText('Create')).toBeTruthy();
  });
});