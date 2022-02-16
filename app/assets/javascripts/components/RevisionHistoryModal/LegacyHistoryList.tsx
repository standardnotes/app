import { HistoryEntry, RevisionListEntry } from '@standardnotes/snjs';
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
import { RevisionListTabType } from './HistoryListContainer';
import { HistoryListItem } from './HistoryListItem';
import {
  LegacyHistoryEntry,
  ListGroup,
  previewHistoryEntryTitle,
} from './utils';

type Props = {
  selectedTab: RevisionListTabType;
  legacyHistory: ListGroup<LegacyHistoryEntry>[] | undefined;
  setSelectedRevision: StateUpdater<
    HistoryEntry | LegacyHistoryEntry | undefined
  >;
  setSelectedRemoteEntry: StateUpdater<RevisionListEntry | undefined>;
};

export const LegacyHistoryList: FunctionComponent<Props> = ({
  legacyHistory,
  selectedTab,
  setSelectedRevision,
  setSelectedRemoteEntry,
}) => {
  const legacyHistoryListRef = useRef<HTMLDivElement>(null);

  useListKeyboardNavigation(legacyHistoryListRef);

  const legacyHistoryLength = useMemo(
    () => legacyHistory?.map((group) => group.entries).flat().length,
    [legacyHistory]
  );

  const [selectedItemCreatedAt, setSelectedItemCreatedAt] = useState<Date>();

  const firstEntry = useMemo(() => {
    return legacyHistory?.find((group) => group.entries?.length)?.entries?.[0];
  }, [legacyHistory]);

  const selectFirstEntry = useCallback(() => {
    if (firstEntry) {
      setSelectedItemCreatedAt(firstEntry.payload?.created_at);
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

  useEffect(() => {
    if (selectedTab === RevisionListTabType.Session) {
      selectFirstEntry();
      legacyHistoryListRef.current?.focus();
    }
  }, [selectFirstEntry, selectedTab]);

  return (
    <div
      className={`flex flex-col w-full h-full focus:shadow-none ${
        !legacyHistoryLength ? 'items-center justify-center' : ''
      }`}
      ref={legacyHistoryListRef}
    >
      {legacyHistory?.map((group) =>
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
                {previewHistoryEntryTitle(entry)}
              </HistoryListItem>
            ))}
          </Fragment>
        ) : null
      )}
      {!legacyHistoryLength && (
        <div className="color-grey-0 select-none">No legacy history found</div>
      )}
    </div>
  );
};
