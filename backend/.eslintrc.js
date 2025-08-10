module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Error prevention
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'no-console': ['warn', { 
      allow: ['warn', 'error'] 
    }],
    'no-debugger': 'error',
    'no-unreachable': 'error',
    'no-duplicate-case': 'error',
    'no-empty': ['error', { 
      allowEmptyCatch: false 
    }],
    
    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
    
    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-magic-numbers': ['warn', { 
      ignore: [0, 1, -1, 2, 10, 100, 1000],
      ignoreArrayIndexes: true,
      detectObjects: false
    }],
    'consistent-return': 'error',
    'default-case': 'error',
    'dot-notation': 'error',
    'no-else-return': 'error',
    'no-multi-spaces': 'error',
    'no-multiple-empty-lines': ['error', { 
      max: 2,
      maxEOF: 1 
    }],
    
    // Style (let Prettier handle most of this)
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { 
      allowTemplateLiterals: true 
    }],
    'comma-dangle': ['error', 'never'],
    'indent': ['error', 2, { 
      SwitchCase: 1 
    }],
    
    // Node.js specific
    'no-process-exit': 'error',
    'no-buffer-constructor': 'error',
    'no-new-require': 'error',
    'no-path-concat': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-magic-numbers': 'off'
      }
    }
  ]
};