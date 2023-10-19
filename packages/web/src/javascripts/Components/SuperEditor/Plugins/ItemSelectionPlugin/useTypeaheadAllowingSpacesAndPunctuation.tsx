import { LexicalEditor } from 'lexical'
import { useCallback } from 'react'

export type QueryMatch = {
  leadOffset: number
  matchingString: string
  replaceableString: string
}
type TriggerFn = (text: string, editor: LexicalEditor) => QueryMatch | null

/**
 * Derived from
 * https://github.com/facebook/lexical/blob/main/packages/lexical-react/src/LexicalTypeaheadMenuPlugin.tsx#L545
 */
export function useTypeaheadAllowingSpacesAndPunctuation(
  trigger: string,
  { minLength = 1, maxLength = 75 }: { minLength?: number; maxLength?: number },
): TriggerFn {
  return useCallback(
    (text: string) => {
      const validChars = '[^' + trigger + ']'
      const TypeaheadTriggerRegex = new RegExp(
        '(^|\\s|\\()(' + '[' + trigger + ']' + '(\\S(?:' + validChars + '){0,' + maxLength + '})' + ')$',
      )
      const match = TypeaheadTriggerRegex.exec(text)
      if (match !== null) {
        const maybeLeadingWhitespace = match[1]
        const matchingString = match[3]
        if (matchingString.length >= minLength) {
          return {
            leadOffset: match.index + maybeLeadingWhitespace.length,
            matchingString,
            replaceableString: match[2],
          }
        }
      }
      return null
    },
    [maxLength, minLength, trigger],
  )
}
