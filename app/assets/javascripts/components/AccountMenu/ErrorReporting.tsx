import { useState } from 'preact/hooks';
import { storage, StorageKey } from '@Services/localStorage';
import { disableErrorReporting, enableErrorReporting, errorReportingId } from '@Services/errorReporting';
import { alertDialog } from '@Services/alertService';
import { observer } from 'mobx-react-lite';
import { AppState } from '@/ui_models/app_state';

type Props = {
  appState: AppState;
}

const ErrorReporting = observer(({ appState }: Props) => {
  const [isErrorReportingEnabled] = useState(() => storage.get(StorageKey.DisableErrorReporting) === false);
  const [errorReportingIdValue] = useState(() => errorReportingId());

  const toggleErrorReportingEnabled = () => {
    if (isErrorReportingEnabled) {
      disableErrorReporting();
    } else {
      enableErrorReporting();
    }
    if (!appState.sync.inProgress) {
      window.location.reload();
    }
  };

  const openErrorReportingDialog = () => {
    alertDialog({
      title: 'Data sent during automatic error reporting',
      text: `
        We use <a target="_blank" rel="noreferrer" href="https://www.bugsnag.com/">Bugsnag</a>
        to automatically report errors that occur while the app is running. See
        <a target="_blank" rel="noreferrer" href="https://docs.bugsnag.com/platforms/javascript/#sending-diagnostic-data">
          this article, paragraph 'Browser' under 'Sending diagnostic data',
        </a>
        to see what data is included in error reports.
        <br><br>
        Error reports never include IP addresses and are fully
        anonymized. We use error reports to be alerted when something in our
        code is causing unexpected errors and crashes in your application
        experience.
      `
    });
  };

  return (
    <div className="sk-panel-section">
      <div className="sk-panel-section-title">Error Reporting</div>
      <div className="sk-panel-section-subtitle info">
        Automatic error reporting is {isErrorReportingEnabled ? 'enabled' : 'disabled'}
      </div>
      <p className="sk-p">
        Help us improve Standard Notes by automatically submitting
        anonymized error reports.
      </p>
      {errorReportingIdValue && (
        <>
          <p className="sk-p selectable">
            Your random identifier is <span className="font-bold">{errorReportingIdValue}</span>
          </p>
          <p className="sk-p">
            Disabling error reporting will remove that identifier from your
            local storage, and a new identifier will be created should you
            decide to enable error reporting again in the future.
          </p>
        </>
      )}
      <div className="sk-panel-row">
        <button className="sn-button small info" onClick={toggleErrorReportingEnabled}>
          {isErrorReportingEnabled ? 'Disable' : 'Enable'} Error Reporting
        </button>
      </div>
      <div className="sk-panel-row">
        <a className="sk-a" onClick={openErrorReportingDialog}>What data is being sent?</a>
      </div>
    </div>
  );
});

export default ErrorReporting;
