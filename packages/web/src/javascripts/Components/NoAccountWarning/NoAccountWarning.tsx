import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { NoAccountWarningController } from '@/Controllers/NoAccountWarningController'
import { observer } from 'mobx-react-lite'
import NoAccountWarningContent from './NoAccountWarningContent'

type Props = {
  accountMenuController: AccountMenuController
  noAccountWarningController: NoAccountWarningController
}

const NoAccountWarning = ({ accountMenuController, noAccountWarningController }: Props) => {
  const canShow = noAccountWarningController.show

  return canShow ? (
    <NoAccountWarningContent
      accountMenuController={accountMenuController}
      noAccountWarningController={noAccountWarningController}
    />
  ) : null
}

export default observer(NoAccountWarning)
