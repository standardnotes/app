import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { spawnSync as spawn } from 'child_process'
import { GetFeatures } from '@standardnotes/features/dist/Domain/Feature/Features.js'
import { GetDeprecatedFeatures } from '@standardnotes/features/dist/Domain/Feature/Lists/DeprecatedFeatures.js'
import zip from '@standardnotes/deterministic-zip'
import minimatch from 'minimatch'

import { fileURLToPath } from 'url'
import { ensureDirExists, doesDirExist, emptyExistingDir } from '../../../scripts/ScriptUtils.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('Beginning packaging procedure...')

const SourceFilesPath = path.join(__dirname, '../src/packages')
const DistDir = path.join(__dirname, '../dist')
const TmpDir = path.join(__dirname, '../tmp')
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

const copyFileOrDir = (src, dest, exludedFilesGlob) => {
  const isDir = fs.lstatSync(src).isDirectory()
  if (isDir) {
    ensureDirExists(dest)
    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)

      const excluded = exludedFilesGlob && minimatch(srcPath, exludedFilesGlob)
      if (excluded) {
        console.log('Excluding file', srcPath)
        continue
      }
      const destPath = path.join(dest, entry.name)

      entry.isDirectory() ? copyFileOrDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath)
    }
  } else {
    const excluded = exludedFilesGlob && minimatch(src, exludedFilesGlob)
    if (excluded) {
      console.log('Excluding file', src)
      return
    }
    fs.copyFileSync(src, dest)
  }
}

const getComponentSrcPath = (feature) => {
  return path.join(SourceFilesPath, feature.identifier)
}

const copyComponentAssets = async (feature, destination, exludedFilesGlob) => {
  const srcComponentPath = getComponentSrcPath(feature)

  if (!doesDirExist(srcComponentPath)) {
    return false
  }

  emptyExistingDir(destination)
  ensureDirExists(destination)

  for (const file of feature.static_files) {
    const srcFilePath = path.join(srcComponentPath, file)
    if (!fs.existsSync(srcFilePath)) {
      continue
    }

    const targetFilePath = path.join(destination, file)
    copyFileOrDir(srcFilePath, targetFilePath, exludedFilesGlob)
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

const packageFeature = async ({ feature, noZip }) => {
  console.log('Processing feature', feature.identifier, '...')

  const assetsLocation = `${path.join(AssetsDir, feature.identifier)}`
  const assetsSuccess = await copyComponentAssets(feature, assetsLocation, '**/package.json')
  if (!assetsSuccess) {
    console.log('Failed to copy assets for', feature.identifier)
    return
  }

  if (noZip) {
    console.log('Input arg noZip detected; not zipping asset.')
    return
  }

  const zipAssetsTmpLocation = `${path.join(TmpDir, feature.identifier)}`
  const zipAssetsSuccess = await copyComponentAssets(feature, zipAssetsTmpLocation)
  if (!zipAssetsSuccess) {
    console.log('Failed to copy zip assets for', feature.identifier)
    return
  }

  const zipDestination = `${ZipsDir}/${feature.identifier}.zip`
  await zipDirectory(zipAssetsTmpLocation, zipDestination)

  const packageJsonFilePath = path.join(getComponentSrcPath(feature), 'package.json')
  const packageJsonFile = JSON.parse(fs.readFileSync(packageJsonFilePath).toString())

  const checksum = await computeChecksum(zipDestination, packageJsonFile.version)
  Checksums[feature.identifier] = checksum

  console.log(`Computed checksums for ${feature.identifier}:`, checksum)
}

await (async () => {
  const args = process.argv[2] || ''
  const noZip = args.includes('--no-zip')

  const featuresToProcess = GetFeatures().concat(GetDeprecatedFeatures())

  let index = 0
  for (const feature of featuresToProcess) {
    if (index === 0) {
      console.log('\n---\n')
    }

    if (['SN|Component', 'SN|Theme'].includes(feature.content_type)) {
      await packageFeature({ feature, noZip })
    } else {
      console.log('Feature is not component, not packaging', feature.identifier)
    }

    if (index !== featuresToProcess.length - 1) {
      console.log('\n---\n')
    }

    index++
  }

  fs.writeFileSync(ChecksumsSrcPath, JSON.stringify(Checksums, undefined, 2))
  copyFileOrDir(ChecksumsSrcPath, ChecksumsDistPath)

  console.log('Succesfully wrote checksums to', ChecksumsSrcPath)

  emptyExistingDir(TmpDir)
})()
