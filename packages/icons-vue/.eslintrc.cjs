module.exports = {
  extends: ['@takeoff-icons/eslint-config'],
  // src/ is 100% auto-generated (see scripts/generate-vue.ts) and gitignored.
  // Linting machine output adds no value and is brittle (the prettier CLI and
  // eslint-plugin-prettier disagree on long string-literal lines), so skip it.
  ignorePatterns: ['src'],
};
