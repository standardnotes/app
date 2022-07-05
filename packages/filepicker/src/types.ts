export type OnChunkCallback = (chunk: Uint8Array, index: number, isLast: boolean) => Promise<void>

export type FileSelectionResponse = {
  name: string
  mimeType: string
}
