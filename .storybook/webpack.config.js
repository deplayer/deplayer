// your app's webpack.config.js
const custom = require('../config/webpack.config.dev.js')

module.exports = async ({ config, mode }) => {
  return { ...config, module: { ...config.module, rules: custom.module.rules } }
};
