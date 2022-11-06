import { ComponentArea, FeatureIdentifier } from '@standardnotes/features'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { WebApplication } from '@/Application/Application'
import { BLOCKS_EDITOR_NAME, PLAIN_EDITOR_NAME } from '@/Constants/Constants'
import { featureTrunkEnabled, FeatureTrunkName } from '@/FeatureTrunk'

export const PlainEditorType = 'plain-editor'
export const BlocksType = 'blocks-editor'

export type EditorOption = DropdownItem & {
  value: FeatureIdentifier | typeof PlainEditorType | typeof BlocksType
}

export function getDropdownItemsForAllEditors(application: WebApplication) {
  const plaintextOption: EditorOption = {
    icon: 'plain-text',
    iconClassName: 'text-accessory-tint-1',
    label: PLAIN_EDITOR_NAME,
    value: PlainEditorType,
  }

  const options = application.componentManager.componentsForArea(ComponentArea.Editor).map((editor): EditorOption => {
    const identifier = editor.package_info.identifier
    const [iconType, tint] = application.iconsController.getIconAndTintForNoteType(editor.package_info.note_type)

    return {
      label: editor.displayName,
      value: identifier,
      ...(iconType ? { icon: iconType } : null),
      ...(tint ? { iconClassName: `text-accessory-tint-${tint}` } : null),
    }
  })

  options.push(plaintextOption)

  if (featureTrunkEnabled(FeatureTrunkName.Blocks)) {
    options.push({
      icon: 'dashboard',
      iconClassName: 'text-accessory-tint-1',
      label: BLOCKS_EDITOR_NAME,
      value: BlocksType,
    })
  }

  options.sort((a, b) => {
    return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1
  })

  return options
}
