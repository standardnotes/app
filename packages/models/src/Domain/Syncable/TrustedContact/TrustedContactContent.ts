import { ItemContent } from '../../Abstract/Content/ItemContent'

export type TrustedContactContentSpecialized = {
  name: string
  contactItemUuid: string
  contactUserUuid: string
  contactPublicKey: string
}

export type TrustedContactContent = TrustedContactContentSpecialized & ItemContent
