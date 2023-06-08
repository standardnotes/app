import { ItemContent } from '../../Abstract/Content/ItemContent'
import { TrustedContactPublicKeyInterface } from './TrustedContactPublicKeyInterface'

export type TrustedContactContentSpecialized = {
  name: string
  contactUuid: string
  publicKey: TrustedContactPublicKeyInterface
}

export type TrustedContactContent = TrustedContactContentSpecialized & ItemContent
