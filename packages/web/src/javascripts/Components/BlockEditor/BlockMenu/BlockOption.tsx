import { IconType, SNComponent } from '@standardnotes/snjs'

export type BlockOption = {
  editorIdentifier: string
  label: string
  identifier: string
  icon: IconType | string
  iconTint: number
  component?: SNComponent
}
