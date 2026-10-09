import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const metaDir = path.join(distDir, 'update-meta')

/** output manifest -> preserved fragment ids in dist/update-meta/ */
const MANIFESTS = {
  'latest-mac.yml': ['mac-x64', 'mac-arm64'],
  'latest-linux.yml': ['linux-appimage-x64', 'linux-deb-x64'],
  'latest-linux-arm64.yml': ['linux-appimage-arm64', 'linux-deb-arm64'],
}

/** preferred top-level path for electron-updater */
const PRIMARY_URL = {
  'latest-mac.yml': [/-mac-x64\.zip$/i, /-mac-arm64\.zip$/i],
  'latest-linux.yml': [/-linux-x86_64\.AppImage$/i, /-linux-amd64\.deb$/i],
  'latest-linux-arm64.yml': [/-linux-arm64\.AppImage$/i, /-linux-arm64\.deb$/i],
}

function readMeta(id) {
  const filePath = path.join(metaDir, `${id}.yml`)
  return fs.existsSync(filePath) ? yaml.load(fs.readFileSync(filePath, 'utf8')) : null
}

function mergeFiles(docs) {
  const byUrl = new Map()
  for (const doc of docs) {
    for (const entry of doc?.files ?? []) {
      if (entry?.url) {
        byUrl.set(entry.url, { ...byUrl.get(entry.url), ...entry })
      }
    }
  }
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url))
}

function pickPrimary(files, manifestName) {
  for (const pattern of PRIMARY_URL[manifestName] ?? []) {
    const match = files.find((f) => pattern.test(f.url))
    if (match) {
      return match
    }
  }
  return files[0]
}

for (const [manifestName, fragmentIds] of Object.entries(MANIFESTS)) {
  const docs = fragmentIds.map(readMeta).filter(Boolean)
  if (docs.length === 0) {
    continue
  }

  const versions = [...new Set(docs.map((d) => d.version).filter(Boolean))]
  if (versions.length > 1) {
    throw new Error(`${manifestName}: conflicting versions ${versions.join(', ')}`)
  }

  const files = mergeFiles(docs)
  if (files.length === 0) {
    continue
  }

  const primary = pickPrimary(files, manifestName)
  const merged = {
    version: versions[0],
    files,
    path: primary.url,
    sha512: primary.sha512,
    releaseDate: docs
      .map((d) => d.releaseDate)
      .filter(Boolean)
      .sort()
      .at(-1),
  }

  fs.writeFileSync(path.join(distDir, manifestName), yaml.dump(merged, { lineWidth: Infinity }))
  console.log(`${manifestName}: ${files.length} file(s)`)
}
