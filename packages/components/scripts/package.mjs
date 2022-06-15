import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { spawnSync as spawn } from 'child_process'
import { GetFeatures } from '@standardnotes/features/dist/Domain/Feature/Features.js'
import { GetDeprecatedFeatures } from '@standardnotes/features/dist/Domain/Feature/Lists/DeprecatedFeatures.js'
import zip from '@standardnotes/deterministic-zip'

import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('Beginning packaging procedure...')

const specificFeatureIdentifier = process.argv[2]
if (specificFeatureIdentifier) {
  console.log('Processing only', specificFeatureIdentifier)
}

const SourceFilesPath = path.join(__dirname, '../src')
const DistDir = path.join(__dirname, '../dist')
const ZipsDir = path.join(DistDir, '/zips')
const AssetsDir = path.join(DistDir, '/assets')
const ChecksumsSrcPath = path.join(ZipsDir, 'checksums.json')
const ChecksumsDistPath = path.join(ZipsDir, 'checksums.json')

const Checksums = JSON.parse(fs.readFileSync(ChecksumsSrcPath).toString())
console.log('Loaded existing checksums from', ChecksumsSrcPath)

async function zipDirectory(sourceDir, outPath) {
  return new Promise((resolve) => {
    zip(sourceDir, outPath, { cwd: sourceDir }, (err) => {
      console.log(`Zipped to ${outPath}`)
      resolve(outPath)
    })
  })
}

const copyFileOrDir = (src, dest) => {
  const isDir = fs.lstatSync(src).isDirectory()
  if (isDir) {
    ensureDirExists(dest)
    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      entry.isDirectory() ? copyFileOrDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath)
    }
  } else {
    fs.copyFileSync(src, dest)
  }
}

const doesDirExist = (dir) => {
  return fs.existsSync(dir)
}

const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

const emptyExistingDir = (dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true })
  }
}

const copyComponentAssets = async (feature, targetComponentPath) => {
  const srcComponentPath = path.join(SourceFilesPath, feature.identifier)

  if (!doesDirExist(srcComponentPath)) {
    return false
  }

  emptyExistingDir(targetComponentPath)
  ensureDirExists(targetComponentPath)

  for (const file of feature.static_files) {
    const srcFilePath = path.join(srcComponentPath, file)

    if (!fs.existsSync(srcFilePath)) {
      continue
    }

    const targetFilePath = path.join(targetComponentPath, file)
    copyFileOrDir(srcFilePath, targetFilePath)
  }

  return true
}

const computeChecksum = async (zipPath, version) => {
  const zipData = fs.readFileSync(zipPath, 'base64')
  const base64 = crypto.createHash('sha256').update(zipData).digest('hex')
  const checksumProcess = spawn('sha256sum', [zipPath])
  const checksumString = checksumProcess.stdout.toString()
  const binary = checksumString.split('  ')[0]
  return {
    version,
    base64,
    binary,
  }
}

const zipAndChecksumFeature = async (feature) => {
  console.log('Processing feature', feature.identifier, '...')

  const assetsLocation = `${path.join(AssetsDir, feature.identifier)}`
  const success = await copyComponentAssets(feature, assetsLocation)

  if (!success) {
    return
  }

  const zipFilePath = `${ZipsDir}/${feature.identifier}.zip`
  await zipDirectory(assetsLocation, zipFilePath)

  const checksum = await computeChecksum(zipFilePath, feature.version)
  Checksums[feature.identifier] = checksum

  console.log(`Computed checksums for ${feature.identifier}:`, checksum)
}

await (async () => {
  const featuresToProcess = specificFeatureIdentifier
    ? [GetFeatures().find((feature) => feature.identifier === specificFeatureIdentifier)]
    : GetFeatures().concat(GetDeprecatedFeatures())

  let index = 0
  for (const feature of featuresToProcess) {
    if (index === 0) {
      console.log('\n---\n')
    }

    if (feature.download_url) {
      await zipAndChecksumFeature(feature)
    } else {
      console.log('Feature does not have download_url, not packaging', feature.identifier)
    }

    if (index !== featuresToProcess.length - 1) {
      console.log('\n---\n')
    }

    index++
  }

  fs.writeFileSync(ChecksumsSrcPath, JSON.stringify(Checksums, undefined, 2))
  console.log('Succesfully wrote checksums to', ChecksumsSrcPath)
  copyFileOrDir(ChecksumsSrcPath, ChecksumsDistPath)
})()
