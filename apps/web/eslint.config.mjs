import rootConfig from '../../eslint.config.mjs';

import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Web app ESLint config.
 *
 * Extends the root typescript-eslint config and adds the Next.js and
 * React hooks plugins so the Next.js / React-specific rules referenced via
 * `eslint-disable-next-line` comments in the app are defined.
 */
export default [
  ...rootConfig,
  {
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // The web app uses `InstanceType<typeof import('@aimeetx/sdk').XYZ>` for use-case
      // resolution because tsyringe doesn't expose the class as a value at compile time.
      // Allow inline `import()` type annotations in this app only.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports', disallowTypeAnnotations: false },
      ],
      // The web app intentionally uses vi.fn() in test files. Allow no-unused-vars for _-prefixed.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // resolveUseCase<InstanceType<typeof import(...))>> causes false positives because
      // ESLint's type checker cannot resolve the `import()` expression inside InstanceType.
      // TypeScript (tsc) handles it correctly — typecheck passes.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
];