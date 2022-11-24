export const getParagraphCount = (text: string) => {
  if (text.trim().length === 0) {
    return 0
  }
  return text.replace(/\n$/gm, '').split(/\n/).length
}
