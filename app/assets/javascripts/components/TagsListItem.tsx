import {
  FeaturesState,
  TAG_FOLDERS_FEATURE_NAME,
} from '@/ui_models/app_state/features_state';
import { TagsState } from '@/ui_models/app_state/tags_state';
import '@reach/tooltip/styles.css';
import { SNTag } from '@standardnotes/snjs';
import { computed, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FunctionComponent, JSX } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useDrag, useDrop } from 'react-dnd';
import { Icon } from './Icon';
import { usePremiumModal } from './Premium';

export enum ItemTypes {
  TAG = 'TAG',
}

export type DropItemTag = { uuid: string };

export type DropItem = DropItemTag;

export type DropProps = { isOver: boolean; canDrop: boolean };

type Props = {
  tag: SNTag;
  tagsState: TagsState;
  selectTag: (tag: SNTag) => void;
  removeTag: (tag: SNTag) => void;
  saveTag: (tag: SNTag, newTitle: string) => void;
  appState: TagsListState;
  level: number;
};

export type TagsListState = {
  readonly selectedTag: SNTag | undefined;
  editingTag: SNTag | undefined;
  features: FeaturesState;
};

export const TagsListItem: FunctionComponent<Props> = observer(
  ({ tag, selectTag, saveTag, removeTag, appState, tagsState, level }) => {
    const [title, setTitle] = useState(tag.title || '');
    const inputRef = useRef<HTMLInputElement>(null);

    const isSelected = appState.selectedTag === tag;
    const isEditing = appState.editingTag === tag;
    const noteCounts = tag.noteCount;

    const childrenTags = computed(() => tagsState.getChildren(tag)).get();
    const hasChildren = childrenTags.length > 0;

    const hasFolders = tagsState.hasFolders;
    const isNativeFoldersEnabled = appState.features.enableNativeFoldersFeature;
    const hasAtLeastOneFolder = tagsState.hasAtLeastOneFolder;
    const premiumModal = usePremiumModal();

    const [showChildren, setShowChildren] = useState(hasChildren);
    const [hadChildren, setHadChildren] = useState(hasChildren);

    useEffect(() => {
      if (!hadChildren && hasChildren) {
        setShowChildren(true);
      }
      setHadChildren(hasChildren);
    }, [hadChildren, hasChildren]);

    useEffect(() => {
      setTitle(tag.title || '');
    }, [setTitle, tag]);

    const toggleChildren = useCallback(
      (e: MouseEvent) => {
        e.stopPropagation();
        setShowChildren((x) => !x);
      },
      [setShowChildren]
    );

    const selectCurrentTag = useCallback(() => {
      if (isEditing || isSelected) {
        return;
      }
      selectTag(tag);
    }, [isSelected, isEditing, selectTag, tag]);

    const onBlur = useCallback(() => {
      saveTag(tag, title);
      setTitle(tag.title);
    }, [tag, saveTag, title, setTitle]);

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

    const [, dragRef] = useDrag(
      () => ({
        type: ItemTypes.TAG,
        item: { uuid: tag.uuid },
        canDrag: () => {
          return isNativeFoldersEnabled;
        },
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging(),
        }),
      }),
      [tag, hasFolders]
    );

    const [{ isOver, canDrop }, dropRef] = useDrop<DropItem, void, DropProps>(
      () => ({
        accept: ItemTypes.TAG,
        canDrop: (item) => {
          return tagsState.isValidTagParent(tag.uuid, item.uuid);
        },
        drop: (item) => {
          if (!hasFolders) {
            premiumModal.activate(TAG_FOLDERS_FEATURE_NAME);
            return;
          }
          tagsState.assignParent(item.uuid, tag.uuid);
        },
        collect: (monitor) => ({
          isOver: !!monitor.isOver(),
          canDrop: !!monitor.canDrop(),
        }),
      }),
      [tag, tagsState, hasFolders, premiumModal]
    );

    const readyToDrop = isOver && canDrop;

    return (
      <>
        <div
          className={`tag ${isSelected ? 'selected' : ''} ${
            readyToDrop ? 'is-drag-over' : ''
          }`}
          onClick={selectCurrentTag}
          ref={dragRef}
          style={{ paddingLeft: `${level * 21 + 10}px` }}
        >
          {!tag.errorDecrypting ? (
            <div className="tag-info" title={title} ref={dropRef}>
              {hasFolders && isNativeFoldersEnabled && hasAtLeastOneFolder && (
                <div
                  className={`tag-fold ${showChildren ? 'opened' : 'closed'}`}
                  onClick={hasChildren ? toggleChildren : undefined}
                >
                  <Icon
                    className={`color-neutral ${!hasChildren ? 'hidden' : ''}`}
                    type={
                      showChildren ? 'menu-arrow-down-alt' : 'menu-arrow-right'
                    }
                  />
                </div>
              )}
              <div
                className={`tag-icon ${
                  isNativeFoldersEnabled ? 'draggable' : ''
                } mr-1`}
                ref={dragRef}
              >
                <Icon
                  type="hashtag"
                  className={`${isSelected ? 'color-info' : 'color-neutral'}`}
                />
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
          <div className="meta">
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
        </div>
        {showChildren && (
          <>
            {childrenTags.map((tag) => {
              return (
                <TagsListItem
                  level={level + 1}
                  key={tag.uuid}
                  tag={tag}
                  tagsState={tagsState}
                  selectTag={selectTag}
                  saveTag={saveTag}
                  removeTag={removeTag}
                  appState={appState}
                />
              );
            })}
          </>
        )}
      </>
    );
  }
);
