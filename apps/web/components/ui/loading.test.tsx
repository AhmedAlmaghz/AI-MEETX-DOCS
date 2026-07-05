import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ThemeProvider } from '@aimeetx/ui';
import { Loading } from './loading';

afterEach(() => cleanup());

function Wrapper({ children }: { readonly children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('Loading component', () => {
  it('renders without text', () => {
    const { container } = render(<Loading />, { wrapper: Wrapper });
    expect(container.querySelector('[style*="animation: spin"]')).toBeTruthy();
  });

  it('renders with custom text', () => {
    const { getByText } = render(<Loading text="Loading meetings..." />, { wrapper: Wrapper });
    expect(getByText('Loading meetings...')).toBeTruthy();
  });

  it('renders small size', () => {
    const { container } = render(<Loading size="sm" />, { wrapper: Wrapper });
    expect(container.querySelector('[style*="animation: spin"]')).toBeTruthy();
  });

  it('renders large size', () => {
    const { container } = render(<Loading size="lg" />, { wrapper: Wrapper });
    expect(container.querySelector('[style*="animation: spin"]')).toBeTruthy();
  });
});