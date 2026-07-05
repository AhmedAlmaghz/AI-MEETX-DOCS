import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render, act } from '@testing-library/react';
import { ThemeProvider } from '@aimeetx/ui';
import { ToastContainer, toast } from './toast';

afterEach(() => cleanup());

function Wrapper({ children }: { readonly children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ToastContainer and toast()', () => {
  it('renders nothing when no toasts', () => {
    const { container } = render(<ToastContainer />, { wrapper: Wrapper });
    expect(container.textContent).toBe('');
  });

  it('shows toast after calling toast()', () => {
    const { getByText } = render(<ToastContainer />, { wrapper: Wrapper });
    act(() => { toast('Hello world', 'info'); });
    expect(getByText('Hello world')).toBeTruthy();
  });

  it('renders success toast', () => {
    const { getByText } = render(<ToastContainer />, { wrapper: Wrapper });
    act(() => { toast('Saved!', 'success'); });
    expect(getByText('Saved!')).toBeTruthy();
  });

  it('renders error toast', () => {
    const { getByText } = render(<ToastContainer />, { wrapper: Wrapper });
    act(() => { toast('Something went wrong', 'error'); });
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('dismisses toast on close button click', () => {
    const { getByText, queryByText } = render(<ToastContainer />, { wrapper: Wrapper });
    act(() => { toast('Dismiss me', 'info'); });
    expect(getByText('Dismiss me')).toBeTruthy();
    const closeBtn = getByText('×');
    act(() => { closeBtn.click(); });
    expect(queryByText('Dismiss me')).toBeNull();
  });
});