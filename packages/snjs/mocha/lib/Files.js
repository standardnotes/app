export async function uploadFile(fileService, buffer, name, ext, chunkSize) {
  const operation = await fileService.beginNewFileUpload(buffer.byteLength)

  let chunkId = 1
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const readUntil = i + chunkSize > buffer.length ? buffer.length : i + chunkSize
    const chunk = buffer.slice(i, readUntil)
    const isFinalChunk = readUntil === buffer.length

    const error = await fileService.pushBytesForUpload(operation, chunk, chunkId++, isFinalChunk)
    if (error) {
      throw new Error('Could not upload file chunk')
    }
  }

  const file = await fileService.finishUpload(operation, name, ext)

  return file
}

export async function downloadFile(fileService, itemManager, remoteIdentifier) {
  const file = itemManager.getItems(ContentType.File).find((file) => file.remoteIdentifier === remoteIdentifier)

  let receivedBytes = new Uint8Array()

  await fileService.downloadFile(file, (decryptedBytes) => {
    receivedBytes = new Uint8Array([...receivedBytes, ...decryptedBytes])
  })

  return receivedBytes
}
