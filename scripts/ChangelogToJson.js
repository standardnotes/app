const parseChangelog = require('changelog-parser')
const path = require('path')
const fs = require('fs')

const FILES = ['packages/web/CHANGELOG.md']

async function saveJsonChangelogs() {
  for (const file of FILES) {
    const parsed = await parseChangelog(path.join(__dirname, `../${file}`))
    const json = JSON.stringify(parsed, null, 2)
    const jsonPath = path.join(__dirname, `../${file}.json`)
    fs.writeFileSync(jsonPath, json)
  }
}

saveJsonChangelogs()
