import { FunctionComponent } from 'react'
import { BlockOption } from './BlockOption'

export type BlockMenuOptionProps = {
  option: BlockOption
  onSelect: (option: BlockOption) => void
}

export const BlockMenuOption: FunctionComponent<BlockMenuOptionProps> = ({ option, onSelect }) => {
  return <div onClick={() => onSelect}>{option.label}</div>
}
