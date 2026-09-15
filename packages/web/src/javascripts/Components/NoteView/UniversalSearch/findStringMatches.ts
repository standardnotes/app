import { TextRange } from './types'

export function findStringMatches(text: string, query: string, isCaseSensitive: boolean): TextRange[] {
  if (!query) {
    return []
  }

  const haystack = isCaseSensitive ? text : text.toLowerCase()
  const needle = isCaseSensitive ? query : query.toLowerCase()
  const matches: TextRange[] = []
  let startIndex = 0

  while (startIndex <= haystack.length - needle.length) {
    const index = haystack.indexOf(needle, startIndex)
    if (index === -1) {
      break
    }

    matches.push({ start: index, end: index + needle.length })
    startIndex = index + needle.length
  }

  return matches
}
