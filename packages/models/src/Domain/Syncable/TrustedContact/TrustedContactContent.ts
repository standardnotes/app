import { ItemContent } from '../../Abstract/Content/ItemContent'
import { ContactPublicKeySetInterface } from './PublicKeySet/ContactPublicKeySetInterface'

export type TrustedContactContentSpecialized = {
  name: string
  contactUuid: string
  publicKey: ContactPublicKeySetInterface
}

export type TrustedContactContent = TrustedContactContentSpecialized & ItemContent
