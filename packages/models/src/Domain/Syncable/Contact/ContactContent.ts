import { ItemContent } from '../../Abstract/Content/ItemContent'

export type ContactContentSpecialized = {
  name: string
  publicKey: string
  userUuid: string
  trusted: boolean
}

export type ContactContent = ContactContentSpecialized & ItemContent
