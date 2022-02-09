import { RevisionListEntry } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { Fragment, FunctionComponent } from 'preact';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import { useListKeyboardNavigation } from '../utils';
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
    revisionListEntry: RevisionListEntry
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
      const remoteHistoryListRef = useRef<HTMLDivElement>(null);

      useListKeyboardNavigation(remoteHistoryListRef);

      const remoteHistoryLength = useMemo(
        () => remoteHistory?.map((group) => group.entries).flat().length,
        [remoteHistory]
      );

      const [selectedEntryUuid, setSelectedEntryUuid] = useState('');

      const firstEntry = useMemo(() => {
        return remoteHistory?.find((group) => group.entries?.length)
          ?.entries?.[0];
      }, [remoteHistory]);

      const selectFirstEntry = useCallback(() => {
        if (firstEntry) {
          setSelectedEntryUuid(firstEntry.uuid);
          fetchAndSetRemoteRevision(firstEntry);
        }
      }, [fetchAndSetRemoteRevision, firstEntry]);

      useEffect(() => {
        if (firstEntry && !selectedEntryUuid.length) {
          selectFirstEntry();
        }
      }, [
        fetchAndSetRemoteRevision,
        firstEntry,
        remoteHistory,
        selectFirstEntry,
        selectedEntryUuid.length,
      ]);

      useEffect(() => {
        if (selectedTab === RevisionListTabType.Remote) {
          selectFirstEntry();
          remoteHistoryListRef.current?.focus();
        }
      }, [selectFirstEntry, selectedTab]);

      return (
        <div
          className={`flex flex-col w-full h-full focus:shadow-none ${
            isFetchingRemoteHistory || !remoteHistoryLength
              ? 'items-center justify-center'
              : ''
          }`}
          ref={remoteHistoryListRef}
        >
          {isFetchingRemoteHistory && (
            <div className="sk-spinner w-5 h-5 spinner-info"></div>
          )}
          {remoteHistory?.map((group) =>
            group.entries && group.entries.length ? (
              <Fragment key={group.title}>
                <div className="px-3 my-1 font-semibold color-text uppercase color-grey-0">
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
          {!remoteHistoryLength && !isFetchingRemoteHistory && (
            <div className="color-grey-0 select-none">
              No remote history found
            </div>
          )}
        </div>
      );
    }
  );
