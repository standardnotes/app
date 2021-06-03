import { Icon } from './Icon';
import { useRef, useState } from 'preact/hooks';
import { AppState } from '@/ui_models/app_state';
import { SNTag } from '@standardnotes/snjs/dist/@types';
import { observer } from 'mobx-react-lite';

type Props = {
  appState: AppState;
  tag: SNTag;
};

export const NoteTag = observer(({ appState, tag }: Props) => {
  const { tagsContainerMaxWidth } = appState.noteTags;

  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const deleteTagRef = useRef<HTMLButtonElement>();

  const deleteTag = () => {
    appState.noteTags.removeTagFromActiveNote(tag);
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

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Backspace':
        deleteTag();
        break;
      case 'ArrowLeft':
        appState.noteTags.getPreviousTagElement(tag)?.focus();
        break;
      case 'ArrowRight':
        appState.noteTags.getNextTagElement(tag)?.focus();
        break;
      default:
        return;
    }
  };

  return (
    <button
      ref={(element) => {
        if (element) {
          appState.noteTags.setTagElement(tag, element);
        }
      }}
      className="sn-tag pl-1 pr-2 mr-2"
      style={{ maxWidth: tagsContainerMaxWidth }}
      onClick={onTagClick}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <Icon type="hashtag" className="sn-icon--small color-info mr-1" />
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
});
