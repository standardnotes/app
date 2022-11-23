import { formatLine } from './formatLine'

export function cleanOutputString(string: string, scopes: string[]) {
  const lines = string.split('\n')
  const outLines = []
  for (const line of lines) {
    const outLine = formatLine(line, scopes)
    outLines.push(outLine)
  }

  return outLines.join('\n')
}
