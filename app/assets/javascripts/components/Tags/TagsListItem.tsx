import { Icon } from '@/components/Icon';
import { usePremiumModal } from '@/components/Premium';
import { KeyboardKey } from '@/services/ioService';
import {
  FeaturesState,
  TAG_FOLDERS_FEATURE_NAME,
} from '@/ui_models/app_state/features_state';
import { TagsState } from '@/ui_models/app_state/tags_state';
import '@reach/tooltip/styles.css';
import { SNTag } from '@standardnotes/snjs';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FunctionComponent, JSX } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useDrag, useDrop } from 'react-dnd';
import { DropItem, DropProps, ItemTypes } from './dragndrop';

type Props = {
  tag: SNTag;
  tagsState: TagsState;
  features: FeaturesState;
  level: number;
  onContextMenu: (tag: SNTag, posX: number, posY: number) => void;
};

const PADDING_BASE_PX = 14;
const PADDING_PER_LEVEL_PX = 21;

export const TagsListItem: FunctionComponent<Props> = observer(
  ({ tag, features, tagsState, level, onContextMenu }) => {
    const [title, setTitle] = useState(tag.title || '');
    const [subtagTitle, setSubtagTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const subtagInputRef = useRef<HTMLInputElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    const isSelected = tagsState.selected === tag;
    const isEditing = tagsState.editingTag === tag;
    const isAddingSubtag = tagsState.addingSubtagTo === tag;
    const noteCounts = computed(() => tagsState.getNotesCount(tag));

    const childrenTags = computed(() => tagsState.getChildren(tag)).get();
    const hasChildren = childrenTags.length > 0;

    const hasFolders = features.hasFolders;
    const hasAtLeastOneFolder = tagsState.hasAtLeastOneFolder;

    const premiumModal = usePremiumModal();

    const [showChildren, setShowChildren] = useState(tag.expanded);
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
        setShowChildren((x) => {
          tagsState.setExpanded(tag, !x);
          return !x;
        });
      },
      [setShowChildren, tag, tagsState]
    );

    const selectCurrentTag = useCallback(() => {
      tagsState.selected = tag;
    }, [tagsState, tag]);

    const onBlur = useCallback(() => {
      tagsState.save(tag, title);
      setTitle(tag.title);
    }, [tagsState, tag, title, setTitle]);

    const onInput = useCallback(
      (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const value = (e.target as HTMLInputElement).value;
        setTitle(value);
      },
      [setTitle]
    );

    const onKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === KeyboardKey.Enter) {
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

    const onSubtagInput = useCallback(
      (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const value = (e.target as HTMLInputElement).value;
        setSubtagTitle(value);
      },
      []
    );

    const onSubtagInputBlur = useCallback(() => {
      tagsState.createSubtagAndAssignParent(tag, subtagTitle);
      setSubtagTitle('');
    }, [subtagTitle, tag, tagsState]);

    const onSubtagKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === KeyboardKey.Enter) {
          e.preventDefault();
          subtagInputRef.current?.blur();
        }
      },
      [subtagInputRef]
    );

    useEffect(() => {
      if (isAddingSubtag) {
        subtagInputRef.current?.focus();
      }
    }, [subtagInputRef, isAddingSubtag]);

    const [, dragRef] = useDrag(
      () => ({
        type: ItemTypes.TAG,
        item: { uuid: tag.uuid },
        canDrag: () => {
          return true;
        },
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging(),
        }),
      }),
      [tag]
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

    const toggleContextMenu = () => {
      if (!menuButtonRef.current) {
        return;
      }

      const contextMenuOpen = tagsState.contextMenuOpen;
      const menuButtonRect = menuButtonRef.current?.getBoundingClientRect();

      if (contextMenuOpen) {
        tagsState.setContextMenuOpen(false);
      } else {
        onContextMenu(tag, menuButtonRect.right, menuButtonRect.top);
      }
    };

    return (
      <>
        <button
          className={`tag focus:shadow-inner ${isSelected ? 'selected' : ''} ${
            readyToDrop ? 'is-drag-over' : ''
          }`}
          onClick={selectCurrentTag}
          ref={dragRef}
          style={{
            paddingLeft: `${level * PADDING_PER_LEVEL_PX + PADDING_BASE_PX}px`,
          }}
          onContextMenu={(e: MouseEvent) => {
            e.preventDefault();
            onContextMenu(tag, e.clientX, e.clientY);
          }}
        >
          {!tag.errorDecrypting ? (
            <div className="tag-info" title={title} ref={dropRef}>
              {hasAtLeastOneFolder && (
                <div className="tag-fold-container">
                  <button
                    className={`tag-fold focus:shadow-inner ${
                      showChildren ? 'opened' : 'closed'
                    } ${!hasChildren ? 'invisible' : ''}`}
                    onClick={hasChildren ? toggleChildren : undefined}
                  >
                    <Icon
                      className={`color-neutral`}
                      type={
                        showChildren
                          ? 'menu-arrow-down-alt'
                          : 'menu-arrow-right'
                      }
                    />
                  </button>
                </div>
              )}
              <div className={`tag-icon draggable mr-1`} ref={dragRef}>
                <Icon
                  type="hashtag"
                  className={`${isSelected ? 'color-info' : 'color-neutral'}`}
                />
              </div>
              <input
                className={`title ${isEditing ? 'editing' : ''}`}
                id={`react-tag-${tag.uuid}`}
                disabled={!isEditing}
                onBlur={onBlur}
                onInput={onInput}
                value={title}
                onKeyDown={onKeyDown}
                spellCheck={false}
                ref={inputRef}
              />
              <div className="flex items-center">
                <button
                  className={`p-0 border-0 mr-2 bg-transparent focus:shadow-inner cursor-pointer ${
                    isSelected ? 'visible' : 'invisible'
                  }`}
                  onClick={toggleContextMenu}
                  ref={menuButtonRef}
                >
                  <Icon type="more" className="color-neutral" />
                </button>
                <div className="count">{noteCounts.get()}</div>
              </div>
            </div>
          ) : null}
          <div className={`meta ${hasAtLeastOneFolder ? 'with-folders' : ''}`}>
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
          </div>
        </button>
        {isAddingSubtag && (
          <div
            className="tag overflow-hidden"
            style={{
              paddingLeft: `${
                (level + 1) * PADDING_PER_LEVEL_PX + PADDING_BASE_PX
              }px`,
            }}
          >
            <div className="tag-info">
              <div className="tag-fold" />
              <div className="tag-icon mr-1">
                <Icon type="hashtag" className="color-neutral mr-1" />
              </div>
              <input
                className="title w-full focus:shadow-none"
                type="text"
                ref={subtagInputRef}
                onBlur={onSubtagInputBlur}
                onKeyDown={onSubtagKeyDown}
                value={subtagTitle}
                onInput={onSubtagInput}
              />
            </div>
          </div>
        )}
        {showChildren && (
          <>
            {childrenTags.map((tag) => {
              return (
                <TagsListItem
                  level={level + 1}
                  key={tag.uuid}
                  tag={tag}
                  tagsState={tagsState}
                  features={features}
                  onContextMenu={onContextMenu}
                />
              );
            })}
          </>
        )}
      </>
    );
  }
);
