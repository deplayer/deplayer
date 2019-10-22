// your app's webpack.config.js
const custom = require('../config/webpack.config.dev.js')

module.exports = ({ config }) => {
  const typescriptRules = {
    test: /\.(ts|tsx)$/,
    use: [
      {
        loader: require.resolve('awesome-typescript-loader'),
      },
      // Optional
      {
        loader: require.resolve('react-docgen-typescript-loader'),
      },
    ],
  }
  config.resolve.extensions.push('.ts', '.tsx')

  return {
    ...config,
    module: {
      ...config.module,
      rules: [typescriptRules]
    }
  }
}
