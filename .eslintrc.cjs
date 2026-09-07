module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      // Transport state (stream URI, stop) is owned by PlaybackController.
      // UI requests playback via PLAY_SONG / PLAY_SONG_FROM / PLAY_LIST.
      files: ['src/components/**/*.{ts,tsx}', 'src/containers/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "MemberExpression[object.name='types'][property.name='SET_CURRENT_PLAYING_URL']",
            message: 'stream URI state is written by PlaybackController; dispatch PLAY_SONG or PLAY_SONG_FROM instead',
          },
          {
            selector: "MemberExpression[object.name='types'][property.name='STOP_PLAYING']",
            message: 'transport stop is owned by PlaybackController',
          },
        ],
      },
    },
  ],
}
