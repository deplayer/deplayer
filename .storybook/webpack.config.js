'use strict';

// your app's webpack.config.js
const cssRules = require('../config/cssRules.js')
const paths = require('../config/paths.js')

module.exports = async ({ config, mode }) => {
  const typescriptRules = {
    test: /\.(ts|tsx)$/,
    include: paths.appSrc,
    use: {
      loader: require.resolve('babel-loader'),
      options: {
        presets: [['@babel/react']],
      }
    }
  }
  config.resolve.extensions.push('.ts', '.tsx')
  // Export a function. Accept the base config as the only param.
  // `mode` has a value of 'DEVELOPMENT' or 'PRODUCTION'
  // You can change the configuration based on that.
  // 'PRODUCTION' is used when building the static version of storybook.

  return {
    ...config,
    module: {
      ...config.module,
      rules: [typescriptRules, ...cssRules,
        {
          test: /\.(png|woff|woff2|eot|ttf|svg)$/,
          loaders: ['file-loader']
        }
      ]
    }
  }
}
