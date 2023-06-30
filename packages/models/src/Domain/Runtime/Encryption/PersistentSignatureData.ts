export type PersistentSignatureData =
  | {
      required: true
      contentHash: string
      result: {
        passes: boolean
        publicKey: string
        signature: string
      }
    }
  | {
      required: false
      contentHash: string
      result?: {
        passes: boolean
        publicKey: string
        signature: string
      }
    }
