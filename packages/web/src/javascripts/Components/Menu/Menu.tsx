import {
  CSSProperties,
  forwardRef,
  KeyboardEventHandler,
  ReactNode,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react'
import { KeyboardKey } from '@standardnotes/ui-services'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import { mergeRefs } from '@/Hooks/mergeRefs'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'

type MenuProps = {
  className?: string
  style?: CSSProperties | undefined
  a11yLabel: string
  children: ReactNode
  closeMenu?: () => void
  isOpen: boolean
  initialFocus?: number
  onKeyDown?: KeyboardEventHandler<HTMLMenuElement>
  shouldAutoFocus?: boolean
}

const Menu = forwardRef(
  (
    {
      children,
      className = '',
      style,
      a11yLabel,
      closeMenu,
      initialFocus,
      onKeyDown,
      shouldAutoFocus = true,
    }: MenuProps,
    forwardedRef,
  ) => {
    const menuElementRef = useRef<HTMLMenuElement>(null)

    const handleKeyDown: KeyboardEventHandler<HTMLMenuElement> = useCallback(
      (event) => {
        onKeyDown?.(event)

        if (event.key === KeyboardKey.Escape) {
          closeMenu?.()
          return
        }
      },
      [closeMenu, onKeyDown],
    )

    const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

    const { setInitialFocus } = useListKeyboardNavigation(
      menuElementRef,
      initialFocus,
      isMobileScreen ? false : shouldAutoFocus,
    )

    useImperativeHandle(forwardedRef, () => ({
      focus: () => {
        setInitialFocus()
      },
    }))

    return (
      <menu
        className={`m-0 list-none pl-0 focus:shadow-none ${className}`}
        onKeyDown={handleKeyDown}
        ref={mergeRefs([menuElementRef, forwardedRef])}
        style={style}
        aria-label={a11yLabel}
      >
        {children}
      </menu>
    )
  },
)

export default Menu
