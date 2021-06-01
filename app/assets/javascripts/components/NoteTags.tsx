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

const NoteTags = observer(({ application, appState }: Props) => {
  const {
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
  const overflowButtonRef = useRef<HTMLButtonElement>();

  tagsRef.current = [];

  useCloseOnClickOutside(tagsContainerRef, (expanded: boolean) => {
    if (overflowButtonRef.current || tagsContainerExpanded) {
      appState.activeNote.setTagsContainerExpanded(expanded);
    }
  });

  const onTagBackspacePress = async (tag: SNTag, index: number) => {
    await appState.activeNote.removeTagFromActiveNote(tag);

    if (index > 0) {
      tagsRef.current[index - 1].focus();
    }
  };

  const onTagClick = (clickedTag: SNTag) => {
    const tagIndex = tags.findIndex((tag) => tag.uuid === clickedTag.uuid);
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
    const { offsetLeft: lastVisibleTagLeft, clientWidth: lastVisibleTagWidth } =
      tagsRef.current[lastVisibleTagIndex];
    setOverflowCountPosition(lastVisibleTagLeft + lastVisibleTagWidth);
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
  }, [
    reloadTagsContainerLayout,
    tags,
    tagsContainerMaxWidth,
  ]);

  useEffect(() => {
    let tagResizeObserver: ResizeObserver;
    if (ResizeObserver) {
      tagResizeObserver = new ResizeObserver(() => {
        reloadTagsContainerLayout();
      });
      tagsRef.current.forEach((tagElement) => tagResizeObserver.observe(tagElement));
    }

    return () => {
      if (tagResizeObserver) {
        tagResizeObserver.disconnect();
      }
    };
  }, [reloadTagsContainerLayout]);

  const tagClass = `h-6 bg-contrast border-0 rounded text-xs color-text py-1 pr-2 flex items-center 
    mt-2 cursor-pointer hover:bg-secondary-contrast focus:bg-secondary-contrast`;

  return (
    <div
      className="flex transition-height duration-150 h-9 relative"
      ref={containerRef}
      style={tagsContainerExpanded ? { height: expandedContainerHeight } : {}}
    >
      <div
        ref={tagsContainerRef}
        className={`absolute bg-default h-9 flex flex-wrap pl-1 -ml-1 ${
          tagsContainerExpanded ? '' : 'overflow-y-hidden'
        }`}
        style={{
          maxWidth: tagsContainerMaxWidth,
        }}
      >
        {tags.map((tag: SNTag, index: number) => {
          const overflowed =
            !tagsContainerExpanded &&
            lastVisibleTagIndex &&
            index > lastVisibleTagIndex;    
          return (
            <button
              className={`${tagClass} pl-1 mr-2`}
              style={{ maxWidth: tagsContainerMaxWidth }}
              ref={(element) => {
                if (element) {
                  tagsRef.current[index] = element;
                }
              }}
              onClick={() => onTagClick(tag)}
              onKeyUp={(event) => {
                if (event.key === 'Backspace') {
                  onTagBackspacePress(tag, index);
                }
              }}
              tabIndex={overflowed ? -1 : 0}
            >
              <Icon
                type="hashtag"
                className="sn-icon--small color-neutral mr-1"
              />
              <span className="whitespace-nowrap overflow-y-hidden overflow-ellipsis">
                {tag.title}
              </span>
            </button>
          );
        })}
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
          className={`${tagClass} pl-2 ml-1 absolute`}
          onClick={expandTags}
          style={{ left: overflowCountPosition }}
        >
          +{overflowedTagsCount}
        </button>
      )}
    </div>
  );
});

export const NoteTagsDirective = toDirective<Props>(NoteTags);
