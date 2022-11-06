import Icon from '@/Components/Icon/Icon'
import { FunctionComponent } from 'react'
import { BlockOption } from './BlockOption'

export type BlockMenuOptionProps = {
  option: BlockOption
  onSelect: (option: BlockOption) => void
}

export const BlockMenuOption: FunctionComponent<BlockMenuOptionProps> = ({ option, onSelect }) => {
  return (
    <div
      className={'flex w-full cursor-pointer flex-row items-center border-[1px] border-b border-border p-4'}
      onClick={() => onSelect(option)}
    >
      <Icon type={option.icon} size={'large'} />
      <div className={'ml-3 text-base'}>{option.label}</div>
    </div>
  )
}
