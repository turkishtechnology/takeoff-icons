module.exports = {
  extends: ['@takeoff-icons/eslint-config/react'],
  // src/ is 100% auto-generated (see scripts/generate-react.ts) and gitignored.
  // Linting machine output adds no value, so skip it.
  ignorePatterns: ['src'],
};
