export function getEmojiLength(emoji: string): number {
  try {
    return [...new Intl.Segmenter().segment(emoji)].length
  } catch (error) {
    console.log('getEmojiLength > error', error)
    return [...emoji].length
  }
}
