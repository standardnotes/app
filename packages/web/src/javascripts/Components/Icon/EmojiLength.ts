export function getEmojiLength(emoji: string): number {
  try {
    return [...new Intl.Segmenter().segment(emoji)].length
  } catch {
    return [...emoji].length
  }
}
