const parseChangelog = require('changelog-parser')
const path = require('path')

const scopes = ['mobile', 'web', 'desktop']

async function parsePackages(packageNames) {
  let result = ''
  let index = 0
  for (const package of packageNames) {
    const parsed = await parseChangelog(path.join(__dirname, `../packages/${package}/CHANGELOG.md`))
    const latest = parsed.versions[0]
    if (packageNames.length > 1) {
      result += `## ${capitalizeFirstLetter(package)} Changes\n`
    }
    result += `${latest.body}\n`
    if (index !== packageNames.length - 1) {
      result += '\n'
    }
    index++
  }

  return cleanOutputString(result)
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function formatLine(line) {
  for (const scope of scopes) {
    const formattedScope = `**${scope}:**`
    if (line.includes(formattedScope)) {
      const parts = line.split(formattedScope)
      const hasBulletAndScope = parts.length === 2
      if (hasBulletAndScope) {
        return `${parts[0]}**${capitalizeFirstLetter(scope)}**: ${capitalizeFirstLetter(parts[1].trim())}`
      } else {
        return line.replace(formattedScope, `**${capitalizeFirstLetter(scope)}:**`)
      }
    }
  }

  const bulletLinePrefix = '* '
  const bulletParts = line.split(bulletLinePrefix)
  const hasBulletOnly = bulletParts.length === 2
  if (hasBulletOnly) {
    return `${bulletLinePrefix} ${capitalizeFirstLetter(bulletParts[1])}`
  }

  return line
}

function cleanOutputString(string) {
  const lines = string.split('\n')
  const outLines = []
  for (const line of lines) {
    const outLine = formatLine(line)
    outLines.push(outLine)
  }

  return outLines.join('\n')
}

const packages = process.argv.slice(2);
parsePackages(packages).then((result) => {
  process.stdout.write(result)
})
