import { RevisionListEntry } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { Fragment, FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { RevisionListTabType } from './HistoryListContainer';
import { HistoryListItem } from './HistoryListItem';
import { RemoteRevisionListGroup } from './utils';

const previewRemoteHistoryTitle = (revision: RevisionListEntry) => {
  return new Date(revision.created_at).toLocaleString();
};

type RemoteHistoryListProps = {
  remoteHistory: RemoteRevisionListGroup[] | undefined;
  isFetchingRemoteHistory: boolean;
  fetchAndSetRemoteRevision: (
    revisionListEntry: RevisionListEntry,
    isInitialSetting?: boolean
  ) => Promise<void>;
  selectedTab: RevisionListTabType;
};

export const RemoteHistoryList: FunctionComponent<RemoteHistoryListProps> =
  observer(
    ({
      remoteHistory,
      isFetchingRemoteHistory,
      fetchAndSetRemoteRevision,
      selectedTab,
    }) => {
      const [selectedEntryUuid, setSelectedEntryUuid] = useState('');

      const selectFirstEntry = useCallback(
        (isInitialSetting = false) => {
          const firstEntry = remoteHistory?.[0].entries?.[0];
          if (firstEntry) {
            setSelectedEntryUuid(firstEntry.uuid);
            fetchAndSetRemoteRevision(firstEntry, isInitialSetting);
          }
        },
        [fetchAndSetRemoteRevision, remoteHistory]
      );

      useEffect(() => {
        if (remoteHistory?.[0].entries?.[0] && !selectedEntryUuid.length) {
          selectFirstEntry(true);
        }
      }, [
        fetchAndSetRemoteRevision,
        remoteHistory,
        selectFirstEntry,
        selectedEntryUuid.length,
      ]);

      useEffect(() => {
        if (selectedTab === RevisionListTabType.Remote) {
          selectFirstEntry();
        }
      }, [selectFirstEntry, selectedTab]);

      return (
        <div
          className={`flex flex-col w-full h-full ${
            isFetchingRemoteHistory && 'items-center justify-center'
          }`}
        >
          {isFetchingRemoteHistory && (
            <div className="sk-spinner w-5 h-5 spinner-info"></div>
          )}
          {remoteHistory?.map((group) =>
            group.entries && group.entries.length ? (
              <Fragment key={group.title}>
                <div className="px-3 my-1 font-semibold color-text uppercase">
                  {group.title}
                </div>
                {group.entries.map((entry) => (
                  <HistoryListItem
                    key={entry.uuid}
                    isSelected={selectedEntryUuid === entry.uuid}
                    label={previewRemoteHistoryTitle(entry)}
                    onClick={() => {
                      setSelectedEntryUuid(entry.uuid);
                      fetchAndSetRemoteRevision(entry);
                    }}
                  />
                ))}
              </Fragment>
            ) : null
          )}
        </div>
      );
    }
  );
