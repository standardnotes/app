import { BlockType, IconType, SNComponent } from '@standardnotes/snjs'

export type BlockOption = {
  type: BlockType
  label: string
  identifier: string
  icon: IconType
  iconTint: number
  component?: SNComponent
}
