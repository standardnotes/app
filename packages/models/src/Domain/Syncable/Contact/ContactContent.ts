import { ItemContent } from '../../Abstract/Content/ItemContent'

export type ContactContentSpecialized = {
  name: string
  userUuid: string
  publicKey: string
}

export type ContactContent = ContactContentSpecialized & ItemContent
