import { SNTag } from '@standardnotes/snjs'
import { AbstractListItemProps } from './AbstractListItemProps'

export type DisplayableListItemProps = AbstractListItemProps & {
  tags: {
    uuid: SNTag['uuid']
    title: SNTag['title']
  }[]
}
