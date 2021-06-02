import { Icon } from './Icon';
import { FunctionalComponent } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { AppState } from '@/ui_models/app_state';
import { SNTag } from '@standardnotes/snjs/dist/@types';

type Props = {
  appState: AppState;
  tag: SNTag;
};

export const NoteTag: FunctionalComponent<Props> = ({ appState, tag }) => {
  const {
    tagsContainerMaxWidth,
  } = appState.activeNote;

  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const deleteTagRef = useRef<HTMLButtonElement>();

  const deleteTag = () => {
    appState.activeNote.removeTagFromActiveNote(tag);
  };

  const onTagClick = () => {
    appState.setSelectedTag(tag);
  };

  const onFocus = () => {
    setShowDeleteButton(true);
  };

  const onBlur = (event: FocusEvent) => {
    const relatedTarget = event.relatedTarget as Node;
    if (relatedTarget !== deleteTagRef.current) {
      setShowDeleteButton(false);
    }
  };

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
