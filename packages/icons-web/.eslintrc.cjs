module.exports = {
  extends: ['@takeoff-icons/eslint-config'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { varsIgnorePattern: '^(h|_.*)$', argsIgnorePattern: '^_' },
    ],
  },
};
