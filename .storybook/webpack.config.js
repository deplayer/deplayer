// your app's webpack.config.js
const cssRules = require('../config/cssRules.js')
const paths = require('../config/paths.js')

module.exports = ({ config }) => {
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


  return {
    ...config,
    module: {
      ...config.module,
      rules: [typescriptRules, ...cssRules]
    }
  }
}
