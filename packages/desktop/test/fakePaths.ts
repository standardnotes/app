import path from 'path'

export default function makeFakePaths(tmpDir: string) {
  const Paths = {
    get userDataDir(): string {
      return tmpDir
    },
    get documentsDir(): string {
      return tmpDir
    },
    get tempDir(): string {
      return tmpDir
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
  }

  return Paths
}
