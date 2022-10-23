export function getEmojiLength(emoji: string): number {
  try {
    return [...new Intl.Segmenter().segment(emoji)].length
  } catch (error) {
    return [...emoji].length
  }
}
