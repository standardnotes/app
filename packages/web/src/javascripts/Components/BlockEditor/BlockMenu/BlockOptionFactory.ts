import { BlockType, IconsController, SNComponent } from '@standardnotes/snjs'
import { BlockOption } from './BlockOption'

export function componentToBlockOption(component: SNComponent, iconsController: IconsController): BlockOption {
  const [iconType, tint] = iconsController.getIconAndTintForNoteType(component.package_info.note_type)

  return {
    identifier: component.uuid,
    type: BlockType.Component,
    label: component.name,
    icon: iconType,
    iconTint: tint,
    component: component,
  }
}

export const PlaintextBlockOption: BlockOption = {
  identifier: 'plaintext',
  type: BlockType.Plaintext,
  label: 'Plain text',
  icon: 'plain-text',
  iconTint: 1,
}

export const BlockquoteBlockOption: BlockOption = {
  identifier: 'blockquote',
  type: BlockType.Quote,
  label: 'Blockquote',
  icon: 'chevron-right',
  iconTint: 1,
}
