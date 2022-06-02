import { observer } from 'mobx-react-lite'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { WebApplication } from '@/Application/Application'
import { User as UserType } from '@standardnotes/snjs'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
}

const User = ({ viewControllerManager, application }: Props) => {
  const { server } = viewControllerManager.accountMenuController
  const user = application.getUser() as UserType

  return (
    <div className="sk-panel-section">
      {viewControllerManager.syncStatusController.errorMessage && (
        <div className="sk-notification danger">
          <div className="sk-notification-title">Sync Unreachable</div>
          <div className="sk-notification-text">
            Hmm...we can't seem to sync your account. The reason:{' '}
            {viewControllerManager.syncStatusController.errorMessage}
          </div>
          <a
            className="sk-a info-contrast sk-bold sk-panel-row"
            href="https://standardnotes.com/help"
            rel="noopener"
            target="_blank"
          >
            Need help?
          </a>
        </div>
      )}
      <div className="sk-panel-row">
        <div className="sk-panel-column">
          <div className="sk-h1 sk-bold wrap">{user.email}</div>
          <div className="sk-subtitle neutral">{server}</div>
        </div>
      </div>
      <div className="sk-panel-row" />
    </div>
  )
}

export default observer(User)
