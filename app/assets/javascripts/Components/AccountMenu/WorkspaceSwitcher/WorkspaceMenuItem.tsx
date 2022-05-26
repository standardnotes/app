import Icon from '@/Components/Icon/Icon'
import MenuItem from '@/Components/Menu/MenuItem'
import { MenuItemType } from '@/Components/Menu/MenuItemType'
import { KeyboardKey } from '@/Services/IOService'
import { ApplicationDescriptor } from '@standardnotes/snjs'
import {
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus()
    }
  }, [isRenaming])

  const handleInputKeyDown: KeyboardEventHandler = useCallback((event) => {
    if (event.key === KeyboardKey.Enter) {
      inputRef.current?.blur()
    }
  }, [])

  const handleInputBlur: FocusEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const name = event.target.value
      renameDescriptor(name)
      setIsRenaming(false)
    },
    [renameDescriptor],
  )

  return (
    <MenuItem
      type={MenuItemType.RadioButton}
      className="sn-dropdown-item py-2 focus:bg-info-backdrop focus:shadow-none"
      onClick={onClick}
      checked={descriptor.primary}
    >
      <div className="flex items-center justify-between w-full ml-2">
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={descriptor.label}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
          />
        ) : (
          <div>{descriptor.label}</div>
        )}
        {descriptor.primary && !hideOptions && (
          <div>
            <a
              role="button"
              className="w-5 h-5 p-0 mr-3 border-0 bg-transparent hover:bg-contrast cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setIsRenaming((isRenaming) => !isRenaming)
              }}
            >
              <Icon type="pencil" className="sn-icon--mid color-neutral" />
            </a>
            <a
              role="button"
              className="w-5 h-5 p-0 border-0 bg-transparent hover:bg-contrast cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Icon type="trash" className="sn-icon--mid color-danger" />
            </a>
          </div>
        )}
      </div>
    </MenuItem>
  )
}

export default WorkspaceMenuItem
