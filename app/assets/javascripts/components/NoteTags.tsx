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
const TAGS_ROW_HEIGHT = 32;
const MIN_OVERFLOW_TOP = 76;
const TAG_RIGHT_MARGIN = 8;

const NoteTags = observer(({ application, appState }: Props) => {
  const { activeNoteTags } = appState.notes;
  const [tagsContainerMaxWidth, setTagsContainerMaxWidth] =
    useState<number | 'auto'>('auto');
  const [overflowedTagsCount, setOverflowedTagsCount] = useState(0);
  const [overflowCountPosition, setOverflowCountPosition] = useState(0);
  const [tagsContainerCollapsed, setTagsContainerCollapsed] = useState(true);
  const [containerHeight, setContainerHeight] = useState(TAGS_ROW_HEIGHT);

  const containerRef = useRef<HTMLDivElement>();
  const tagsContainerRef = useRef<HTMLDivElement>();
  const tagsRef = useRef<HTMLButtonElement[]>([]);
  tagsRef.current = [];

  const onTagBackspacePress = async (tag: SNTag) => {
    await appState.notes.removeTagFromActiveNote(tag);

    if (tagsRef.current.length > 1) {
      tagsRef.current[tagsRef.current.length - 1].focus();
    }
  };

  const reloadOverflowCount = useCallback(() => {
    const editorElement = document.getElementById('editor-column');
    let overflowCount = 0;
    for (const [index, tagElement] of tagsRef.current.entries()) {
      if (tagElement.getBoundingClientRect().top >= MIN_OVERFLOW_TOP) {
        if (overflowCount === 0) {
          setOverflowCountPosition(
            tagsRef.current[index - 1].getBoundingClientRect().right -
              (editorElement ? editorElement.getBoundingClientRect().left : 0) +
              TAG_RIGHT_MARGIN
          );
        }
        overflowCount += 1;
      }
    }
    setOverflowedTagsCount(overflowCount);

    if (!tagsContainerCollapsed) {
      setContainerHeight(tagsContainerRef.current.scrollHeight);
    }
  }, [tagsContainerCollapsed]);

  const expandTags = () => {
    setContainerHeight(tagsContainerRef.current.scrollHeight);
    setTagsContainerCollapsed(false);
  };

  useEffect(() => {
    const editorElement = document.getElementById('editor-column');
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width } = entry.contentRect;
      setTagsContainerMaxWidth(width);
      reloadOverflowCount();
    });

    if (editorElement) {
      resizeObserver.observe(editorElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [reloadOverflowCount]);

  useEffect(() => {
    reloadOverflowCount();
  }, [activeNoteTags, reloadOverflowCount]);

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
        className={`absolute flex flex-wrap ${
          tagsContainerCollapsed ? 'overflow-hidden' : ''
        }`}
        style={{
          maxWidth: tagsContainerMaxWidth,
          height: TAGS_ROW_HEIGHT,
          marginRight: TAGS_ROW_RIGHT_MARGIN,
        }}
      >
        {activeNoteTags.map((tag, index) => (
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
