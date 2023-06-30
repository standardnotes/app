import { ItemContent } from '../../Abstract/Content/ItemContent'
import { ContactPublicKeySetInterface } from './PublicKeySet/ContactPublicKeySetInterface'

export type TrustedContactContentSpecialized = {
  name: string
  contactUuid: string
  publicKeySet: ContactPublicKeySetInterface
  isMe: boolean
}

export type TrustedContactContent = TrustedContactContentSpecialized & ItemContent
