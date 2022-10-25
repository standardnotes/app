import { IconType } from './../../Utilities/Icon/IconType'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { EmojiString } from '../../Utilities/Icon/IconType'
import { TagPreferences } from './TagPreferences'

export interface TagContentSpecialized {
  title: string
  expanded: boolean
  iconString: IconType | EmojiString
  preferences?: TagPreferences
}

export type TagContent = TagContentSpecialized & ItemContent
