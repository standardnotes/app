import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { toDirective } from './utils';
import { Icon } from './Icon';
import { AutocompleteTagInput } from './AutocompleteTagInput';
import { WebApplication } from '@/ui_models/application';
import { useEffect, useRef, useState } from 'preact/hooks';
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

  const [overflowedTagsCount, setOverflowedTagsCount] = useState(0);
  const [overflowCountPosition, setOverflowCountPosition] = useState(0);
  const [tagsContainerCollapsed, setTagsContainerCollapsed] = useState(true);
  const [containerHeight, setContainerHeight] = useState(TAGS_ROW_HEIGHT);

  const containerRef = useRef<HTMLDivElement>();
  const tagsContainerRef = useRef<HTMLDivElement>();
  const tagsRef = useRef<HTMLButtonElement[]>([]);
  tagsRef.current = [];

  const onTagBackspacePress = async (tag: SNTag) => {
    await appState.activeNote.removeTagFromActiveNote(tag);

    if (tagsRef.current.length > 1) {
      tagsRef.current[tagsRef.current.length - 1].focus();
    }
  };

  const expandTags = () => {
    setContainerHeight(tagsContainerRef.current.scrollHeight);
    setTagsContainerCollapsed(false);
  };

  useEffect(() => {
    appState.activeNote.reloadTagsContainerLayout();
    let overflowCount = 0;
    for (const [index, tagElement] of tagsRef.current.entries()) {
      if (tagElement.getBoundingClientRect().top >= MIN_OVERFLOW_TOP) {
        if (overflowCount === 0) {
          setOverflowCountPosition(
            tagsRef.current[index - 1].getBoundingClientRect().right -
              (tagsContainerPosition ?? 0) +
              TAGS_RIGHT_MARGIN
          );
        }
        overflowCount += 1;
      }
    }
    setOverflowedTagsCount(overflowCount);

    if (!tagsContainerCollapsed) {
      setContainerHeight(tagsContainerRef.current.scrollHeight);
    }
  }, [
    appState.activeNote,
    tags,
    tagsContainerCollapsed,
    tagsContainerPosition,
  ]);

  const tagClass = `bg-contrast border-0 rounded text-xs color-text py-1 pr-2 flex items-center 
    mt-2 mr-2 cursor-pointer hover:bg-secondary-contrast focus:bg-secondary-contrast`;

  return (
    <div
      className="flex"
      ref={containerRef}
      style={{ height: containerHeight }}
    >
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
        />
      </div>
      {overflowedTagsCount > 1 && tagsContainerCollapsed && (
        <button
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
