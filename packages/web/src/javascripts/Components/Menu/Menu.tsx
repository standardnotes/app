import {
  ComponentPropsWithoutRef,
  forwardRef,
  KeyboardEventHandler,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react'
import { KeyboardKey } from '@standardnotes/ui-services'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import { mergeRefs } from '@/Hooks/mergeRefs'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'

interface MenuProps extends ComponentPropsWithoutRef<'menu'> {
  a11yLabel: string
  closeMenu?: () => void
  initialFocus?: number
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
      ...props
    }: MenuProps,
    forwardedRef,
  ) => {
    const [menuElement, setMenuElement] = useState<HTMLMenuElement | null>(null)

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

    const { setInitialFocus } = useListKeyboardNavigation(menuElement, {
      initialFocus,
      shouldAutoFocus: isMobileScreen ? false : shouldAutoFocus,
    })

    useImperativeHandle(forwardedRef, () => ({
      focus: () => {
        setInitialFocus()
      },
    }))

    return (
      <menu
        className={`m-0 list-none px-4 focus:shadow-none md:px-0 ${className}`}
        onKeyDown={handleKeyDown}
        ref={mergeRefs([setMenuElement, forwardedRef])}
        style={style}
        aria-label={a11yLabel}
        {...props}
      >
        {children}
      </menu>
    )
  },
)

export default Menu
