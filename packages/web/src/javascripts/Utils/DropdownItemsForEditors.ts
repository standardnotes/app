import {
  ComponentArea,
  FindNativeFeature,
  GetIframeAndNativeEditors,
  NativeFeatureIdentifier,
  NoteType,
} from '@standardnotes/features'
import { getIconAndTintForNoteType } from './Items/Icons/getIconAndTintForNoteType'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { WebApplicationInterface } from '@standardnotes/ui-services'
import { classNames } from '@standardnotes/snjs'

export type EditorOption = DropdownItem & {
  value: string
  isLabs?: boolean
}

export function getDropdownItemsForAllEditors(application: WebApplicationInterface): EditorOption[] {
  const options: EditorOption[] = []

  options.push(
    ...GetIframeAndNativeEditors().map((editor) => {
      const [iconType, tint] = getIconAndTintForNoteType(editor.note_type)

      return {
        label: editor.name,
        value: editor.identifier,
        id: NativeFeatureIdentifier.create(editor.identifier).getValue(),
        ...(iconType ? { icon: iconType } : null),
        ...(tint
          ? {
              iconClassName: classNames(
                `text-accessory-tint-${tint}`,
                editor.note_type === NoteType.Plain && 'group-hover:text-info-contrast',
              ),
            }
          : null),
      }
    }),
  )

  options.push(
    ...application.componentManager
      .thirdPartyComponentsForArea(ComponentArea.Editor)
      .filter((component) => {
        const nativeFeature = FindNativeFeature(component.identifier)
        return !nativeFeature || nativeFeature.deprecated
      })
      .map((editor): EditorOption => {
        const [iconType, tint] = getIconAndTintForNoteType(editor.noteType)

        return {
          label: editor.displayName,
          value: editor.identifier,
          ...(iconType ? { icon: iconType } : null),
          ...(tint ? { iconClassName: `text-accessory-tint-${tint}` } : null),
        }
      }),
  )

  options.sort((a, b) => {
    return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1
  })

  return options
}
