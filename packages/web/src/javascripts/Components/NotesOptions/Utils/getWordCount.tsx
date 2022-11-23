export const getWordCount = (text: string) => {
  if (text.trim().length === 0) {
    return 0
  }
  return text.split(/\s+/).length
}
