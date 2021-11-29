import { SNTag } from '@standardnotes/snjs';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FunctionComponent, JSX } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useDrag, useDrop } from 'react-dnd';

enum ItemTypes {
  TAG = 'TAG',
}

type DropItemTag = { uuid: string };

type DropItem = DropItemTag;

type DropProps = { isOver: boolean; canDrop: boolean };

type Props = {
  tag: SNTag;
  selectTag: (tag: SNTag) => void;
  removeTag: (tag: SNTag) => void;
  saveTag: (tag: SNTag, newTitle: string) => void;
  appState: TagsListState;
};

export type TagsListState = {
  readonly selectedTag: SNTag | undefined;
  editingTag: SNTag | undefined;
};

export const TagsListItem: FunctionComponent<Props> = observer(
  ({ tag, selectTag, saveTag, removeTag, appState }) => {
    const [title, setTitle] = useState(tag.title || '');
    const inputRef = useRef<HTMLInputElement>(null);

    const isSelected = appState.selectedTag === tag;
    const isEditing = appState.editingTag === tag;
    const noteCounts = tag.noteCount;

    useEffect(() => {
      setTitle(tag.title || '');
    }, [setTitle, tag]);

    const selectCurrentTag = useCallback(() => {
      if (isEditing || isSelected) {
        return;
      }
      selectTag(tag);
    }, [isSelected, isEditing, selectTag, tag]);

    const onBlur = useCallback(() => {
      saveTag(tag, title);
    }, [tag, saveTag, title]);

    const onInput = useCallback(
      (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const value = (e.target as HTMLInputElement).value;
        setTitle(value);
      },
      [setTitle]
    );

    const onKeyUp = useCallback(
      (e: KeyboardEvent) => {
        if (e.code === 'Enter') {
          inputRef.current?.blur();
          e.preventDefault();
        }
      },
      [inputRef]
    );

    useEffect(() => {
      if (isEditing) {
        inputRef.current?.focus();
      }
    }, [inputRef, isEditing]);

    const onClickRename = useCallback(() => {
      runInAction(() => {
        appState.editingTag = tag;
      });
    }, [appState, tag]);

    const onClickSave = useCallback(() => {
      inputRef.current?.blur();
    }, [inputRef]);

    const onClickDelete = useCallback(() => {
      removeTag(tag);
    }, [removeTag, tag]);

    // Drag and Drop
    const [{ opacity }, dragRef, previewRef] = useDrag(
      () => ({
        type: ItemTypes.TAG,
        item: { uuid: tag.uuid },
        collect: (monitor) => ({
          opacity: monitor.isDragging() ? 0.5 : 1,
          isDragging: !!monitor.isDragging(),
        }),
      }),
      [tag]
    );

    const [{ isOver, canDrop }, dropRef] = useDrop<DropItem, void, DropProps>(
      () => ({
        accept: ItemTypes.TAG,
        canDrop: (item) => {
          return item.uuid !== tag.uuid;
        },
        drop: () => console.log('hello'),
        collect: (monitor) => ({
          isOver: !!monitor.isOver(),
          canDrop: !!monitor.canDrop(),
        }),
      }),
      [tag]
    );

    const isDraggable = true;
    const readyToDrop = isOver && canDrop;

    return (
      <div
        className={`tag ${isSelected ? 'selected' : ''} ${
          readyToDrop ? 'is-drag-over' : ''
        }`}
        onClick={selectCurrentTag}
        ref={previewRef}
      >
        {!tag.errorDecrypting ? (
          <div className="tag-info" ref={dropRef}>
            <div
              className={`tag-icon ${isDraggable ? 'draggable' : ''}`}
              ref={dragRef}
            >
              #
            </div>
            <input
              className={`title ${isEditing ? 'editing' : ''}`}
              id={`react-tag-${tag.uuid}`}
              onBlur={onBlur}
              onInput={onInput}
              value={title}
              onKeyUp={onKeyUp}
              spellCheck={false}
              ref={inputRef}
            />
            <div className="count">{noteCounts}</div>
          </div>
        ) : null}
        {tag.conflictOf && (
          <div className="danger small-text font-bold">
            Conflicted Copy {tag.conflictOf}
          </div>
        )}
        {tag.errorDecrypting && !tag.waitingForKey && (
          <div className="danger small-text font-bold">Missing Keys</div>
        )}
        {tag.errorDecrypting && tag.waitingForKey && (
          <div className="info small-text font-bold">Waiting For Keys</div>
        )}
        {isSelected && (
          <div className="menu">
            {!isEditing && (
              <a className="item" onClick={onClickRename}>
                Rename
              </a>
            )}
            {isEditing && (
              <a className="item" onClick={onClickSave}>
                Save
              </a>
            )}
            <a className="item" onClick={onClickDelete}>
              Delete
            </a>
          </div>
        )}
      </div>
    );
  }
);
