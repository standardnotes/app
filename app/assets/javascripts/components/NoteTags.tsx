import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { toDirective, useCloseOnClickOutside } from './utils';
import { Icon } from './Icon';
import { AutocompleteTagInput } from './AutocompleteTagInput';
import { WebApplication } from '@/ui_models/application';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { SNTag } from '@standardnotes/snjs';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const TAGS_ROW_HEIGHT = 36;
const MIN_OVERFLOW_TOP = 76;
const TAG_RIGHT_MARGIN = 8;

const NoteTags = observer(({ application, appState }: Props) => {
  const {
    overflowedTagsCount,
    tags,
    tagsContainerPosition,
    tagsContainerMaxWidth,
    tagsContainerExpanded,
    tagsOverflowed,
  } = appState.activeNote;

  const [containerHeight, setContainerHeight] =
    useState(TAGS_ROW_HEIGHT);
  const [overflowCountPosition, setOverflowCountPosition] = useState(0);

  const containerRef = useRef<HTMLDivElement>();
  const tagsContainerRef = useRef<HTMLDivElement>();
  const tagsRef = useRef<HTMLButtonElement[]>([]);
  const overflowButtonRef = useRef<HTMLButtonElement>();
  tagsRef.current = [];

  useCloseOnClickOutside(tagsContainerRef, (expanded: boolean) => {
    if (overflowButtonRef.current || tagsContainerExpanded) {
      appState.activeNote.setTagsContainerExpanded(expanded);
    }
  });

  const onTagBackspacePress = async (tag: SNTag) => {
    await appState.activeNote.removeTagFromActiveNote(tag);

    if (tagsRef.current.length > 1) {
      tagsRef.current[tagsRef.current.length - 1].focus();
    }
  };

  const onTagClick = (clickedTag: SNTag) => {
    const tagIndex = tags.findIndex(tag => tag.uuid === clickedTag.uuid);
    if (tagsRef.current[tagIndex] === document.activeElement) {
      appState.setSelectedTag(clickedTag);
    }
  };

  const isTagOverflowed = useCallback(
    (tagElement?: HTMLButtonElement): boolean | undefined => {
      if (!tagElement) {
        return;
      }
      if (tagsContainerExpanded) {
        return false;
      }
      return tagElement.getBoundingClientRect().top >= MIN_OVERFLOW_TOP;
    },
    [tagsContainerExpanded]
  );

  const reloadOverflowCountPosition = useCallback(() => {
    const firstOverflowedTagIndex = tagsRef.current.findIndex((tagElement) =>
      isTagOverflowed(tagElement)
    );
    if (tagsContainerExpanded || firstOverflowedTagIndex < 1) {
      return;
    }
    const previousTagRect =
      tagsRef.current[firstOverflowedTagIndex - 1].getBoundingClientRect();
    const position =
      previousTagRect.right - (tagsContainerPosition ?? 0) + TAG_RIGHT_MARGIN;
    setOverflowCountPosition(position);
  }, [isTagOverflowed, tagsContainerExpanded, tagsContainerPosition]);

  const reloadContainersHeight = useCallback(() => {
    const containerHeight = tagsContainerExpanded
      ? tagsContainerRef.current.scrollHeight
      : TAGS_ROW_HEIGHT;
    setContainerHeight(containerHeight);
  }, [tagsContainerExpanded]);

  const reloadOverflowCount = useCallback(() => {
    const count = tagsRef.current.filter((tagElement) =>
      isTagOverflowed(tagElement)
    ).length;
    appState.activeNote.setOverflowedTagsCount(count);
  }, [appState.activeNote, isTagOverflowed]);

  const expandTags = () => {
    appState.activeNote.setTagsContainerExpanded(true);
  };

  useEffect(() => {
    appState.activeNote.reloadTagsContainerLayout();
    reloadOverflowCountPosition();
    reloadContainersHeight();
    reloadOverflowCount();
  }, [
    appState.activeNote,
    reloadOverflowCountPosition,
    reloadContainersHeight,
    reloadOverflowCount,
    tags,
  ]);

  const tagClass = `h-6 bg-contrast border-0 rounded text-xs color-text py-1 pr-2 flex items-center 
    mt-2 cursor-pointer hover:bg-secondary-contrast focus:bg-secondary-contrast`;

  return (
    <div
      className="flex transition-height duration-150"
      ref={containerRef}
      style={{ height: containerHeight }}
    >
      <div
        ref={tagsContainerRef}
        className={`absolute flex flex-wrap pl-1 -ml-1 ${
          tagsContainerExpanded ? '' : 'overflow-hidden'
        }`}
        style={{
          maxWidth: tagsContainerMaxWidth,
          height: TAGS_ROW_HEIGHT,
        }}
      >
        {tags.map((tag: SNTag, index: number) => (
          <button
            className={`${tagClass} pl-1 mr-2 transition-opacity duration-150 ${
              isTagOverflowed(tagsRef.current[index])
                ? 'opacity-0'
                : 'opacity-1'
            }`}
            style={{ maxWidth: tagsContainerMaxWidth }}
            ref={(element) => {
              if (element) {
                tagsRef.current[index] = element;
              }
            }}
            onClick={() => onTagClick(tag)}
            onKeyUp={(event) => {
              if (event.key === 'Backspace') {
                onTagBackspacePress(tag);
              }
            }}
            tabIndex={isTagOverflowed(tagsRef.current[index]) ? -1 : 0}
          >
            <Icon
              type="hashtag"
              className="sn-icon--small color-neutral mr-1"
            />
            <span className="whitespace-nowrap overflow-hidden overflow-ellipsis">
              {tag.title}
            </span>
          </button>
        ))}
        <AutocompleteTagInput
          application={application}
          appState={appState}
          tagsRef={tagsRef}
          tabIndex={tagsOverflowed ? -1 : 0}
        />
      </div>
      {tagsOverflowed && (
        <button
          ref={overflowButtonRef}
          type="button"
          className={`${tagClass} pl-2 absolute`}
          style={{ left: overflowCountPosition }}
          onClick={expandTags}
        >
          +{overflowedTagsCount}
        </button>
      )}
    </div>
  );
});

export const NoteTagsDirective = toDirective<Props>(NoteTags);
