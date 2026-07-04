import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import { Button } from './button.js';
import { Input } from './input.js';
import { colors, spacing, typography, radius } from '../tokens/index.js';

afterEach(() => cleanup());

describe('Design tokens', () => {
  it('exports all required token groups', () => {
    expect(colors.brand.primary).toBeDefined();
    expect(colors.semantic.error).toBeDefined();
    expect(colors.light.background).toBeDefined();
    expect(colors.dark.background).toBeDefined();
  });

  it('spacing tokens use consistent px units', () => {
    expect(spacing.xs).toBe('4px');
    expect(spacing.md).toBe('16px');
  });

  it('typography tokens define font families and sizes', () => {
    expect(typography.fontFamily.sans).toBeTruthy();
    expect(typography.fontSize.base).toBe('16px');
  });

  it('radius tokens define standard border radius values', () => {
    expect(radius.none).toBe('0');
    expect(radius.md).toBe('8px');
  });
});

describe('Button component', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('applies variant styles correctly', () => {
    const { getByText } = render(<Button variant="danger">DeleteStyle</Button>);
    const button = getByText('DeleteStyle');
    expect(button.tagName).toBe('BUTTON');
  });

  it('disables when disabled prop is set', () => {
    const { getByText } = render(<Button disabled>DisabledStyle</Button>);
    const button = getByText('DisabledStyle');
    expect(button.tagName).toBe('BUTTON');
  });
});

describe('Input component', () => {
  it('renders with a label', () => {
    const { getByText } = render(<Input label="Email" placeholder="Enter email" />);
    expect(getByText('Email')).toBeTruthy();
  });

  it('shows error message when error prop is set', () => {
    const { getByText } = render(<Input label="Email" error="Invalid email" />);
    expect(getByText('Invalid email')).toBeTruthy();
  });
});