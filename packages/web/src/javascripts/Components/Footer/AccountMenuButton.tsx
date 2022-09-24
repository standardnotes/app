import { classNames } from '@/Utils/ConcatenateClassNames'
import { useRef } from 'react'
import AccountMenu, { AccountMenuProps } from '../AccountMenu/AccountMenu'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'
import StyledTooltip from '../StyledTooltip/StyledTooltip'

type Props = AccountMenuProps & {
  isOpen: boolean
  hasError: boolean
  toggleMenu: () => void
  user: unknown
}

const AccountMenuButton = ({
  application,
  hasError,
  isOpen,
  mainApplicationGroup,
  onClickOutside,
  toggleMenu,
  user,
  viewControllerManager,
}: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <StyledTooltip label="Open account menu">
        <button
          ref={buttonRef}
          onClick={toggleMenu}
          className={classNames(
            isOpen ? 'bg-border' : '',
            'flex h-full w-8 cursor-pointer items-center justify-center rounded-full',
          )}
        >
          <div className={hasError ? 'text-danger' : user ? 'text-info' : 'text-neutral'}>
            <Icon type="account-circle" className="h-5 w-5 hover:text-info" />
          </div>
        </button>
      </StyledTooltip>
      <Popover anchorElement={buttonRef.current} open={isOpen} togglePopover={toggleMenu} side="top" className="py-2">
        <AccountMenu
          onClickOutside={onClickOutside}
          viewControllerManager={viewControllerManager}
          application={application}
          mainApplicationGroup={mainApplicationGroup}
        />
      </Popover>
    </>
  )
}

export default AccountMenuButton
