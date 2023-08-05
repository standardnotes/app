import { observer } from 'mobx-react-lite'
import { User as UserType } from '@standardnotes/snjs'
import { useApplication } from '../ApplicationProvider'

const User = () => {
  const application = useApplication()

  const { server } = application.accountMenuController
  const user = application.sessions.getUser() as UserType

  return (
    <div className="sk-panel-section">
      {application.syncStatusController.errorMessage && (
        <div className="sk-notification danger">
          <div className="sk-notification-title">Sync Unreachable</div>
          <div className="sk-notification-text">
            Hmm...we can't seem to sync your account. The reason: {application.syncStatusController.errorMessage}
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
