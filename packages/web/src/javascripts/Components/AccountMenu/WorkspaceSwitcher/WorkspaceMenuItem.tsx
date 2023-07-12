import Icon from '@/Components/Icon/Icon'
import { KeyboardKey } from '@standardnotes/ui-services'
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
import MenuRadioButtonItem from '@/Components/Menu/MenuRadioButtonItem'

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
  const itemRef = useRef<HTMLButtonElement>(null)
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
    if (event.key === KeyboardKey.Enter || event.key === KeyboardKey.Escape) {
      event.preventDefault()
      event.stopPropagation()
      itemRef.current?.focus()
    }
  }, [])

  const handleInputBlur: FocusEventHandler<HTMLInputElement> = useCallback(() => {
    renameDescriptor(inputValue)
    setIsRenaming(false)
  }, [inputValue, renameDescriptor])

  return (
    <div className="relative">
      <MenuRadioButtonItem ref={itemRef} className="overflow-hidden" onClick={onClick} checked={descriptor.primary}>
        <div className="ml-2 flex w-full items-center justify-between gap-3 overflow-hidden">
          {!isRenaming && <div className="overflow-hidden text-ellipsis">{descriptor.label}</div>}
          {descriptor.primary && !hideOptions && (
            <div className="flex items-center gap-3">
              <a
                role="button"
                className="flex h-5 w-5 cursor-pointer items-center justify-center border-0 bg-transparent p-0 hover:bg-contrast"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsRenaming((isRenaming) => !isRenaming)
                }}
              >
                <Icon type="pencil" className="text-neutral" size="medium" />
              </a>
              <a
                role="button"
                className="flex h-5 w-5 cursor-pointer items-center justify-center border-0 bg-transparent p-0 hover:bg-contrast"
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
      </MenuRadioButtonItem>
      {isRenaming && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-11 top-1/2 -translate-y-1/2 bg-default"
        />
      )}
    </div>
  )
}

export default WorkspaceMenuItem
