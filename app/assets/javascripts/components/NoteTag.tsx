import { Icon } from './Icon';
import { FunctionalComponent, RefObject } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { AppState } from '@/ui_models/app_state';
import { SNTag } from '@standardnotes/snjs/dist/@types';

type Props = {
  appState: AppState;
  index: number;
  tagsRef: RefObject<HTMLButtonElement[]>;
  tag: SNTag;
  overflowed: boolean;
  maxWidth: number | 'auto';
};

export const NoteTag: FunctionalComponent<Props> = ({
  appState,
  index,
  tagsRef,
  tag,
  overflowed,
  maxWidth,
}) => {
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const deleteTagRef = useRef<HTMLButtonElement>();

  const deleteTag = async () => {
    await appState.activeNote.removeTagFromActiveNote(tag);

    if (index > 0 && tagsRef.current) {
      tagsRef.current[index - 1].focus();
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
    appState.activeNote.setTagFocused(false);
    if ((event.relatedTarget as Node) !== deleteTagRef.current) {
      setShowDeleteButton(false);
    }
  };

  return (
    <button
      ref={(element) => {
        if (element && tagsRef.current) {
          tagsRef.current[index] = element;
        }
      }}
      className="sn-tag pl-1 pr-2 mr-2"
      style={{ maxWidth }}
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
