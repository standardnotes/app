/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * And for svg files usage
 * https://stackoverflow.com/a/65231261/2504429
 * @format
 */
const path = require('path')
const { getDefaultConfig } = require('metro-config')

const extraNodeModules = {
  common: path.resolve(__dirname + '../..'),
}

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig()

  return {
    watchFolders: [
      __dirname,
      path.resolve(__dirname, '../icons'),
      path.resolve(__dirname, '../styles'),
    ],
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
      extraNodeModules: new Proxy(extraNodeModules, {
        get: (target, name) => {
          const result = name in target ? target[name] : path.join(process.cwd(), `node_modules/${name}`)
          return result
        },
      }),
    },
  }
})()
