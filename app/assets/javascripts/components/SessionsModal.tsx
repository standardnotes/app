import { AppState } from '@/ui_models/app_state';
import {
  SNApplication,
  SessionStrings,
  UuidString,
  isNullOrUndefined,
  RemoteSession,
} from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { Dialog } from '@reach/dialog';
import { Alert } from '@reach/alert';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogLabel,
} from '@reach/alert-dialog';
import { toDirective } from './utils';
import { WebApplication } from '@/ui_models/application';
import { observer } from 'mobx-react-lite';

type Session = RemoteSession & {
  revoking?: true;
};

function useSessions(
  application: SNApplication
): [
  Session[],
  () => void,
  boolean,
  (uuid: UuidString) => Promise<void>,
  string
] {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [lastRefreshDate, setLastRefreshDate] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    (async () => {
      setRefreshing(true);
      const response = await application.getSessions();
      if ('error' in response || !response.data) {
        if (response.error?.message) {
          setErrorMessage(response.error.message);
        } else {
          setErrorMessage('An unknown error occured while loading sessions.');
        }
      } else {
        const sessions = response.data;
        setSessions(sessions);
        setErrorMessage('');
      }
      setRefreshing(false);
    })();
  }, [application, lastRefreshDate]);

  function refresh() {
    setLastRefreshDate(Date.now());
  }

  async function revokeSession(uuid: UuidString) {
    const sessionsBeforeRevoke = sessions;

    const responsePromise = application.revokeSession(uuid);

    const sessionsDuringRevoke = sessions.slice();
    const toRemoveIndex = sessions.findIndex(
      (session) => session.uuid === uuid
    );
    sessionsDuringRevoke[toRemoveIndex] = {
      ...sessionsDuringRevoke[toRemoveIndex],
      revoking: true,
    };
    setSessions(sessionsDuringRevoke);

    const response = await responsePromise;
    if (isNullOrUndefined(response)) {
      setSessions(sessionsBeforeRevoke);
    } else if ('error' in response) {
      if (response.error?.message) {
        setErrorMessage(response.error?.message);
      } else {
        setErrorMessage('An unknown error occured while revoking the session.');
      }
      setSessions(sessionsBeforeRevoke);
    } else {
      setSessions(sessions.filter((session) => session.uuid !== uuid));
    }
  }

  return [sessions, refresh, refreshing, revokeSession, errorMessage];
}

const SessionsModal: FunctionComponent<{
  appState: AppState;
  application: SNApplication;
}> = ({ appState, application }) => {
  const close = () => appState.closeSessionsModal();

  const [
    sessions,
    refresh,
    refreshing,
    revokeSession,
    errorMessage,
  ] = useSessions(application);

  const [confirmRevokingSessionUuid, setRevokingSessionUuid] = useState('');
  const closeRevokeSessionAlert = () => setRevokingSessionUuid('');
  const cancelRevokeRef = useRef<HTMLButtonElement>();

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric',
      }),
    []
  );

  return (
    <>
      <Dialog onDismiss={close} className="sessions-modal h-screen py-8">
        <div className="sk-modal-content">
          <div class="sn-component">
            <div class="sk-panel">
              <div class="sk-panel-header">
                <div class="sk-panel-header-title">Active Sessions</div>
                <div className="buttons">
                  <button
                    class="sk-a close-button info"
                    disabled={refreshing}
                    onClick={refresh}
                  >
                    Refresh
                  </button>
                  <button class="sk-a close-button info" onClick={close}>
                    Close
                  </button>
                </div>
              </div>
              <div class="sk-panel-content overflow-y-scroll">
                {refreshing ? (
                  <>
                    <div class="sk-spinner small info"></div>
                    <h2 className="sk-p sessions-modal-refreshing">
                      Loading sessions
                    </h2>
                  </>
                ) : (
                  <>
                    {errorMessage && (
                      <Alert className="sk-p bold">{errorMessage}</Alert>
                    )}
                    {sessions.length > 0 && (
                      <ul>
                        {sessions.map((session) => (
                          <li>
                            <h2>{session.device_info}</h2>
                            {session.current ? (
                              <span className="info bold">Current session</span>
                            ) : (
                              <>
                                <p>
                                  Signed in on{' '}
                                  {formatter.format(session.updated_at)}
                                </p>
                                <button
                                  className="sn-button small danger sk-label"
                                  disabled={session.revoking}
                                  onClick={() =>
                                    setRevokingSessionUuid(session.uuid)
                                  }
                                >
                                  <span>Revoke</span>
                                </button>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Dialog>
      {confirmRevokingSessionUuid && (
        <AlertDialog
          onDismiss={() => {
            setRevokingSessionUuid('');
          }}
          leastDestructiveRef={cancelRevokeRef}
        >
          <div className="sk-modal-content">
            <div className="sn-component">
              <div className="sk-panel">
                <div className="sk-panel-content">
                  <div className="sk-panel-section">
                    <AlertDialogLabel className="sk-h3 sk-panel-section-title">
                      {SessionStrings.RevokeTitle}
                    </AlertDialogLabel>
                    <AlertDialogDescription className="sk-panel-row">
                      <p>{SessionStrings.RevokeText}</p>
                    </AlertDialogDescription>
                    <div className="flex my-1 gap-2">
                      <button
                        className="sn-button small neutral sk-label"
                        ref={cancelRevokeRef}
                        onClick={closeRevokeSessionAlert}
                      >
                        <span>{SessionStrings.RevokeCancelButton}</span>
                      </button>
                      <button
                        className="sn-button small danger sk-label"
                        onClick={() => {
                          closeRevokeSessionAlert();
                          revokeSession(confirmRevokingSessionUuid);
                        }}
                      >
                        <span>{SessionStrings.RevokeConfirmButton}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AlertDialog>
      )}
    </>
  );
};

const Sessions: FunctionComponent<{
  appState: AppState;
  application: WebApplication;
}> = observer(({ appState, application }) => {
  if (appState.isSessionsModalVisible) {
    return <SessionsModal application={application} appState={appState} />;
  } else {
    return null;
  }
});

export const SessionsModalDirective = toDirective(Sessions);
