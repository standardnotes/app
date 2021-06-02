import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { toDirective, useCloseOnClickOutside } from './utils';
import { AutocompleteTagInput } from './AutocompleteTagInput';
import { WebApplication } from '@/ui_models/application';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { SNTag } from '@standardnotes/snjs';
import { NoteTag } from './NoteTag';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const NoteTagsContainer = observer(({ application, appState }: Props) => {
  const {
    inputOverflowed,
    overflowedTagsCount,
    tags,
    tagsContainerMaxWidth,
    tagsContainerExpanded,
    tagsOverflowed,
  } = appState.activeNote;

  const [expandedContainerHeight, setExpandedContainerHeight] = useState(0);
  const [lastVisibleTagIndex, setLastVisibleTagIndex] =
    useState<number | null>(null);
  const [overflowCountPosition, setOverflowCountPosition] = useState(0);

  const containerRef = useRef<HTMLDivElement>();
  const tagsContainerRef = useRef<HTMLDivElement>();
  const tagsRef = useRef<HTMLButtonElement[]>([]);

  tagsRef.current = [];

  useCloseOnClickOutside(tagsContainerRef, (expanded: boolean) => {
    if (tagsContainerExpanded) {
      appState.activeNote.setTagsContainerExpanded(expanded);
    }
  });

  const isTagOverflowed = useCallback(
    (tagElement?: HTMLButtonElement): boolean | undefined => {
      if (!tagElement) {
        return;
      }
      if (tagsContainerExpanded) {
        return false;
      }
      const firstTagTop = tagsRef.current[0].offsetTop;
      return tagElement.offsetTop > firstTagTop;
    },
    [tagsContainerExpanded]
  );

  const reloadLastVisibleTagIndex = useCallback(() => {
    if (tagsContainerExpanded) {
      return tags.length - 1;
    }
    const firstOverflowedTagIndex = tagsRef.current.findIndex((tagElement) =>
      isTagOverflowed(tagElement)
    );
    if (firstOverflowedTagIndex > -1) {
      setLastVisibleTagIndex(firstOverflowedTagIndex - 1);
    } else {
      setLastVisibleTagIndex(null);
    }
  }, [isTagOverflowed, tags, tagsContainerExpanded]);

  const reloadExpandedContainersHeight = useCallback(() => {
    setExpandedContainerHeight(tagsContainerRef.current.scrollHeight);
  }, []);

  const reloadOverflowCount = useCallback(() => {
    const count = tagsRef.current.filter((tagElement) =>
      isTagOverflowed(tagElement)
    ).length;
    appState.activeNote.setOverflowedTagsCount(count);
  }, [appState.activeNote, isTagOverflowed]);

  const reloadOverflowCountPosition = useCallback(() => {
    if (tagsContainerExpanded || !lastVisibleTagIndex) {
      return;
    }
    if (tagsRef.current[lastVisibleTagIndex]) {
      const {
        offsetLeft: lastVisibleTagLeft,
        clientWidth: lastVisibleTagWidth,
      } = tagsRef.current[lastVisibleTagIndex];
      setOverflowCountPosition(lastVisibleTagLeft + lastVisibleTagWidth);
    }
  }, [lastVisibleTagIndex, tagsContainerExpanded]);

  const expandTags = () => {
    appState.activeNote.setTagsContainerExpanded(true);
  };

  const reloadTagsContainerLayout = useCallback(() => {
    appState.activeNote.reloadTagsContainerLayout();
    reloadLastVisibleTagIndex();
    reloadExpandedContainersHeight();
    reloadOverflowCount();
    reloadOverflowCountPosition();
  }, [
    appState.activeNote,
    reloadLastVisibleTagIndex,
    reloadExpandedContainersHeight,
    reloadOverflowCount,
    reloadOverflowCountPosition,
  ]);

  useEffect(() => {
    reloadTagsContainerLayout();
  }, [reloadTagsContainerLayout, tags, tagsContainerMaxWidth]);

  useEffect(() => {
    let tagResizeObserver: ResizeObserver;
    if (ResizeObserver) {
      tagResizeObserver = new ResizeObserver(() => {
        reloadTagsContainerLayout();
      });
      tagsRef.current.forEach((tagElement) =>
        tagResizeObserver.observe(tagElement)
      );
    }

    return () => {
      if (tagResizeObserver) {
        tagResizeObserver.disconnect();
      }
    };
  }, [reloadTagsContainerLayout]);

  return (
    <div
      className={`flex transition-height duration-150 relative ${
        inputOverflowed ? 'h-18' : 'h-9'
      }`}
      ref={containerRef}
      style={tagsContainerExpanded ? { height: expandedContainerHeight } : {}}
    >
      <div
        ref={tagsContainerRef}
        className={`absolute bg-default flex flex-wrap pl-1 -ml-1 ${
          inputOverflowed ? 'h-18' : 'h-9'
        } ${tagsContainerExpanded || !tagsOverflowed ? '' : 'overflow-hidden'}`}
        style={{
          maxWidth: tagsContainerMaxWidth,
        }}
      >
        {tags.map((tag: SNTag, index: number) => (
          <NoteTag
            appState={appState}
            tagsRef={tagsRef}
            index={index}
            tag={tag}
            maxWidth={tagsContainerMaxWidth}
            overflowed={
              !tagsContainerExpanded &&
              !!lastVisibleTagIndex &&
              index > lastVisibleTagIndex
            }
          />
        ))}
        <AutocompleteTagInput
          application={application}
          appState={appState}
          tagsRef={tagsRef}
        />
      </div>
      {tagsOverflowed && (
        <button
          type="button"
          className="sn-tag ml-1 px-2 absolute"
          onClick={expandTags}
          style={{ left: overflowCountPosition }}
        >
          +{overflowedTagsCount}
        </button>
      )}
    </div>
  );
});

export const NoteTagsContainerDirective = toDirective<Props>(NoteTagsContainer);
