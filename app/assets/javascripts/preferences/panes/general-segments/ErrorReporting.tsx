import { useState } from 'preact/hooks';
import { storage, StorageKey } from '@Services/localStorage';
import { disableErrorReporting, enableErrorReporting, errorReportingId } from '@Services/errorReporting';
import { alertDialog } from '@Services/alertService';
import { observer } from 'mobx-react-lite';
import { AppState } from '@/ui_models/app_state';
import { FunctionComponent } from 'preact';
import { PreferencesGroup, PreferencesSegment, Title, Text } from '@/preferences/components';
import { Switch } from '@/components/Switch';

type Props = {
  appState: AppState;
}

export const ErrorReporting: FunctionComponent<Props> = observer(({ appState }: Props) => {
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
    <PreferencesGroup>
      <PreferencesSegment>

        <div className="flex flex-row items-center">
          <div className="flex-grow flex flex-col">
            <Title>Error Reporting</Title>
            <Text>
              Help us improve Standard Notes by automatically submitting
              anonymized error reports.
            </Text>
          </div>
          <div className="flex flex-col justify-center items-center min-w-15">
            <Switch onChange={toggleErrorReportingEnabled} checked={isErrorReportingEnabled} />
          </div>
        </div>
        <div className="min-h-2" />

        {errorReportingIdValue && (
          <>
            <Text>
              Your random identifier is <span className="font-bold">{errorReportingIdValue}</span>
            </Text>
            <Text>
              Disabling error reporting will remove that identifier from your
              local storage, and a new identifier will be created should you
              decide to enable error reporting again in the future.
            </Text>
          </>
        )}

        <Text>
          <a className="cursor-pointer" onClick={openErrorReportingDialog}>What data is being sent?</a>
        </Text>
      </PreferencesSegment>
    </PreferencesGroup>
  );
});
