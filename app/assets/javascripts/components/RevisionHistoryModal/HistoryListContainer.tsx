import { WebApplication } from '@/ui_models/application';
import {
  HistoryEntry,
  NoteHistoryEntry,
  RevisionListEntry,
  SNNote,
} from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { StateUpdater, useCallback, useMemo, useState } from 'preact/hooks';
import { useEffect } from 'react';
import { LegacyHistoryList } from './LegacyHistoryList';
import { RemoteHistoryList } from './RemoteHistoryList';
import { SessionHistoryList } from './SessionHistoryList';
import {
  LegacyHistoryEntry,
  ListGroup,
  RemoteRevisionListGroup,
  sortRevisionListIntoGroups,
} from './utils';

export enum RevisionListTabType {
  Session = 'Session',
  Remote = 'Remote',
  Legacy = 'Legacy',
}

type Props = {
  application: WebApplication;
  isFetchingRemoteHistory: boolean;
  note: SNNote;
  remoteHistory: RemoteRevisionListGroup[] | undefined;
  setIsFetchingSelectedRevision: StateUpdater<boolean>;
  setSelectedRemoteEntry: StateUpdater<RevisionListEntry | undefined>;
  setSelectedRevision: StateUpdater<
    HistoryEntry | LegacyHistoryEntry | undefined
  >;
  setShowContentLockedScreen: StateUpdater<boolean>;
};

export const HistoryListContainer: FunctionComponent<Props> = observer(
  ({
    application,
    isFetchingRemoteHistory,
    note,
    remoteHistory,
    setIsFetchingSelectedRevision,
    setSelectedRemoteEntry,
    setSelectedRevision,
    setShowContentLockedScreen,
  }) => {
    const sessionHistory = sortRevisionListIntoGroups<NoteHistoryEntry>(
      application.historyManager.sessionHistoryForItem(
        note
      ) as NoteHistoryEntry[]
    );
    const [isFetchingLegacyHistory, setIsFetchingLegacyHistory] =
      useState(false);
    const [legacyHistory, setLegacyHistory] =
      useState<ListGroup<LegacyHistoryEntry>[]>();
    const legacyHistoryLength = useMemo(
      () => legacyHistory?.map((group) => group.entries).flat().length ?? 0,
      [legacyHistory]
    );

    const [selectedTab, setSelectedTab] = useState<RevisionListTabType>(
      RevisionListTabType.Remote
    );

    useEffect(() => {
      const fetchLegacyHistory = async () => {
        const actionExtensions = application.actionsManager.getExtensions();
        actionExtensions.forEach(async (ext) => {
          const actionExtension =
            await application.actionsManager.loadExtensionInContextOfItem(
              ext,
              note
            );

          if (!actionExtension) {
            return;
          }

          const isLegacyNoteHistoryExt = actionExtension?.actions.some(
            (action) => action.verb === 'nested'
          );

          if (!isLegacyNoteHistoryExt) {
            return;
          }

          const legacyHistory = [] as LegacyHistoryEntry[];

          setIsFetchingLegacyHistory(true);

          await Promise.all(
            actionExtension?.actions.map(async (action) => {
              if (!action.subactions?.[0]) {
                return;
              }

              const response = await application.actionsManager.runAction(
                action.subactions[0],
                note
              );

              if (!response) {
                return;
              }

              legacyHistory.push(response.item as LegacyHistoryEntry);
            })
          );

          setIsFetchingLegacyHistory(false);

          setLegacyHistory(
            sortRevisionListIntoGroups<LegacyHistoryEntry>(legacyHistory)
          );
        });
      };

      fetchLegacyHistory();
    }, [application.actionsManager, note]);

    const TabButton: FunctionComponent<{
      type: RevisionListTabType;
    }> = ({ type }) => {
      const isSelected = selectedTab === type;

      return (
        <button
          className={`bg-default border-0 cursor-pointer px-3 py-2.5 relative focus:shadow-inner ${
            isSelected ? 'color-info font-medium shadow-bottom' : 'color-text'
          }`}
          onClick={() => {
            setSelectedTab(type);
            setSelectedRemoteEntry(undefined);
          }}
        >
          {type}
        </button>
      );
    };

    const fetchAndSetRemoteRevision = useCallback(
      async (revisionListEntry: RevisionListEntry) => {
        setShowContentLockedScreen(false);

        if (application.hasRole(revisionListEntry.required_role)) {
          setIsFetchingSelectedRevision(true);
          setSelectedRevision(undefined);
          setSelectedRemoteEntry(undefined);

          try {
            const remoteRevision =
              await application.historyManager.fetchRemoteRevision(
                note.uuid,
                revisionListEntry
              );
            setSelectedRevision(remoteRevision);
            setSelectedRemoteEntry(revisionListEntry);
          } catch (err) {
            console.error(err);
          } finally {
            setIsFetchingSelectedRevision(false);
          }
        } else {
          setShowContentLockedScreen(true);
          setSelectedRevision(undefined);
        }
      },
      [
        application,
        note.uuid,
        setIsFetchingSelectedRevision,
        setSelectedRemoteEntry,
        setSelectedRevision,
        setShowContentLockedScreen,
      ]
    );

    return (
      <div
        className={`flex flex-col min-w-60 border-0 border-r-1px border-solid border-main overflow-auto h-full`}
      >
        <div className="flex border-0 border-b-1 border-solid border-main">
          <TabButton type={RevisionListTabType.Remote} />
          <TabButton type={RevisionListTabType.Session} />
          {isFetchingLegacyHistory && (
            <div className="flex items-center justify-center px-3 py-2.5">
              <div className="sk-spinner w-3 h-3 spinner-info" />
            </div>
          )}
          {legacyHistory && legacyHistoryLength > 0 && (
            <TabButton type={RevisionListTabType.Legacy} />
          )}
        </div>
        <div className={`min-h-0 overflow-auto py-1.5 h-full`}>
          {selectedTab === RevisionListTabType.Session && (
            <SessionHistoryList
              selectedTab={selectedTab}
              sessionHistory={sessionHistory}
              setSelectedRevision={setSelectedRevision}
              setSelectedRemoteEntry={setSelectedRemoteEntry}
            />
          )}
          {selectedTab === RevisionListTabType.Remote && (
            <RemoteHistoryList
              application={application}
              remoteHistory={remoteHistory}
              isFetchingRemoteHistory={isFetchingRemoteHistory}
              fetchAndSetRemoteRevision={fetchAndSetRemoteRevision}
              selectedTab={selectedTab}
            />
          )}
          {selectedTab === RevisionListTabType.Legacy && (
            <LegacyHistoryList
              selectedTab={selectedTab}
              legacyHistory={legacyHistory}
              setSelectedRevision={setSelectedRevision}
              setSelectedRemoteEntry={setSelectedRemoteEntry}
            />
          )}
        </div>
      </div>
    );
  }
);
