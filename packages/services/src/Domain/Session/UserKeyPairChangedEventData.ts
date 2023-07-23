import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export type UserKeyPairChangedEventData = {
  current: {
    encryption: PkcKeyPair
    signing: PkcKeyPair
  }
  previous?: {
    encryption: PkcKeyPair
    signing: PkcKeyPair
  }
}
