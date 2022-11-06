import { WebApplication } from '@/Application/Application'
import { ComponentArea } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'
import { BlockMenuOption } from './BlockMenuOption'
import { BlockOption } from './BlockOption'
import { BlockquoteBlockOption, componentToBlockOption, PlaintextBlockOption } from './BlockOptionFactory'

type BlockMenuProps = {
  application: WebApplication
  onSelectOption: (row: BlockOption) => void
}

export const BlockMenu: FunctionComponent<BlockMenuProps> = ({ application, onSelectOption }) => {
  const components = application.componentManager.componentsForArea(ComponentArea.Editor)
  const options = [
    PlaintextBlockOption,
    BlockquoteBlockOption,
    ...components.map((component) => componentToBlockOption(component, application.iconsController)),
  ]

  return (
    <div className="flex flex-row flex-wrap">
      {options.map((option) => {
        return <BlockMenuOption option={option} key={option.identifier} onSelect={onSelectOption} />
      })}
    </div>
  )
}
