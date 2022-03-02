import { Action, HistoryEntry, RevisionListEntry } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
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
import { LegacyHistoryEntry } from './utils';

type Props = {
  legacyHistory: Action[] | undefined;
  setSelectedRevision: StateUpdater<
    HistoryEntry | LegacyHistoryEntry | undefined
  >;
  setSelectedRemoteEntry: StateUpdater<RevisionListEntry | undefined>;
  fetchAndSetLegacyRevision: (revisionListEntry: Action) => Promise<void>;
};

export const LegacyHistoryList: FunctionComponent<Props> = ({
  legacyHistory,
  setSelectedRevision,
  setSelectedRemoteEntry,
  fetchAndSetLegacyRevision,
}) => {
  const legacyHistoryListRef = useRef<HTMLDivElement>(null);

  useListKeyboardNavigation(legacyHistoryListRef);

  const [selectedItemUrl, setSelectedItemUrl] = useState<string>();

  const firstEntry = useMemo(() => {
    return legacyHistory?.[0];
  }, [legacyHistory]);

  const selectFirstEntry = useCallback(() => {
    if (firstEntry) {
      setSelectedItemUrl(firstEntry.subactions?.[0].url);
      setSelectedRevision(undefined);
      fetchAndSetLegacyRevision(firstEntry);
    }
  }, [fetchAndSetLegacyRevision, firstEntry, setSelectedRevision]);

  useEffect(() => {
    if (firstEntry && !selectedItemUrl) {
      selectFirstEntry();
    } else if (!firstEntry) {
      setSelectedRevision(undefined);
    }
  }, [firstEntry, selectFirstEntry, selectedItemUrl, setSelectedRevision]);

  return (
    <div
      className={`flex flex-col w-full h-full focus:shadow-none ${
        !legacyHistory?.length ? 'items-center justify-center' : ''
      }`}
      ref={legacyHistoryListRef}
    >
      {legacyHistory?.map((entry) => {
        const url = entry.subactions?.[0].url;

        return (
          <HistoryListItem
            key={url}
            isSelected={selectedItemUrl === url}
            onClick={() => {
              setSelectedItemUrl(url);
              setSelectedRemoteEntry(undefined);
              fetchAndSetLegacyRevision(entry);
            }}
          >
            {entry.label}
          </HistoryListItem>
        );
      })}
      {!legacyHistory?.length && (
        <div className="color-grey-0 select-none">No legacy history found</div>
      )}
    </div>
  );
};
