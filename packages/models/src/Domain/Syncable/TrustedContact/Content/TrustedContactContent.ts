import { ItemContent } from '../../../Abstract/Content/ItemContent'
import { ContactPublicKeySetJsonInterface } from '../PublicKeySet/ContactPublicKeySetJsonInterface'

export type TrustedContactContentSpecialized = {
  name: string
  contactUuid: string
  publicKeySet: ContactPublicKeySetJsonInterface
  isMe: boolean
}

export type TrustedContactContent = TrustedContactContentSpecialized & ItemContent
