import {
  CSSProperties,
  FunctionComponent,
  KeyboardEventHandler,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { KeyboardKey } from '@/Services/IOService'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'

type MenuProps = {
  className?: string
  style?: CSSProperties | undefined
  a11yLabel: string
  children: ReactNode
  closeMenu?: () => void
  isOpen: boolean
  initialFocus?: number
}

const Menu: FunctionComponent<MenuProps> = ({
  children,
  className = '',
  style,
  a11yLabel,
  closeMenu,
  isOpen,
  initialFocus,
}: MenuProps) => {
  const menuElementRef = useRef<HTMLMenuElement>(null)

  const handleKeyDown: KeyboardEventHandler<HTMLMenuElement> = useCallback(
    (event) => {
      if (event.key === KeyboardKey.Escape) {
        closeMenu?.()
        return
      }
    },
    [closeMenu],
  )

  useListKeyboardNavigation(menuElementRef, initialFocus)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        menuElementRef.current?.focus()
      })
    }
  }, [isOpen])

  return (
    <menu
      className={`m-0 list-none pl-0 focus:shadow-none ${className}`}
      onKeyDown={handleKeyDown}
      ref={menuElementRef}
      style={style}
      aria-label={a11yLabel}
    >
      {children}
    </menu>
  )
}

export default Menu
