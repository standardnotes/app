import { classNames } from '@/Utils/ConcatenateClassNames'
import { useRef } from 'react'
import AccountMenu, { AccountMenuProps } from '../AccountMenu/AccountMenu'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'

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
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={classNames(
          isOpen ? 'bg-border' : '',
          'flex h-full w-8 cursor-pointer items-center justify-center rounded-full',
        )}
      >
        <div className={hasError ? 'text-danger' : (user ? 'text-info' : 'text-neutral') + ' h-5 w-5'}>
          <Icon type="account-circle" className="max-h-5 hover:text-info" />
        </div>
      </button>
      <Popover buttonRef={buttonRef} open={isOpen} togglePopover={toggleMenu} side="top">
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
