import Icon from '@/Components/Icon/Icon'
import { TAG_FOLDERS_FEATURE_NAME } from '@/Constants/Constants'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { KeyboardKey } from '@standardnotes/ui-services'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import '@reach/tooltip/styles.css'
import { SNTag } from '@standardnotes/snjs'
import { computed } from 'mobx'
import { observer } from 'mobx-react-lite'
import {
  FormEventHandler,
  FunctionComponent,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { DropItem, DropProps, ItemTypes } from './DragNDrop'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { mergeRefs } from '@/Hooks/mergeRefs'
import { useFileDragNDrop } from '../FileDragNDropProvider/FileDragNDropProvider'

type Props = {
  tag: SNTag
  tagsState: NavigationController
  features: FeaturesController
  level: number
  onContextMenu: (tag: SNTag, posX: number, posY: number) => void
}

const PADDING_BASE_PX = 14
const PADDING_PER_LEVEL_PX = 21

export const TagsListItem: FunctionComponent<Props> = observer(({ tag, features, tagsState, level, onContextMenu }) => {
  const { toggleAppPane } = useResponsiveAppPane()

  const [title, setTitle] = useState(tag.title || '')
  const [subtagTitle, setSubtagTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const subtagInputRef = useRef<HTMLInputElement>(null)
  const menuButtonRef = useRef<HTMLAnchorElement>(null)

  const isSelected = tagsState.selected === tag
  const isEditing = tagsState.editingTag === tag
  const isAddingSubtag = tagsState.addingSubtagTo === tag
  const noteCounts = computed(() => tagsState.getNotesCount(tag))

  const childrenTags = computed(() => tagsState.getChildren(tag)).get()
  const hasChildren = childrenTags.length > 0

  const hasFolders = features.hasFolders
  const hasAtLeastOneFolder = tagsState.hasAtLeastOneFolder

  const premiumModal = usePremiumModal()

  const [showChildren, setShowChildren] = useState(tag.expanded)
  const [hadChildren, setHadChildren] = useState(hasChildren)

  useEffect(() => {
    if (!hadChildren && hasChildren) {
      setShowChildren(true)
    }
    setHadChildren(hasChildren)
  }, [hadChildren, hasChildren])

  useEffect(() => {
    setTitle(tag.title || '')
  }, [setTitle, tag])

  const toggleChildren: MouseEventHandler = useCallback(
    (e) => {
      e.stopPropagation()
      setShowChildren((x) => {
        tagsState.setExpanded(tag, !x)
        return !x
      })
    },
    [setShowChildren, tag, tagsState],
  )

  const selectCurrentTag = useCallback(async () => {
    await tagsState.setSelectedTag(tag)
    toggleAppPane(AppPaneId.Items)
  }, [tagsState, tag, toggleAppPane])

  const onBlur = useCallback(() => {
    tagsState.save(tag, title).catch(console.error)
    setTitle(tag.title)
  }, [tagsState, tag, title, setTitle])

  const onInput: FormEventHandler = useCallback(
    (e) => {
      const value = (e.target as HTMLInputElement).value
      setTitle(value)
    },
    [setTitle],
  )

  const onKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (e.key === KeyboardKey.Enter) {
        inputRef.current?.blur()
        e.preventDefault()
      }
    },
    [inputRef],
  )

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [inputRef, isEditing])

  const onSubtagInput: FormEventHandler<HTMLInputElement> = useCallback((e) => {
    const value = (e.target as HTMLInputElement).value
    setSubtagTitle(value)
  }, [])

  const onSubtagInputBlur = useCallback(() => {
    tagsState.createSubtagAndAssignParent(tag, subtagTitle).catch(console.error)
    setSubtagTitle('')
  }, [subtagTitle, tag, tagsState])

  const onSubtagKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (e.key === KeyboardKey.Enter) {
        e.preventDefault()
        subtagInputRef.current?.blur()
      }
    },
    [subtagInputRef],
  )

  useEffect(() => {
    if (isAddingSubtag) {
      subtagInputRef.current?.focus()
    }
  }, [subtagInputRef, isAddingSubtag])

  const [, dragRef] = useDrag(
    () => ({
      type: ItemTypes.TAG,
      item: { uuid: tag.uuid },
      canDrag: () => {
        return true
      },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [tag],
  )

  const [{ isOver, canDrop }, dropRef] = useDrop<DropItem, void, DropProps>(
    () => ({
      accept: ItemTypes.TAG,
      canDrop: (item) => {
        return tagsState.isValidTagParent(tag, item as SNTag)
      },
      drop: (item) => {
        if (!hasFolders) {
          premiumModal.activate(TAG_FOLDERS_FEATURE_NAME)
          return
        }
        tagsState.assignParent(item.uuid, tag.uuid).catch(console.error)
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [tag, tagsState, hasFolders, premiumModal],
  )

  const readyToDrop = isOver && canDrop

  const toggleContextMenu: MouseEventHandler<HTMLAnchorElement> = useCallback(
    (event) => {
      event.preventDefault()
      event.stopPropagation()

      if (!menuButtonRef.current) {
        return
      }

      const contextMenuOpen = tagsState.contextMenuOpen
      const menuButtonRect = menuButtonRef.current?.getBoundingClientRect()

      if (contextMenuOpen) {
        tagsState.setContextMenuOpen(false)
      } else {
        onContextMenu(tag, menuButtonRect.right, menuButtonRect.top)
      }
    },
    [onContextMenu, tagsState, tag],
  )

  const tagRef = useRef<HTMLDivElement>(null)

  const { addDragTarget, removeDragTarget } = useFileDragNDrop()

  useEffect(() => {
    const target = tagRef.current

    if (target) {
      addDragTarget(target)
    }

    return () => {
      if (target) {
        removeDragTarget(target)
      }
    }
  }, [addDragTarget, removeDragTarget])

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={classNames(
          'tag py-2 px-3.5 focus:shadow-inner md:py-1',
          isSelected && 'selected',
          readyToDrop && 'is-drag-over',
        )}
        onClick={selectCurrentTag}
        ref={mergeRefs([dragRef, tagRef])}
        style={{
          paddingLeft: `${level * PADDING_PER_LEVEL_PX + PADDING_BASE_PX}px`,
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu(tag, e.clientX, e.clientY)
        }}
      >
        <div className="tag-info" title={title} ref={dropRef}>
          {hasAtLeastOneFolder && (
            <div className="tag-fold-container">
              <a
                role="button"
                className={`tag-fold focus:shadow-inner ${showChildren ? 'opened' : 'closed'} ${
                  !hasChildren ? 'invisible' : ''
                }`}
                onClick={hasChildren ? toggleChildren : undefined}
              >
                <Icon className={'text-neutral'} type={showChildren ? 'menu-arrow-down-alt' : 'menu-arrow-right'} />
              </a>
            </div>
          )}
          <div className={'tag-icon draggable mr-2'} ref={dragRef}>
            <Icon type="hashtag" className={`${isSelected ? 'text-info' : 'text-neutral'}`} />
          </div>
          {isEditing ? (
            <input
              className={'title editing focus:shadow-none focus:outline-none'}
              id={`react-tag-${tag.uuid}`}
              onBlur={onBlur}
              onInput={onInput}
              value={title}
              onKeyDown={onKeyDown}
              spellCheck={false}
              ref={inputRef}
            />
          ) : (
            <div
              className={'title overflow-hidden text-left focus:shadow-none focus:outline-none'}
              id={`react-tag-${tag.uuid}`}
            >
              {title}
            </div>
          )}
          <div className="flex items-center">
            <a
              role="button"
              className={`mr-2 cursor-pointer border-0 bg-transparent hover:bg-contrast focus:shadow-inner ${
                isSelected ? 'visible' : 'invisible'
              }`}
              onClick={toggleContextMenu}
              ref={menuButtonRef}
            >
              <Icon type="more" className="text-neutral" />
            </a>
            <div className="count">{noteCounts.get()}</div>
          </div>
        </div>

        <div className={`meta ${hasAtLeastOneFolder ? 'with-folders' : ''}`}>
          {tag.conflictOf && <div className="danger text-[0.625rem] font-bold">Conflicted Copy {tag.conflictOf}</div>}
        </div>
      </div>
      {isAddingSubtag && (
        <div
          className="tag overflow-hidden"
          style={{
            paddingLeft: `${(level + 1) * PADDING_PER_LEVEL_PX + PADDING_BASE_PX}px`,
          }}
        >
          <div className="tag-info">
            <div className="flex h-full min-w-[22px] items-center border-0 bg-transparent p-0" />
            <div className="tag-icon mr-1">
              <Icon type="hashtag" className="mr-1 text-neutral" />
            </div>
            <input
              className="title w-full focus:shadow-none focus:outline-none"
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
            )
          })}
        </>
      )}
    </>
  )
})

TagsListItem.displayName = 'TagsListItem'
