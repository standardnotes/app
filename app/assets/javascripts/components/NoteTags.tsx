import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { toDirective } from './utils';
import { Icon } from './Icon';
import { AutocompleteTagInput } from './AutocompleteTagInput';
import { WebApplication } from '@/ui_models/application';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { SNTag } from '@standardnotes/snjs';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const TAGS_ROW_RIGHT_MARGIN = 92;
const TAGS_ROW_HEIGHT = 36;
const MIN_OVERFLOW_TOP = 76;
const TAGS_RIGHT_MARGIN = 8;

const NoteTags = observer(({ application, appState }: Props) => {
  const { tags, tagsContainerPosition, tagsContainerMaxWidth } =
    appState.activeNote;

  const [tagsContainerCollapsed, setTagsContainerCollapsed] = useState(true);
  const [tagsContainerHeight, setTagsContainerHeight] =
    useState(TAGS_ROW_HEIGHT);
  const [overflowCountPosition, setOverflowCountPosition] = useState(0);
  const [overflowCount, setOverflowCount] = useState(0);

  const tagsContainerRef = useRef<HTMLDivElement>();
  const tagsRef = useRef<HTMLButtonElement[]>([]);

  const onTagBackspacePress = async (tag: SNTag) => {
    await appState.activeNote.removeTagFromActiveNote(tag);

    if (tagsRef.current.length > 1) {
      tagsRef.current[tagsRef.current.length - 1].focus();
    }
  };

  const expandTags = () => {
    setTagsContainerCollapsed(false);
  };

  const isTagOverflowed = useCallback(
    (tagElement?: HTMLButtonElement): boolean | undefined => {
      if (!tagElement) {
        return;
      }
      if (!tagsContainerCollapsed) {
        return false;
      }
      return tagElement.getBoundingClientRect().top >= MIN_OVERFLOW_TOP;
    },
    [tagsContainerCollapsed]
  );

  const reloadOverflowCountPosition = useCallback(() => {
    const firstOverflowedTagIndex = tagsRef.current.findIndex((tagElement) =>
      isTagOverflowed(tagElement)
    );
    if (!tagsContainerCollapsed || firstOverflowedTagIndex < 1) {
      return;
    }
    const previousTagRect =
      tagsRef.current[firstOverflowedTagIndex - 1].getBoundingClientRect();
    const position =
      previousTagRect.right - (tagsContainerPosition ?? 0) + TAGS_RIGHT_MARGIN;
    setOverflowCountPosition(position);
  }, [isTagOverflowed, tagsContainerCollapsed, tagsContainerPosition]);

  const reloadTagsContainerHeight = useCallback(() => {
    const height = tagsContainerCollapsed
      ? TAGS_ROW_HEIGHT
      : tagsContainerRef.current.scrollHeight;
    setTagsContainerHeight(height);
  }, [tagsContainerCollapsed]);

  const reloadOverflowCount = useCallback(() => {
    const count = tagsRef.current.filter((tagElement) =>
      isTagOverflowed(tagElement)
    ).length;
    setOverflowCount(count);
  }, [isTagOverflowed]);

  useEffect(() => {
    appState.activeNote.reloadTagsContainerLayout();
    reloadOverflowCountPosition();
    reloadTagsContainerHeight();
    reloadOverflowCount();
  }, [
    appState.activeNote,
    reloadOverflowCountPosition,
    reloadTagsContainerHeight,
    reloadOverflowCount,
    tags,
  ]);

  const tagClass = `bg-contrast border-0 rounded text-xs color-text py-1 pr-2 flex items-center 
    mt-2 mr-2 cursor-pointer hover:bg-secondary-contrast focus:bg-secondary-contrast`;

  const overflowedTags = tagsContainerCollapsed && overflowCount > 0;

  return (
    <div className="flex" style={{ height: tagsContainerHeight }}>
      <div
        ref={tagsContainerRef}
        className={`absolute flex flex-wrap pl-1 -ml-1 ${
          tagsContainerCollapsed ? 'overflow-hidden' : ''
        }`}
        style={{
          maxWidth: tagsContainerMaxWidth,
          height: TAGS_ROW_HEIGHT,
          marginRight: TAGS_ROW_RIGHT_MARGIN,
        }}
      >
        {tags.map((tag: SNTag, index: number) => (
          <button
            className={`${tagClass} pl-1`}
            style={{ maxWidth: tagsContainerMaxWidth }}
            ref={(element) => {
              if (element) {
                tagsRef.current[index] = element;
              }
            }}
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
          tabIndex={overflowedTags ? -1 : 0}
        />
      </div>
      {overflowCount > 1 && tagsContainerCollapsed && (
        <button
          type="button"
          className={`${tagClass} pl-2 absolute`}
          style={{ left: overflowCountPosition }}
          onClick={expandTags}
        >
          +{overflowCount}
        </button>
      )}
    </div>
  );
});

export const NoteTagsDirective = toDirective<Props>(NoteTags);
