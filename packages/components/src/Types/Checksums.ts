import { FeatureIdentifier } from '@standardnotes/features'

type ChecksumEntry = {
  version: string
  base64: string
  binary: string
}

export type ComponentChecksumsType = Record<FeatureIdentifier, ChecksumEntry>
