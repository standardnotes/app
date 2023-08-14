import { classNames } from '@standardnotes/utils'
import { useRef } from 'react'
import AccountMenu, { AccountMenuProps } from '../AccountMenu/AccountMenu'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'
import StyledTooltip from '../StyledTooltip/StyledTooltip'
import { observer } from 'mobx-react-lite'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'

type Props = AccountMenuProps & {
  controller: AccountMenuController
  hasError: boolean
  toggleMenu: () => void
  user: unknown
}

const AccountMenuButton = ({ hasError, controller, mainApplicationGroup, onClickOutside, toggleMenu, user }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { show: isOpen } = controller

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
      <Popover
        title="Account"
        anchorElement={buttonRef}
        open={isOpen}
        togglePopover={toggleMenu}
        side="top"
        align="start"
        className="py-2"
      >
        <AccountMenu onClickOutside={onClickOutside} mainApplicationGroup={mainApplicationGroup} />
      </Popover>
    </>
  )
}

export default observer(AccountMenuButton)
