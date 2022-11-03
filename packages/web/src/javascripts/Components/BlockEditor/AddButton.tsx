import { WebApplication } from '@/Application/Application'
import { ComponentArea, SNComponent } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'

type AddButtonProps = {
  application: WebApplication
  onSelectEditor: (editor: SNComponent) => void
}

export const AddBlockButton: FunctionComponent<AddButtonProps> = ({ application, onSelectEditor }) => {
  const components = application.componentManager.componentsForArea(ComponentArea.Editor)

  return (
    <div className="mt-2 flex flex-row flex-wrap">
      {components.map((component) => {
        return (
          <div className="m-3 border-2" key={component.uuid} onClick={() => onSelectEditor(component)}>
            {component.name}
          </div>
        )
      })}
    </div>
  )
}
