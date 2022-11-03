import { SNComponent } from '@standardnotes/snjs'
import { BlockOption } from './BlockOption'

export function componentToBlockOption(component: SNComponent): BlockOption {
  return {
    identifier: component.uuid,
    editorIdentifier: component.identifier,
    label: component.name,
  }
}
