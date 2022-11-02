import { ComponentArea, FeatureIdentifier } from '@standardnotes/features'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { WebApplication } from '@/Application/Application'
import { PLAIN_EDITOR_NAME } from '@/Constants/Constants'

export const PlainEditorType = 'plain-editor'

export type EditorOption = DropdownItem & {
  value: FeatureIdentifier | typeof PlainEditorType
}

export function getDropdownItemsForAllEditors(application: WebApplication) {
  const options = application.componentManager
    .componentsForArea(ComponentArea.Editor)
    .map((editor): EditorOption => {
      const identifier = editor.package_info.identifier
      const [iconType, tint] = application.iconsController.getIconAndTintForNoteType(editor.package_info.note_type)

      return {
        label: editor.displayName,
        value: identifier,
        ...(iconType ? { icon: iconType } : null),
        ...(tint ? { iconClassName: `text-accessory-tint-${tint}` } : null),
      }
    })
    .concat([
      {
        icon: 'plain-text',
        iconClassName: 'text-accessory-tint-1',
        label: PLAIN_EDITOR_NAME,
        value: PlainEditorType,
      },
    ])
    .sort((a, b) => {
      return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1
    })

  return options
}
