import { RevisionListEntry } from '@standardnotes/snjs';
import { Fragment, FunctionComponent } from 'preact';
import { StateUpdater } from 'preact/hooks';
import { HistoryListItem } from './HistoryListItem';
import { RemoteRevisionListGroup } from './utils';

const previewRemoteHistoryTitle = (revision: RevisionListEntry) => {
  return new Date(revision.created_at).toLocaleString();
};

type RemoteHistoryListProps = {
  isFetchingRemoteHistory: boolean;
  remoteHistory: RemoteRevisionListGroup[] | undefined;
  selectedEntryUuid: string;
  setSelectedEntryUuid: StateUpdater<string>;
  fetchAndSetRemoteRevision: (
    revisionListEntry: RevisionListEntry
  ) => Promise<void>;
};

export const RemoteHistoryList: FunctionComponent<RemoteHistoryListProps> = ({
  isFetchingRemoteHistory,
  remoteHistory,
  selectedEntryUuid,
  setSelectedEntryUuid,
  fetchAndSetRemoteRevision,
}) => {
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
};
