import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Отключаем стандартное правило
      'no-unused-vars': 'off',

      // Включаем TypeScript-версию с настройками
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',        // Игнорирует аргументы, начинающиеся с _
          caughtErrors: 'all',            // Проверяет все, кроме тех, что игнорируются
          caughtErrorsIgnorePattern: '^_$' // Игнорирует `_` в `catch (_)`
        },
      ],
    },
  },
])