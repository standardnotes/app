module.exports = function override(config, env) {
  return {
    ...config,
    output: {
      ...config.output,
      filename: 'static/js/[name].js',
      chunkFilename: 'static/js/[name].chunk.js',
      assetModuleFilename: 'static/media/[name].[ext]',
    }
  }
}
