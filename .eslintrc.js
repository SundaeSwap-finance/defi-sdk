module.exports = {
  extends: ["@sundae/eslint-config"],
  env: {
    es2020: true,
    browser: true,
    node: true,
    jest: true,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": ["warn"],
  },
};
