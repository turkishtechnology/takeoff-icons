module.exports = {
  extends: ['@tk-icons/eslint-config'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { varsIgnorePattern: '^(h|_.*)$', argsIgnorePattern: '^_' },
    ],
  },
};
