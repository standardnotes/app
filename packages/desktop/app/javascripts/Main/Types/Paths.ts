import decryptScript from 'decrypt/dist/decrypt.html'
import { app } from 'electron'
import path from 'path'
import grantLinuxPasswordsAccess from '../../../grantLinuxPasswordsAccess.html'
import index from '../../../index.html'

function url(fileName: string): string {
  if ('APP_RELATIVE_PATH' in process.env) {
    return path.join('file://', __dirname, process.env.APP_RELATIVE_PATH as string, fileName)
  }
  return path.join('file://', __dirname, fileName)
}

function filePath(fileName: string): string {
  if ('APP_RELATIVE_PATH' in process.env) {
    return path.join(__dirname, process.env.APP_RELATIVE_PATH as string, fileName)
  }
  return path.join(__dirname, fileName)
}

export const Urls = {
  get indexHtml(): string {
    return url(index)
  },
  get grantLinuxPasswordsAccessHtml(): string {
    return url(grantLinuxPasswordsAccess)
  },
}

/**
 * App paths can be modified at runtime, most frequently at startup, so don't
 * store the results of these getters in long-lived constants (like static class
 * fields).
 */
export const Paths = {
  get userDataDir(): string {
    return app.getPath('userData')
  },
  get homeDir(): string | undefined {
    try {
      return app.getPath('home')
    } catch (error) {
      return undefined
    }
  },
  get documentsDir(): string | undefined {
    try {
      return app.getPath('documents')
    } catch (error) {
      return undefined
    }
  },
  get tempDir(): string {
    return app.getPath('temp')
  },
  get extensionsDirRelative(): string {
    return 'Extensions'
  },
  get extensionsDir(): string {
    return path.join(Paths.userDataDir, 'Extensions')
  },
  get extensionsMappingJson(): string {
    return path.join(Paths.extensionsDir, 'mapping.json')
  },
  get windowPositionJson(): string {
    return path.join(Paths.userDataDir, 'window-position.json')
  },
  get decryptScript(): string {
    return filePath(decryptScript)
  },
  get preloadJs(): string {
    return path.join(__dirname, 'javascripts/renderer/preload.js')
  },
  get components(): string {
    return `${app.getAppPath()}/dist/web/components/assets`
  },
  get grantLinuxPasswordsAccessJs(): string {
    return path.join(__dirname, 'javascripts/renderer/grantLinuxPasswordsAccess.js')
  },
}
