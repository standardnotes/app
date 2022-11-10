import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { doesDirExist, emptyExistingDir, ensureDirExists, copyFileOrDir } from '../../../scripts/ScriptUtils.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const components = {
  '@standardnotes/authenticator': 'org.standardnotes.token-vault',
  '@standardnotes/bold-editor': 'org.standardnotes.bold-editor',
  '@standardnotes/classic-code-editor': 'org.standardnotes.code-editor',
  '@standardnotes/markdown-basic': 'org.standardnotes.simple-markdown-editor',
  '@standardnotes/markdown-hybrid': 'org.standardnotes.advanced-markdown-editor',
  '@standardnotes/markdown-math': 'org.standardnotes.fancy-markdown-editor',
  '@standardnotes/markdown-minimal': 'org.standardnotes.minimal-markdown-editor',
  '@standardnotes/markdown-visual': 'org.standardnotes.markdown-visual-editor',
  '@standardnotes/rich-text': 'org.standardnotes.plus-editor',
  '@standardnotes/simple-task-editor': 'org.standardnotes.simple-task-editor',
  '@standardnotes/spreadsheets': 'org.standardnotes.standard-sheets',
}

const BasePath = path.join(__dirname, '../../../node_modules')

const FilesToCopy = ['index.html', 'dist', 'build', 'package.json']

const copyComponentAssets = async (srcComponentPath, destination, exludedFilesGlob) => {
  if (!doesDirExist(srcComponentPath)) {
    return false
  }

  emptyExistingDir(destination)
  ensureDirExists(destination)

  for (const file of FilesToCopy) {
    const srcFilePath = path.join(srcComponentPath, file)
    if (!fs.existsSync(srcFilePath)) {
      continue
    }

    const targetFilePath = path.join(destination, file)
    copyFileOrDir(srcFilePath, targetFilePath, exludedFilesGlob)
  }

  return true
}

for (const packageName of Object.keys(components)) {
  const identifier = components[packageName]
  const packagePath = `${BasePath}/${packageName}`

  const assetsPath = `src/components/assets/${identifier}`
  fs.mkdirSync(assetsPath, { recursive: true })

  await copyComponentAssets(packagePath, assetsPath, '**/package.json')
}
