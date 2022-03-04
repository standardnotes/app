import { WebApplication } from '@/ui_models/application';
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
import { Icon } from '../Icon';
import { useListKeyboardNavigation } from '../utils';
import { HistoryListItem } from './HistoryListItem';
import { previewHistoryEntryTitle, RemoteRevisionListGroup } from './utils';

type RemoteHistoryListProps = {
  application: WebApplication;
  remoteHistory: RemoteRevisionListGroup[] | undefined;
  isFetchingRemoteHistory: boolean;
  fetchAndSetRemoteRevision: (
    revisionListEntry: RevisionListEntry
  ) => Promise<void>;
};

export const RemoteHistoryList: FunctionComponent<RemoteHistoryListProps> =
  observer(
    ({
      application,
      remoteHistory,
      isFetchingRemoteHistory,
      fetchAndSetRemoteRevision,
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
                <div className="px-3 mt-2.5 mb-1 font-semibold color-text uppercase color-grey-0 select-none">
                  {group.title}
                </div>
                {group.entries.map((entry) => (
                  <HistoryListItem
                    key={entry.uuid}
                    isSelected={selectedEntryUuid === entry.uuid}
                    onClick={() => {
                      setSelectedEntryUuid(entry.uuid);
                      fetchAndSetRemoteRevision(entry);
                    }}
                  >
                    <div className="flex flex-grow items-center justify-between">
                      <div>{previewHistoryEntryTitle(entry)}</div>
                      {!application.features.hasMinimumRole(
                        entry.required_role
                      ) && <Icon type="premium-feature" />}
                    </div>
                  </HistoryListItem>
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
