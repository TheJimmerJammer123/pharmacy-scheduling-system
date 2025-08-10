module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    'react-refresh',
    'react',
    'react-hooks',
    '@typescript-eslint',
    'jsx-a11y'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // React specific
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true }
    ],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off', // We use TypeScript for prop validation
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-unused-state': 'error',
    'react/self-closing-comp': 'error',
    'react/jsx-pascal-case': 'error',
    
    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'warn',
    
    // Accessibility
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    
    // General code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'eqeqeq': ['error', 'always'],
    'no-console': ['warn', { 
      allow: ['warn', 'error'] 
    }],
    'no-debugger': 'error',
    'no-unused-vars': 'off', // Use TypeScript version instead
    
    // Style (let Prettier handle most)
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { 
      allowTemplateLiterals: true 
    }],
    'comma-dangle': ['error', 'never'],
    'no-multiple-empty-lines': ['error', { 
      max: 2,
      maxEOF: 1 
    }]
  },
  overrides: [
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};