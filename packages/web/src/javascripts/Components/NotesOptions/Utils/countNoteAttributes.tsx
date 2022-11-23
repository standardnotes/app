import { getWordCount } from './getWordCount'
import { getParagraphCount } from './getParagraphCount'

export const countNoteAttributes = (text: string) => {
  try {
    JSON.parse(text)
    return {
      characters: 'N/A',
      words: 'N/A',
      paragraphs: 'N/A',
    }
  } catch {
    const characters = text.length
    const words = getWordCount(text)
    const paragraphs = getParagraphCount(text)

    return {
      characters,
      words,
      paragraphs,
    }
  }
}
