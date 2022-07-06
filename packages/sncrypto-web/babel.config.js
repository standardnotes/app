module.exports = function (api) {
  api.cache.forever()

  return {
    presets: ['@babel/preset-env'],
    plugins: ['@babel/plugin-syntax-dynamic-import'],
  }
}
