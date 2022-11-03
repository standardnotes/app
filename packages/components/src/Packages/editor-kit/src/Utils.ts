export const htmlToText = (html: string): string => {
  const tmpDocument = document.implementation.createHTMLDocument().body
  tmpDocument.innerHTML = html
  return tmpDocument.textContent || tmpDocument.innerText || ''
}

export const truncateString = (text: string, limit = 90): string => {
  if (text.length <= limit) {
    return text
  }
  return text.substring(0, limit) + '...'
}

export const sleep = async (seconds: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}
