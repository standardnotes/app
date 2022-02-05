import { WebApplication } from '@/ui_models/application';
import {
  HistoryEntry,
  NoteHistoryEntry,
  RevisionListEntry,
  SNNote,
} from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import {
  StateUpdater,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'preact/hooks';
import { RemoteHistoryList } from './RemoteHistoryList';
import { SessionHistoryList } from './SessionHistoryList';
import { RemoteRevisionListGroup, sortRevisionListIntoGroups } from './utils';

type Props = {
  application: WebApplication;
  note: SNNote;
  setSelectedRevision: StateUpdater<HistoryEntry | undefined>;
  setIsFetchingSelectedRevision: StateUpdater<boolean>;
};

export enum RevisionListTabType {
  Session = 'Session',
  Remote = 'Remote',
}

export const HistoryListContainer: FunctionComponent<Props> = observer(
  ({
    application,
    note,
    setSelectedRevision,
    setIsFetchingSelectedRevision,
  }) => {
    const sessionHistory = sortRevisionListIntoGroups<NoteHistoryEntry>(
      application.historyManager.sessionHistoryForItem(
        note
      ) as NoteHistoryEntry[]
    );
    const [isFetchingRemoteHistory, setIsFetchingRemoteHistory] =
      useState(false);
    const [remoteHistory, setRemoteHistory] =
      useState<RemoteRevisionListGroup[]>();

    const sessionHistoryLength = useMemo(
      () => sessionHistory.map((group) => group.entries).flat().length,
      [sessionHistory]
    );

    const remoteHistoryLength = useMemo(
      () => remoteHistory?.map((group) => group.entries).flat().length,
      [remoteHistory]
    );

    const [selectedTab, setSelectedTab] = useState<RevisionListTabType>(
      RevisionListTabType.Session
    );

    useEffect(() => {
      if (
        !sessionHistoryLength &&
        selectedTab === RevisionListTabType.Session
      ) {
        setSelectedTab(RevisionListTabType.Remote);
      }
    }, [selectedTab, sessionHistoryLength]);

    const TabButton: FunctionComponent<{
      type: RevisionListTabType;
      disabled: boolean;
    }> = ({ type, disabled }) => {
      const isSelected = selectedTab === type;

      return (
        <button
          className={`bg-default border-0 cursor-pointer px-3 py-2.5 relative ${
            isSelected ? 'color-info font-medium' : ''
          }`}
          onClick={() => setSelectedTab(type)}
          disabled={disabled}
        >
          {type}
        </button>
      );
    };

    const fetchAndSetRemoteRevision = useCallback(
      async (
        revisionListEntry: RevisionListEntry,
        isInitialSetting = false
      ) => {
        if (isInitialSetting && selectedTab === RevisionListTabType.Session) {
          return;
        }
        setIsFetchingSelectedRevision(true);
        try {
          const remoteRevision =
            await application.historyManager.fetchRemoteRevision(
              note.uuid,
              revisionListEntry
            );
          setSelectedRevision(remoteRevision);
        } catch (err) {
          console.error(err);
        } finally {
          setIsFetchingSelectedRevision(false);
        }
      },
      [
        application.historyManager,
        note.uuid,
        selectedTab,
        setIsFetchingSelectedRevision,
        setSelectedRevision,
      ]
    );

    useEffect(() => {
      const fetchRemoteHistory = async () => {
        if (note && !remoteHistory?.length) {
          setIsFetchingRemoteHistory(true);
          try {
            const initialRemoteHistory =
              await application.historyManager.remoteHistoryForItem(note);

            const remoteHistoryAsGroups =
              sortRevisionListIntoGroups<RevisionListEntry>(
                initialRemoteHistory
              );

            setRemoteHistory(remoteHistoryAsGroups);
          } catch (err) {
            console.error(err);
          } finally {
            setIsFetchingRemoteHistory(false);
          }
        }
      };

      fetchRemoteHistory();
    }, [
      application.historyManager,
      fetchAndSetRemoteRevision,
      note,
      remoteHistory?.length,
    ]);

    return (
      <div
        className={`flex flex-col min-w-60 border-0 border-r-1px border-solid border-main overflow-auto h-full`}
      >
        <div className="flex border-0 border-b-1 border-solid border-main">
          <TabButton
            disabled={!sessionHistoryLength}
            type={RevisionListTabType.Session}
          />
          <TabButton
            disabled={!remoteHistoryLength}
            type={RevisionListTabType.Remote}
          />
        </div>
        <div className={`min-h-0 overflow-auto py-1.5 h-full`}>
          <div
            className={
              selectedTab !== RevisionListTabType.Session ? 'hidden' : ''
            }
          >
            <SessionHistoryList
              sessionHistory={sessionHistory}
              setSelectedRevision={setSelectedRevision}
              selectedTab={selectedTab}
            />
          </div>
          <div
            className={
              selectedTab !== RevisionListTabType.Remote ? 'hidden' : 'h-full'
            }
          >
            <RemoteHistoryList
              remoteHistory={remoteHistory}
              isFetchingRemoteHistory={isFetchingRemoteHistory}
              fetchAndSetRemoteRevision={fetchAndSetRemoteRevision}
              selectedTab={selectedTab}
            />
          </div>
        </div>
      </div>
    );
  }
);
