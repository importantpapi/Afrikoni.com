import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                console: 'readonly',
                import: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                navigator: 'readonly',
                fetch: 'readonly',
                Error: 'readonly',
                Promise: 'readonly',
                __BUILD_VERSION__: 'readonly',
                DOMParser: 'readonly',
                IntersectionObserver: 'readonly',
                performance: 'readonly',
                PerformanceObserver: 'readonly',
                Image: 'readonly',
                requestIdleCallback: 'readonly',
                cancelIdleCallback: 'readonly'
            },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            'no-console': 'warn',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                    caughtErrors: 'none'
                }
            ],
            'no-undef': 'warn',
            'no-useless-escape': 'warn',
            'no-async-promise-executor': 'warn',
            'no-constant-binary-expression': 'warn',
            'no-empty': 'warn',
            'no-useless-catch': 'warn',
            'no-useless-assignment': 'warn',
            'no-case-declarations': 'warn',
            'no-dupe-keys': 'warn',
            'no-unreachable': 'warn',
            'preserve-caught-error': 'warn',
            'no-restricted-syntax': [
                'warn',
                {
                    selector: 'CallExpression[callee.object.name="console"][callee.property.name="log"]',
                    message: 'Use logger.info() instead of console.log() for production-safe logging.',
                },
                {
                    selector: 'CallExpression[callee.object.name="console"][callee.property.name="error"]',
                    message: 'Use logger.error() instead of console.error() for production-safe logging.',
                },
                {
                    selector: 'CallExpression[callee.object.name="console"][callee.property.name="warn"]',
                    message: 'Use logger.warn() instead of console.warn() for production-safe logging.',
                },
            ],
        },
    },
];
