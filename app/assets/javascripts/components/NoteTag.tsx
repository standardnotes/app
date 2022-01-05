import { Icon } from './Icon';
import { useEffect, useRef, useState } from 'preact/hooks';
import { AppState } from '@/ui_models/app_state';
import { SNTag } from '@standardnotes/snjs/dist/@types';
import { observer } from 'mobx-react-lite';

type Props = {
  appState: AppState;
  tag: SNTag;
};

export const NoteTag = observer(({ appState, tag }: Props) => {
  const { autocompleteInputFocused, focusedTagUuid, tags } = appState.noteTags;

  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [tagClicked, setTagClicked] = useState(false);
  const deleteTagRef = useRef<HTMLButtonElement>(null);

  const tagRef = useRef<HTMLButtonElement>(null);

  const deleteTag = () => {
    appState.noteTags.focusPreviousTag(tag);
    appState.noteTags.removeTagFromActiveNote(tag);
  };

  const onDeleteTagClick = (event: MouseEvent) => {
    event.stopImmediatePropagation();
    event.stopPropagation();
    deleteTag();
  };

  const onTagClick = (event: MouseEvent) => {
    if (tagClicked && event.target !== deleteTagRef.current) {
      setTagClicked(false);
      appState.selectedTag = tag;
    } else {
      setTagClicked(true);
    }
  };

  const onFocus = () => {
    appState.noteTags.setFocusedTagUuid(tag.uuid);
    setShowDeleteButton(true);
  };

  const onBlur = (event: FocusEvent) => {
    const relatedTarget = event.relatedTarget as Node;
    if (relatedTarget !== deleteTagRef.current) {
      appState.noteTags.setFocusedTagUuid(undefined);
      setShowDeleteButton(false);
    }
  };

  const getTabIndex = () => {
    if (focusedTagUuid) {
      return focusedTagUuid === tag.uuid ? 0 : -1;
    }
    if (autocompleteInputFocused) {
      return -1;
    }
    return tags[0].uuid === tag.uuid ? 0 : -1;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const tagIndex = appState.noteTags.getTagIndex(tag, tags);
    switch (event.key) {
      case 'Backspace':
        deleteTag();
        break;
      case 'ArrowLeft':
        appState.noteTags.focusPreviousTag(tag);
        break;
      case 'ArrowRight':
        if (tagIndex === tags.length - 1) {
          appState.noteTags.setAutocompleteInputFocused(true);
        } else {
          appState.noteTags.focusNextTag(tag);
        }
        break;
      default:
        return;
    }
  };

  useEffect(() => {
    if (focusedTagUuid === tag.uuid) {
      tagRef.current!.focus();
    }
  }, [appState.noteTags, focusedTagUuid, tag]);

  return (
    <button
      ref={tagRef}
      className="sn-tag pl-1 pr-2 mr-2"
      onClick={onTagClick}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={getTabIndex()}
    >
      <Icon type="hashtag" className="sn-icon--small color-info mr-1" />
      <span className="whitespace-nowrap overflow-hidden overflow-ellipsis max-w-290px">
        {tag.title}
      </span>
      {showDeleteButton && (
        <button
          ref={deleteTagRef}
          type="button"
          className="ml-2 -mr-1 border-0 p-0 bg-transparent cursor-pointer flex"
          onBlur={onBlur}
          onClick={onDeleteTagClick}
          tabIndex={-1}
        >
          <Icon
            type="close"
            className="sn-icon--small color-neutral hover:color-info"
          />
        </button>
      )}
    </button>
  );
});
