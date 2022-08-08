export type OnChunkCallback = (chunk: Uint8Array, index: number, isLast: boolean) => Promise<void>
