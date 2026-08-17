import { TextRange } from './types'

export function applyTextReplacements(text: string, ranges: TextRange[], replacement: string): string {
  if (!ranges.length) {
    return text
  }

  const sortedRanges = [...ranges].sort((a, b) => b.start - a.start)
  let result = text

  for (const { start, end } of sortedRanges) {
    result = result.slice(0, start) + replacement + result.slice(end)
  }

  return result
}
