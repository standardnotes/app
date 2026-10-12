import { SmartView, SystemViewId, isSystemView } from '@standardnotes/snjs'
import { c } from 'ttag'

export function getLocalizedSystemViewTitle(id: SystemViewId): string | undefined {
  switch (id) {
    case SystemViewId.AllNotes:
      return c('B4.Notes.TagsLinkedItems.Label').t`Notes`
    case SystemViewId.Files:
      return c('B4.Notes.TagsLinkedItems.Label').t`Files`
    case SystemViewId.ArchivedNotes:
      return c('B4.Notes.TagsLinkedItems.Action').t`Archived`
    case SystemViewId.TrashedNotes:
      return c('B4.Notes.TagsLinkedItems.Action').t`Trash`
    case SystemViewId.UntaggedNotes:
      return c('B4.Notes.TagsLinkedItems.Label').t`Untagged`
    case SystemViewId.StarredNotes:
      return c('B4.Notes.TagsLinkedItems.Action').t`Starred`
    case SystemViewId.Conflicts:
      return c('B4.Notes.TagsLinkedItems.Label').t`Conflicts`
    default:
      return undefined
  }
}

export function getSmartViewDisplayTitle(view: SmartView): string {
  if (isSystemView(view)) {
    return getLocalizedSystemViewTitle(view.uuid as SystemViewId) ?? view.title
  }

  return view.title
}
