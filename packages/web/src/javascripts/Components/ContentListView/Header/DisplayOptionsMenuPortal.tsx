import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { DisplayOptionsMenuPositionProps, DisplayOptionsMenuProps } from './DisplayOptionsMenuProps'
import DisplayOptionsMenu from './DisplayOptionsMenu'
import { useRef, useEffect, RefObject } from 'react'

type Props = DisplayOptionsMenuProps &
  DisplayOptionsMenuPositionProps & {
    containerRef: RefObject<HTMLDivElement>
  }

const PositionedOptionsMenu = styled.div<DisplayOptionsMenuPositionProps>`
  position: absolute;
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;
  z-index: var(--z-index-dropdown-menu);
`

const DisplayOptionsMenuPortal = ({
  application,
  closeDisplayOptionsMenu,
  containerRef,
  isFilesSmartView,
  isOpen,
  top,
  left,
}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeIfClickedOutside = (event: MouseEvent) => {
      const isDescendantOfMenu = menuRef.current?.contains(event.target as Node)
      const isDescendantOfContainer = containerRef.current?.contains(event.target as Node)

      if (!isDescendantOfMenu && !isDescendantOfContainer) {
        closeDisplayOptionsMenu()
      }
    }

    document.addEventListener('click', closeIfClickedOutside, { capture: true })
    return () => {
      document.removeEventListener('click', closeIfClickedOutside, {
        capture: true,
      })
    }
  }, [closeDisplayOptionsMenu, containerRef])

  return createPortal(
    <PositionedOptionsMenu top={top} left={left} ref={menuRef}>
      <div className="sn-component">
        <DisplayOptionsMenu
          application={application}
          closeDisplayOptionsMenu={closeDisplayOptionsMenu}
          isFilesSmartView={isFilesSmartView}
          isOpen={isOpen}
        />
      </div>
    </PositionedOptionsMenu>,
    document.body,
  )
}

export default DisplayOptionsMenuPortal
