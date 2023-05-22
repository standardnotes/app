import { ItemContent } from '../../Abstract/Content/ItemContent'

export type TrustedContactContentSpecialized = {
  name: string
  contactItemUuid: string
  userUuid: string
  publicKey: string
}

export type TrustedContactContent = TrustedContactContentSpecialized & ItemContent
