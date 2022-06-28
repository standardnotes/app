import Icon from '@/Components/Icon/Icon'
import MenuItem from '@/Components/Menu/MenuItem'
import { MenuItemType } from '@/Components/Menu/MenuItemType'
import { KeyboardKey } from '@/Services/IOService'
import { ApplicationDescriptor } from '@standardnotes/snjs'
import {
  ChangeEventHandler,
  FocusEventHandler,
  FunctionComponent,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

type Props = {
  descriptor: ApplicationDescriptor
  onClick: () => void
  onDelete: () => void
  renameDescriptor: (label: string) => void
  hideOptions: boolean
}

const WorkspaceMenuItem: FunctionComponent<Props> = ({
  descriptor,
  onClick,
  onDelete,
  renameDescriptor,
  hideOptions,
}) => {
  const [isRenaming, setIsRenaming] = useState(false)
  const [inputValue, setInputValue] = useState(descriptor.label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus()
    }
  }, [isRenaming])

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    setInputValue(event.target.value)
  }, [])

  const handleInputKeyDown: KeyboardEventHandler = useCallback((event) => {
    if (event.key === KeyboardKey.Enter) {
      inputRef.current?.blur()
    }
  }, [])

  const handleInputBlur: FocusEventHandler<HTMLInputElement> = useCallback(() => {
    renameDescriptor(inputValue)
    setIsRenaming(false)
    setInputValue('')
  }, [inputValue, renameDescriptor])

  return (
    <MenuItem
      type={MenuItemType.RadioButton}
      className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-2 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
      onClick={onClick}
      checked={descriptor.primary}
    >
      <div className="ml-2 flex w-full items-center justify-between">
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
          />
        ) : (
          <div>{descriptor.label}</div>
        )}
        {descriptor.primary && !hideOptions && (
          <div className="flex items-center">
            <a
              role="button"
              className="mr-3 h-5 w-5 cursor-pointer border-0 bg-transparent p-0 hover:bg-contrast"
              onClick={(e) => {
                e.stopPropagation()
                setIsRenaming((isRenaming) => !isRenaming)
              }}
            >
              <Icon type="pencil" className="text-neutral" size="medium" />
            </a>
            <a
              role="button"
              className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0 hover:bg-contrast"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Icon type="trash" className="text-danger" size="medium" />
            </a>
          </div>
        )}
      </div>
    </MenuItem>
  )
}

export default WorkspaceMenuItem
