import { IconsController, SNComponent } from '@standardnotes/snjs'
import { BlockOption } from './BlockOption'

export function componentToBlockOption(component: SNComponent, iconsController: IconsController): BlockOption {
  const [iconType, tint] = iconsController.getIconAndTintForNoteType(component.package_info.note_type)

  return {
    identifier: component.uuid,
    editorIdentifier: component.identifier,
    label: component.name,
    icon: iconType,
    iconTint: tint,
    component: component,
  }
}
