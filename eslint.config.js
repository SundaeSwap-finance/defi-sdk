import { configs } from "@sundaeswap/eslint-config";
export default [
  ...configs,
  {
    languageOptions: {
      globals: {
        global: true,
      },
    },
  },
];
