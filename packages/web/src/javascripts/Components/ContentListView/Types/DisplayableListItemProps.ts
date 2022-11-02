import { SNTag } from '@standardnotes/snjs'
import { AbstractListItemProps } from './AbstractListItemProps'
import { ListableContentItem } from './ListableContentItem'

export type DisplayableListItemProps<I extends ListableContentItem> = AbstractListItemProps<I> & {
  tags: {
    uuid: SNTag['uuid']
    title: SNTag['title']
    iconString: SNTag['iconString']
  }[]
}
