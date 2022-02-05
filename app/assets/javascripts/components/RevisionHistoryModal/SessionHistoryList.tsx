import { HistoryEntry, NoteHistoryEntry } from '@standardnotes/snjs';
import { Fragment, FunctionComponent } from 'preact';
import { StateUpdater, useCallback, useEffect, useState } from 'preact/hooks';
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
  const [selectedItemCreatedAt, setSelectedItemCreatedAt] = useState<Date>();

  const selectFirstEntry = useCallback(() => {
    const firstEntry = sessionHistory?.[0].entries?.[0];
    if (firstEntry) {
      setSelectedItemCreatedAt(firstEntry.payload.created_at);
      setSelectedRevision(firstEntry);
    }
  }, [sessionHistory, setSelectedRevision]);

  useEffect(() => {
    if (sessionHistory?.[0].entries?.[0] && !selectedItemCreatedAt) {
      selectFirstEntry();
    }
  }, [
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
    <div className={`flex flex-col w-full h-full`}>
      {sessionHistory?.map((group) =>
        group.entries && group.entries.length ? (
          <Fragment key={group.title}>
            <div className="px-3 my-1 font-semibold color-text uppercase">
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
    </div>
  );
};
