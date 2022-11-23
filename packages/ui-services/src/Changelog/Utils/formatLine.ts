import { capitalizeFirstLetter } from './capitalizeFirstLetter'

export function formatLine(line: string, scopes: string[]) {
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
