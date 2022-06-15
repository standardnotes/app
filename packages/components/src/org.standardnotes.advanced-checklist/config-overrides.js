module.exports = function override(config, env) {
  config.ignoreWarnings = [/Failed to parse source map/]
  config.output = {
    ...config.output,
    filename: 'static/js/[name].js',
    chunkFilename: 'static/js/[name].chunk.js',
    assetModuleFilename: 'static/media/[name].[ext]',
  }
  return config
}
