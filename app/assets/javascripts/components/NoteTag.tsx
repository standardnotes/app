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
  const { focusedTagUuid, tags } = appState.noteTags;

  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [tagClicked, setTagClicked] = useState(false);
  const deleteTagRef = useRef<HTMLButtonElement>();

  const tagRef = useRef<HTMLButtonElement>();

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
      appState.setSelectedTag(tag);
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
      tagRef.current.focus();
      appState.noteTags.setFocusedTagUuid(undefined);
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
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={onDeleteTagClick}
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
