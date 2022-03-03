import { observer } from 'mobx-react-lite';
import { AppState } from '@/ui_models/app_state';
import { WebApplication } from '@/ui_models/application';
import { User } from '@standardnotes/responses';

type Props = {
  appState: AppState;
  application: WebApplication;
};

const User = observer(({ appState, application }: Props) => {
  const { server } = appState.accountMenu;
  const user = application.getUser();

  return (
    <div className="sk-panel-section">
      {appState.sync.errorMessage && (
        <div className="sk-notification danger">
          <div className="sk-notification-title">Sync Unreachable</div>
          <div className="sk-notification-text">
            Hmm...we can't seem to sync your account. The reason:{' '}
            {appState.sync.errorMessage}
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
          <div className="sk-h1 sk-bold wrap">{(user as User).email}</div>
          <div className="sk-subtitle neutral">{server}</div>
        </div>
      </div>
      <div className="sk-panel-row" />
    </div>
  );
});

export default User;
