import fs from 'fs'
import path from 'path'
import minimatch from 'minimatch'

export const doesDirExist = (dir) => {
  return fs.existsSync(dir)
}

export const doesFileExist = (file) => {
  return fs.existsSync(file)
}

export const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export const emptyExistingDir = (dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true })
  }
}

export const listDirFiles = (dir) => {
  return fs.readdirSync(dir)
}

export const writeJson = (data, path) => {
  const string = JSON.stringify(data, null, 2)
  return fs.writeFileSync(path, string)
}

export const copyRecursiveSync = (src, dest) => {
  fs.cpSync(src, dest, { recursive: true })
}

export const copyFileOrDir = (src, dest, exludedFilesGlob) => {
  const isDir = fs.lstatSync(src).isDirectory()
  if (isDir) {
    ensureDirExists(dest)
    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)

      const excluded = exludedFilesGlob && minimatch(srcPath, exludedFilesGlob)
      if (excluded) {
        continue
      }
      const destPath = path.join(dest, entry.name)

      entry.isDirectory() ? copyFileOrDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath)
    }
  } else {
    const excluded = exludedFilesGlob && minimatch(src, exludedFilesGlob)
    if (excluded) {
      return
    }
    fs.copyFileSync(src, dest)
  }
}
