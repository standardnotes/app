import { Icon } from './Icon';
import { FunctionalComponent } from 'preact';
import { useCallback, useRef, useState } from 'preact/hooks';
import { AppState } from '@/ui_models/app_state';
import { SNTag } from '@standardnotes/snjs/dist/@types';
import { useEffect } from 'react';
import { useCloseOnBlur, useCloseOnClickOutside } from './utils';

type Props = {
  appState: AppState;
  tag: SNTag;
};

export const NoteTag: FunctionalComponent<Props> = ({ appState, tag }) => {
  const {
    tags,
    tagsContainerExpanded,
    tagsContainerMaxWidth,
  } = appState.activeNote;

  const [overflowed, setOverflowed] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });

  const contextMenuRef = useRef<HTMLDivElement>();
  const tagRef = useRef<HTMLButtonElement>();

  const [closeOnBlur] = useCloseOnBlur(contextMenuRef, setContextMenuOpen);
  useCloseOnClickOutside(contextMenuRef, setContextMenuOpen);

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

  const reloadOverflowed = useCallback(() => {
    const overflowed = appState.activeNote.isTagOverflowed(tag);
    setOverflowed(overflowed);
  }, [appState.activeNote, tag]);

  useEffect(() => {
    reloadOverflowed();
  }, [reloadOverflowed, tags, tagsContainerExpanded, tagsContainerMaxWidth]);

  const contextMenuListener = (event: MouseEvent) => {
    event.preventDefault();
    setContextMenuPosition({
      top: event.clientY,
      left: event.clientX,
    });
    setContextMenuOpen(true);
  };

  useEffect(() => {
    tagRef.current.addEventListener('contextmenu', contextMenuListener);
    return () => {
      tagRef.current.removeEventListener('contextmenu', contextMenuListener);
    };
  }, []);

  return (
    <>
      <button
        ref={(element) => {
          if (element) {
            appState.activeNote.setTagElement(tag, element);
            tagRef.current = element;
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
        onBlur={closeOnBlur}
      >
        <Icon type="hashtag" className="sn-icon--small color-neutral mr-1" />
        <span className="whitespace-nowrap overflow-hidden overflow-ellipsis">
          {tag.title}
        </span>
      </button>
      {contextMenuOpen && (
        <div
          ref={contextMenuRef}
          className="sn-dropdown sn-dropdown--small max-h-120 max-w-xs flex flex-col py-2 overflow-y-scroll fixed"
          style={{
            ...contextMenuPosition
          }}
        >
          <button
            type="button"
            className="sn-dropdown-item"
            onClick={deleteTag}
          >
            <div className="flex items-center">
              <Icon type="close" className="color-danger mr-2" />
              <span className="color-danger">Remove tag</span>
            </div>
          </button>
        </div>
      )}
    </>
  );
};
