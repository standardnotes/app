import { Icon } from './Icon';
import { FunctionalComponent, RefObject } from 'preact';
import { useCallback, useRef, useState } from 'preact/hooks';
import { AppState } from '@/ui_models/app_state';
import { SNTag } from '@standardnotes/snjs/dist/@types';
import { useEffect } from 'react';

type Props = {
  appState: AppState;
  tag: SNTag;
  overflowButtonRef: RefObject<HTMLButtonElement>;
};

export const NoteTag: FunctionalComponent<Props> = ({ appState, tag, overflowButtonRef }) => {
  const {
    tags,
    tagsContainerMaxWidth,
  } = appState.activeNote;

  const [overflowed, setOverflowed] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  const deleteTagRef = useRef<HTMLButtonElement>();

  const deleteTag = async () => {
    await appState.activeNote.removeTagFromActiveNote(tag);
    const previousTag = appState.activeNote.getPreviousTag(tag);

    if (previousTag) {
      const previousTagElement = appState.activeNote.getTagElement(previousTag);
      previousTagElement?.focus();
    }
  };

  const onTagClick = () => {
    appState.setSelectedTag(tag);
  };

  const onFocus = () => {
    appState.activeNote.setTagFocused(true);
    setShowDeleteButton(true);
  };

  const onBlur = (event: FocusEvent) => {
    const relatedTarget = event.relatedTarget as Node;
    if (relatedTarget === overflowButtonRef.current) {
      (event.target as HTMLButtonElement).focus();
    } else if (relatedTarget !== deleteTagRef.current) {
      appState.activeNote.setTagFocused(false);
      setShowDeleteButton(false);
    }
  };

  const reloadOverflowed = useCallback(() => {
    const overflowed = appState.activeNote.isTagOverflowed(tag);
    setOverflowed(overflowed);
  }, [appState.activeNote, tag]);

  useEffect(() => {
    reloadOverflowed();
  }, [reloadOverflowed, tags, tagsContainerMaxWidth]);

  return (
    <button
      ref={(element) => {
        if (element) {
          appState.activeNote.setTagElement(tag, element);
        }
      }}
      className="sn-tag pl-1 pr-2 mr-2"
      style={{ maxWidth: tagsContainerMaxWidth }}
      onClick={onTagClick}
      onKeyUp={(event) => {
        if (event.key === 'Backspace') {
          deleteTag();
        }
      }}
      tabIndex={overflowed ? -1 : 0}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <Icon type="hashtag" className="sn-icon--small color-neutral mr-1" />
      <span className="whitespace-nowrap overflow-hidden overflow-ellipsis">
        {tag.title}
      </span>
      {showDeleteButton && (
        <button
          ref={deleteTagRef}
          type="button"
          className="ml-2 -mr-1 border-0 p-0 bg-transparent cursor-pointer flex"
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={deleteTag}
        >
          <Icon
            type="close"
            className="sn-icon--small color-neutral hover:color-info"
          />
        </button>
      )}
    </button>
  );
};
