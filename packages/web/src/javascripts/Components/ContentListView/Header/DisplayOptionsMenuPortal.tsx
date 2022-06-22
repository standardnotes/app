import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { DisplayOptionsMenuPositionProps, DisplayOptionsMenuProps } from './DisplayOptionsMenuProps'
import DisplayOptionsMenu from './DisplayOptionsMenu'

type Props = DisplayOptionsMenuProps & DisplayOptionsMenuPositionProps

const PositionedOptionsMenu = styled.div<DisplayOptionsMenuPositionProps>`
  position: absolute;
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;
  z-index: var(--z-index-dropdown-menu);
`

const DisplayOptionsMenuPortal = ({
  application,
  closeDisplayOptionsMenu,
  closeOnBlur,
  isFilesSmartView,
  isOpen,
  top,
  left,
}: Props) => {
  return createPortal(
    <PositionedOptionsMenu top={top} left={left}>
      <div className="sn-component">
        <DisplayOptionsMenu
          application={application}
          closeDisplayOptionsMenu={closeDisplayOptionsMenu}
          closeOnBlur={closeOnBlur}
          isFilesSmartView={isFilesSmartView}
          isOpen={isOpen}
        />
      </div>
    </PositionedOptionsMenu>,
    document.body,
  )
}

export default DisplayOptionsMenuPortal
