import Icon from '@/Components/Icon/Icon'
import { FOCUSABLE_BUT_NOT_TABBABLE, TAG_FOLDERS_FEATURE_NAME } from '@/Constants/Constants'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { KeyboardKey } from '@standardnotes/ui-services'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import '@reach/tooltip/styles.css'
import { IconType, SNTag } from '@standardnotes/snjs'
import { computed } from 'mobx'
import { observer } from 'mobx-react-lite'
import {
  FormEventHandler,
  FunctionComponent,
  KeyboardEventHandler,
  MouseEvent,
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
import { LinkingController } from '@/Controllers/LinkingController'
import { TagListSectionType } from './TagListSection'
import { log, LoggingDomain } from '@/Logging'

type Props = {
  tag: SNTag
  type: TagListSectionType
  navigationController: NavigationController
  features: FeaturesController
  linkingController: LinkingController
  level: number
  onContextMenu: (tag: SNTag, posX: number, posY: number) => void
}

const PADDING_BASE_PX = 14
const PADDING_PER_LEVEL_PX = 21

export const TagsListItem: FunctionComponent<Props> = observer(
  ({ tag, type, features, navigationController: navigationController, level, onContextMenu, linkingController }) => {
    const { toggleAppPane } = useResponsiveAppPane()

    const isFavorite = type === 'favorites'

    const [title, setTitle] = useState(tag.title || '')
    const [subtagTitle, setSubtagTitle] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const subtagInputRef = useRef<HTMLInputElement>(null)
    const menuButtonRef = useRef<HTMLAnchorElement>(null)

    const isSelected = navigationController.selected === tag
    const isEditing = navigationController.editingTag === tag && navigationController.editingFrom === type
    const isAddingSubtag = navigationController.addingSubtagTo === tag
    const noteCounts = computed(() => navigationController.getNotesCount(tag))

    const childrenTags = computed(() => navigationController.getChildren(tag)).get()
    const hasChildren = childrenTags.length > 0

    const hasFolders = features.hasFolders
    const hasAtLeastOneFolder = navigationController.hasAtLeastOneFolder

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

    const toggleChildren = useCallback(
      (e?: MouseEvent) => {
        e?.stopPropagation()
        const shouldShowChildren = !showChildren
        setShowChildren(shouldShowChildren)
        navigationController.setExpanded(tag, shouldShowChildren)
      },
      [showChildren, tag, navigationController],
    )

    const selectCurrentTag = useCallback(async () => {
      await navigationController.setSelectedTag(tag, {
        userTriggered: true,
      })
      toggleChildren()
      toggleAppPane(AppPaneId.Items)
    }, [navigationController, tag, toggleAppPane, toggleChildren])

    const onBlur = useCallback(() => {
      navigationController.save(tag, title).catch(console.error)
      setTitle(tag.title)
    }, [navigationController, tag, title, setTitle])

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
      navigationController.createSubtagAndAssignParent(tag, subtagTitle).catch(console.error)
      setSubtagTitle('')
    }, [subtagTitle, tag, navigationController])

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
          return navigationController.isValidTagParent(tag, item as SNTag)
        },
        drop: (item) => {
          if (!hasFolders) {
            premiumModal.activate(TAG_FOLDERS_FEATURE_NAME)
            return
          }
          navigationController.assignParent(item.uuid, tag.uuid).catch(console.error)
        },
        collect: (monitor) => ({
          isOver: !!monitor.isOver(),
          canDrop: !!monitor.canDrop(),
        }),
      }),
      [tag, navigationController, hasFolders, premiumModal],
    )

    const readyToDrop = isOver && canDrop

    const toggleContextMenu: MouseEventHandler<HTMLAnchorElement> = useCallback(
      (event) => {
        event.preventDefault()
        event.stopPropagation()

        if (!menuButtonRef.current) {
          return
        }

        const contextMenuOpen = navigationController.contextMenuOpen
        const menuButtonRect = menuButtonRef.current?.getBoundingClientRect()

        if (contextMenuOpen) {
          navigationController.setContextMenuOpen(false)
        } else {
          onContextMenu(tag, menuButtonRect.right, menuButtonRect.top)
        }
      },
      [onContextMenu, navigationController, tag],
    )

    const tagRef = useRef<HTMLDivElement>(null)

    const { addDragTarget, removeDragTarget } = useFileDragNDrop()

    useEffect(() => {
      const target = tagRef.current

      if (target) {
        addDragTarget(target, {
          tooltipText: `Drop your files to upload and link them to tag "${tag.title}"`,
          callback(files) {
            files.forEach(async (file) => {
              await linkingController.linkItems(file, tag)
            })
          },
        })
      }

      return () => {
        if (target) {
          removeDragTarget(target)
        }
      }
    }, [addDragTarget, linkingController, removeDragTarget, tag])

    log(LoggingDomain.NavigationList, 'Rendering TagsListItem')

    return (
      <>
        <div
          role="button"
          tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
          className={classNames('tag px-3.5', isSelected && 'selected', readyToDrop && 'is-drag-over')}
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
            {hasAtLeastOneFolder && !isFavorite && (
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
              <Icon type={tag.iconString as IconType} className={`${isSelected ? 'text-info' : 'text-neutral'}`} />
            </div>
            {isEditing ? (
              <input
                className={
                  'title editing text-mobile-navigation-list-item focus:shadow-none focus:outline-none lg:text-navigation-list-item'
                }
                id={`react-tag-${tag.uuid}-${type}`}
                onBlur={onBlur}
                onInput={onInput}
                value={title}
                onKeyDown={onKeyDown}
                spellCheck={false}
                ref={inputRef}
              />
            ) : (
              <div
                className={
                  'title overflow-hidden text-left text-mobile-navigation-list-item focus:shadow-none focus:outline-none lg:text-navigation-list-item'
                }
                id={`react-tag-${tag.uuid}-${type}`}
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
              <div className="count text-base lg:text-sm">{noteCounts.get()}</div>
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
                className="title w-full text-mobile-navigation-list-item focus:shadow-none focus:outline-none lg:text-navigation-list-item"
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
                  type={type}
                  navigationController={navigationController}
                  features={features}
                  linkingController={linkingController}
                  onContextMenu={onContextMenu}
                />
              )
            })}
          </>
        )}
      </>
    )
  },
)

TagsListItem.displayName = 'TagsListItem'
