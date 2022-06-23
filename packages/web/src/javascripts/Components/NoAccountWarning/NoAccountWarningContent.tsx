import Icon from '@/Components/Icon/Icon'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { NoAccountWarningController } from '@/Controllers/NoAccountWarningController'
import { observer } from 'mobx-react-lite'
import { MouseEventHandler, useCallback } from 'react'

type Props = {
  accountMenuController: AccountMenuController
  noAccountWarningController: NoAccountWarningController
}

const NoAccountWarningContent = ({ accountMenuController, noAccountWarningController }: Props) => {
  const showAccountMenu: MouseEventHandler = useCallback(
    (event) => {
      event.stopPropagation()
      accountMenuController.setShow(true)
    },
    [accountMenuController],
  )

  const hideWarning = useCallback(() => {
    noAccountWarningController.hide()
  }, [noAccountWarningController])

  return (
    <div className="mt-4 p-4 rounded-md shadow-sm grid grid-template-cols-1fr">
      <h1 className="sk-h3 m-0 font-semibold">Data not backed up</h1>
      <p className="m-0 mt-1 col-start-1 col-end-3">Sign in or register to back up your notes.</p>
      <button className="sn-button small info mt-3 col-start-1 col-end-3 justify-self-start" onClick={showAccountMenu}>
        Open Account menu
      </button>
      <button
        onClick={hideWarning}
        title="Ignore warning"
        aria-label="Ignore warning"
        style={{ height: '20px' }}
        className="border-0 m-0 p-0 bg-transparent cursor-pointer rounded-md col-start-2 row-start-1 text-neutral hover:text-info"
      >
        <Icon type="close" className="block" />
      </button>
    </div>
  )
}

export default observer(NoAccountWarningContent)
