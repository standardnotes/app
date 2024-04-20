export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject()
      }
    }
    reader.readAsText(file)
  })
}

export const getBlobFromBase64 = (b64Data: string, contentType = '') => {
  const byteString = atob(b64Data.split(',')[1])

  if (!contentType) {
    contentType = b64Data.split(',')[0].split(':')[1].split(';')[0]
  }

  const buffer = new ArrayBuffer(byteString.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < byteString.length; i++) {
    view[i] = byteString.charCodeAt(i)
  }

  const blob = new Blob([buffer], { type: contentType })
  return blob
}
