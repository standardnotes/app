import { WebApplication } from '@/Application/Application'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { FunctionComponent, useCallback, useState } from 'react'
import Icon from '../../Icon/Icon'
import { BlockMenu } from './BlockMenu'
import { BlockOption } from './BlockOption'

type AddButtonProps = {
  application: WebApplication
  onSelectOption: (option: BlockOption) => void
}

export const AddBlockButton: FunctionComponent<AddButtonProps> = ({ application, onSelectOption }) => {
  const [showMenu, setShowMenu] = useState(false)

  const toggleMenu = useCallback(() => {
    setShowMenu((prevValue) => !prevValue)
  }, [])

  const handleSelection = useCallback(
    (option: BlockOption) => {
      onSelectOption(option)
      setShowMenu(false)
    },
    [onSelectOption],
  )

  return (
    <div className="mt-2 flex flex-row flex-wrap">
      <button
        className={classNames(
          'fixed bottom-6 right-6 z-editor-title-bar ml-3 flex h-15 w-15 cursor-pointer items-center',
          `justify-center rounded-full border border-solid border-transparent ${'bg-info text-info-contrast'}`,
          'hover:brightness-125 md:static md:h-8 md:w-8',
        )}
        onClick={toggleMenu}
      >
        <Icon type="add" size="custom" className="h-8 w-8 md:h-5 md:w-5" />
      </button>

      {showMenu && <BlockMenu application={application} onSelectOption={handleSelection} />}
    </div>
  )
}
