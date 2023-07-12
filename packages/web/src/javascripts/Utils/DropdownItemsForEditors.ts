import { FeatureIdentifier } from '@standardnotes/snjs'
import { ComponentArea, FindNativeFeature, GetIframeAndNativeEditors } from '@standardnotes/features'
import { getIconAndTintForNoteType } from './Items/Icons/getIconAndTintForNoteType'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { WebApplicationInterface } from '@standardnotes/ui-services'

export type EditorOption = DropdownItem & {
  value: FeatureIdentifier
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
        ...(iconType ? { icon: iconType } : null),
        ...(tint ? { iconClassName: `text-accessory-tint-${tint}` } : null),
      }
    }),
  )

  options.push(
    ...application.componentManager
      .thirdPartyComponentsForArea(ComponentArea.Editor)
      .filter((component) => FindNativeFeature(component.identifier) === undefined)
      .map((editor): EditorOption => {
        const identifier = editor.package_info.identifier
        const [iconType, tint] = getIconAndTintForNoteType(editor.noteType)

        return {
          label: editor.displayName,
          value: identifier,
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
