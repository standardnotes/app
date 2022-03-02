import {
  HistoryEntry,
  NoteHistoryEntry,
  RevisionListEntry,
} from '@standardnotes/snjs';
import { Fragment, FunctionComponent } from 'preact';
import {
  StateUpdater,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import { useListKeyboardNavigation } from '../utils';
import { HistoryListItem } from './HistoryListItem';
import { LegacyHistoryEntry, ListGroup } from './utils';

type Props = {
  sessionHistory: ListGroup<NoteHistoryEntry>[];
  setSelectedRevision: StateUpdater<
    HistoryEntry | LegacyHistoryEntry | undefined
  >;
  setSelectedRemoteEntry: StateUpdater<RevisionListEntry | undefined>;
};

export const SessionHistoryList: FunctionComponent<Props> = ({
  sessionHistory,
  setSelectedRevision,
  setSelectedRemoteEntry,
}) => {
  const sessionHistoryListRef = useRef<HTMLDivElement>(null);

  useListKeyboardNavigation(sessionHistoryListRef);

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
    setSelectedRevision,
  ]);

  return (
    <div
      className={`flex flex-col w-full h-full focus:shadow-none ${
        !sessionHistoryLength ? 'items-center justify-center' : ''
      }`}
      ref={sessionHistoryListRef}
    >
      {sessionHistory?.map((group) =>
        group.entries && group.entries.length ? (
          <Fragment key={group.title}>
            <div className="px-3 mt-2.5 mb-1 font-semibold color-text uppercase color-grey-0 select-none">
              {group.title}
            </div>
            {group.entries.map((entry, index) => (
              <HistoryListItem
                key={index}
                isSelected={selectedItemCreatedAt === entry.payload.created_at}
                onClick={() => {
                  setSelectedItemCreatedAt(entry.payload.created_at);
                  setSelectedRevision(entry);
                  setSelectedRemoteEntry(undefined);
                }}
              >
                {entry.previewTitle()}
              </HistoryListItem>
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
