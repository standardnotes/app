import { ChangelogVersion } from '@standardnotes/ui-services'
import { SectionKey } from './SectionKey'
import { IgnoreScopes } from './IgnoreScopes'

function removeAnythingInParentheses(line: string): string {
  return line.replace(/\(.*\)/g, '')
}

function capitalizeFirstLetter(line: string): string {
  return line.charAt(0).toUpperCase() + line.slice(1)
}

export function formatChangelogLine(line: string): string {
  let result = capitalizeFirstLetter(line)

  result = removeAnythingInParentheses(result)

  return result
}

function lineHasIgnoredScope(line: string): boolean {
  return IgnoreScopes.some((scope) => line.toLowerCase().includes(scope.toLowerCase()))
}

function lineHasOnlyOneWord(line: string): boolean {
  return line.trim().split(' ').length === 1
}

export function getSectionItems(version: ChangelogVersion, sectionKey: SectionKey): string[] | undefined {
  const section = version.parsed[sectionKey]
  if (!section) {
    return undefined
  }

  const filtered = section.map(formatChangelogLine).filter((item) => {
    return !lineHasIgnoredScope(item) && !lineHasOnlyOneWord(item)
  })

  if (filtered.length === 0) {
    return undefined
  }

  return filtered
}
