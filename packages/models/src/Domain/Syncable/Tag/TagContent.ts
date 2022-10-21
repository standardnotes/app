import { IconType } from './../../Utilities/Icon/IconType'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { EmojiString } from '../../Utilities/Icon/IconType'

export interface TagContentSpecialized {
  title: string
  expanded: boolean
  iconString: IconType | EmojiString
}

export type TagContent = TagContentSpecialized & ItemContent
