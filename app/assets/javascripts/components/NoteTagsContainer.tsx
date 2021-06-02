import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { toDirective, useCloseOnClickOutside } from './utils';
import { AutocompleteTagInput } from './AutocompleteTagInput';
import { WebApplication } from '@/ui_models/application';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { NoteTag } from './NoteTag';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const NoteTagsContainer = observer(({ application, appState }: Props) => {
  const {
    inputOverflowed,
    overflowCountPosition,
    overflowedTagsCount,
    tagElements,
    tags,
    tagsContainerMaxWidth,
    tagsContainerExpanded,
    tagsOverflowed,
  } = appState.activeNote;

  const [expandedContainerHeight, setExpandedContainerHeight] = useState(0);

  const tagsContainerRef = useRef<HTMLDivElement>();
  const overflowButtonRef = useRef<HTMLButtonElement>();

  useCloseOnClickOutside(tagsContainerRef, (expanded: boolean) => {
    if (tagsContainerExpanded) {
      appState.activeNote.setTagsContainerExpanded(expanded);
    }
  });

  const reloadExpandedContainerHeight = useCallback(() => {
    setExpandedContainerHeight(tagsContainerRef.current.scrollHeight);
  }, []);

  useEffect(() => {
    appState.activeNote.reloadTagsContainerLayout();
    reloadExpandedContainerHeight();
  }, [
    appState.activeNote,
    reloadExpandedContainerHeight,
    tags,
    tagsContainerMaxWidth,
  ]);

  useEffect(() => {
    let tagResizeObserver: ResizeObserver;
    if (ResizeObserver) {
      tagResizeObserver = new ResizeObserver(() => {
        appState.activeNote.reloadTagsContainerLayout();
        reloadExpandedContainerHeight();
      });
      tagElements.forEach(
        (tagElement) => tagElement && tagResizeObserver.observe(tagElement)
      );
    }

    return () => {
      if (tagResizeObserver) {
        tagResizeObserver.disconnect();
      }
    };
  }, [appState.activeNote, reloadExpandedContainerHeight, tagElements]);

  return (
    <div
      className={`flex transition-height duration-150 relative ${
        inputOverflowed ? 'h-18' : 'h-9'
      }`}
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
        {tags.map((tag) => (
          <NoteTag
            key={tag.uuid}
            appState={appState}
            tag={tag}
          />
        ))}
        <AutocompleteTagInput application={application} appState={appState} />
      </div>
      {tagsOverflowed && (
        <button
          ref={overflowButtonRef}
          type="button"
          className="sn-tag ml-1 absolute"
          onClick={() => appState.activeNote.setTagsContainerExpanded(true)}
          style={{ left: overflowCountPosition }}
        >
          +{overflowedTagsCount}
        </button>
      )}
    </div>
  );
});

export const NoteTagsContainerDirective = toDirective<Props>(NoteTagsContainer);
