import { HistoryEntry, NoteHistoryEntry } from '@standardnotes/snjs';
import { Fragment, FunctionComponent } from 'preact';
import {
  StateUpdater,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'preact/hooks';
import { RevisionListTabType } from './HistoryListContainer';
import { HistoryListItem } from './HistoryListItem';
import { ListGroup } from './utils';

type Props = {
  sessionHistory: ListGroup<NoteHistoryEntry>[];
  setSelectedRevision: StateUpdater<HistoryEntry | undefined>;
  selectedTab: RevisionListTabType;
};

export const SessionHistoryList: FunctionComponent<Props> = ({
  sessionHistory,
  setSelectedRevision,
  selectedTab,
}) => {
  const sessionHistoryLength = useMemo(
    () => sessionHistory.map((group) => group.entries).flat().length,
    [sessionHistory]
  );

  const [selectedItemCreatedAt, setSelectedItemCreatedAt] = useState<Date>();

  const firstEntry = useMemo(() => {
    return sessionHistory?.find((group) => group.entries?.length)?.entries?.[0];
  }, [sessionHistory]);

  const selectFirstEntry = useCallback(() => {
    if (firstEntry) {
      setSelectedItemCreatedAt(firstEntry.payload.created_at);
      setSelectedRevision(firstEntry);
    }
  }, [firstEntry, setSelectedRevision]);

  useEffect(() => {
    if (firstEntry && !selectedItemCreatedAt) {
      selectFirstEntry();
    } else if (!firstEntry) {
      setSelectedRevision(undefined);
    }
  }, [
    firstEntry,
    selectFirstEntry,
    selectedItemCreatedAt,
    sessionHistory,
    setSelectedRevision,
  ]);

  useEffect(() => {
    if (selectedTab === RevisionListTabType.Session) {
      selectFirstEntry();
    }
  }, [selectFirstEntry, selectedTab]);

  return (
    <div
      className={`flex flex-col w-full h-full ${
        !sessionHistoryLength ? 'items-center justify-center' : ''
      }`}
    >
      {sessionHistory?.map((group) =>
        group.entries && group.entries.length ? (
          <Fragment key={group.title}>
            <div className="px-3 my-1 font-semibold color-text uppercase color-grey-0">
              {group.title}
            </div>
            {group.entries.map((entry, index) => (
              <HistoryListItem
                key={index}
                isSelected={selectedItemCreatedAt === entry.payload.created_at}
                label={entry.previewTitle()}
                onClick={() => {
                  setSelectedItemCreatedAt(entry.payload.created_at);
                  setSelectedRevision(entry);
                }}
              />
            ))}
          </Fragment>
        ) : null
      )}
      {!sessionHistoryLength && (
        <div className="color-grey-0 select-none">No session history found</div>
      )}
    </div>
  );
};
