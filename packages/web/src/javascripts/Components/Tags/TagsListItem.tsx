import Icon from '@/Components/Icon/Icon'
import { FOCUSABLE_BUT_NOT_TABBABLE, TAG_FOLDERS_FEATURE_NAME } from '@/Constants/Constants'
import { KeyboardKey } from '@standardnotes/ui-services'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { IconType, SNNote, SNTag } from '@standardnotes/snjs'
import { computed } from 'mobx'
import { observer } from 'mobx-react-lite'
import {
  DragEventHandler,
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
import { classNames } from '@standardnotes/utils'
import { useFileDragNDrop } from '../FileDragNDropProvider'
import { LinkingController } from '@/Controllers/LinkingController'
import { TagListSectionType } from './TagListSection'
import { log, LoggingDomain } from '@/Logging'
import { NoteDragDataFormat, TagDragDataFormat } from './DragNDrop'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { useApplication } from '../ApplicationProvider'

type Props = {
  tag: SNTag
  type: TagListSectionType
  navigationController: NavigationController
  features: FeaturesController
  linkingController: LinkingController
  level: number
  onContextMenu: (tag: SNTag, section: TagListSectionType, posX: number, posY: number) => void
}

const PADDING_BASE_PX = 14
const PADDING_PER_LEVEL_PX = 21

export const TagsListItem: FunctionComponent<Props> = observer(
  ({ tag, type, features, navigationController, level, onContextMenu, linkingController }) => {
    const application = useApplication()

    const [title, setTitle] = useState(tag.title || '')
    const [subtagTitle, setSubtagTitle] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const subtagInputRef = useRef<HTMLInputElement>(null)
    const menuButtonRef = useRef<HTMLAnchorElement>(null)

    const isContextMenuOpenForTag =
      navigationController.contextMenuTag === tag &&
      navigationController.contextMenuOpen &&
      navigationController.contextMenuTagSection === type
    const isSelected = navigationController.selected === tag && navigationController.selectedLocation === type
    const isEditing = navigationController.editingTag === tag && navigationController.selectedLocation === type
    const isAddingSubtag =
      navigationController.addingSubtagTo === tag &&
      (navigationController.contextMenuTag === tag
        ? navigationController.contextMenuTagSection === type
        : navigationController.selectedLocation === type)
    const noteCounts = computed(() => navigationController.getNotesCount(tag))

    const childrenTags = computed(() => navigationController.getChildren(tag)).get()
    const hasChildren = childrenTags.length > 0

    const hasFolders = features.hasFolders

    const premiumModal = usePremiumModal()

    const [showChildren, setShowChildren] = useState(tag.expanded)
    const [hadChildren, setHadChildren] = useState(hasChildren)

    const [isBeingDraggedOver, setIsBeingDraggedOver] = useState(false)

    useEffect(() => {
      if (!hadChildren && hasChildren) {
        setShowChildren(true)
      }
      setHadChildren(hasChildren)
    }, [hadChildren, hasChildren])

    useEffect(() => {
      setTitle(tag.title || '')
    }, [setTitle, tag])

    const setTagExpanded = useCallback(
      (expanded: boolean) => {
        if (!hasChildren) {
          return
        }
        setShowChildren(expanded)
        if (!navigationController.isSearching) {
          navigationController.setExpanded(tag, expanded)
        }
      },
      [hasChildren, navigationController, tag],
    )

    const toggleChildren = useCallback(
      (e?: MouseEvent) => {
        e?.stopPropagation()
        const shouldShowChildren = !showChildren
        setTagExpanded(shouldShowChildren)
      },
      [showChildren, setTagExpanded],
    )

    useEffect(() => {
      if (!navigationController.isSearching) {
        setShowChildren(tag.expanded)
      }
    }, [navigationController.isSearching, tag])

    const selectCurrentTag = useCallback(async () => {
      await navigationController.setSelectedTag(tag, type, {
        userTriggered: true,
      })
    }, [navigationController, tag, type])

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
          onContextMenu(tag, type, menuButtonRect.right, menuButtonRect.top)
        }
      },
      [navigationController, onContextMenu, tag, type],
    )

    const tagRef = useRef<HTMLDivElement>(null)

    const { addDragTarget, removeDragTarget } = useFileDragNDrop()

    useEffect(() => {
      const target = tagRef.current

      if (target) {
        addDragTarget(target, {
          tooltipText: `Drop your files to upload and link them to tag "${tag.title}"`,
          async callback(file) {
            await linkingController.linkItems(file, tag)
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

    const onDragStart: DragEventHandler<HTMLDivElement> = useCallback(
      (event) => {
        event.dataTransfer.setData(TagDragDataFormat, tag.uuid)
      },
      [tag.uuid],
    )

    const onDragEnter: DragEventHandler<HTMLDivElement> = useCallback((event): void => {
      if (
        event.dataTransfer.types.includes(TagDragDataFormat) ||
        event.dataTransfer.types.includes(NoteDragDataFormat)
      ) {
        event.preventDefault()
        setIsBeingDraggedOver(true)
      }
    }, [])

    const removeDragIndicator = useCallback(() => {
      setIsBeingDraggedOver(false)
    }, [])

    const onDragOver: DragEventHandler<HTMLDivElement> = useCallback((event): void => {
      if (
        event.dataTransfer.types.includes(TagDragDataFormat) ||
        event.dataTransfer.types.includes(NoteDragDataFormat)
      ) {
        event.preventDefault()
      }
    }, [])

    const onDrop: DragEventHandler<HTMLDivElement> = useCallback(
      async (event) => {
        setIsBeingDraggedOver(false)
        const draggedTagUuid = event.dataTransfer.getData(TagDragDataFormat)
        const draggedNoteUuid = event.dataTransfer.getData(NoteDragDataFormat)
        if (draggedTagUuid) {
          if (!navigationController.isValidTagParent(tag, { uuid: draggedTagUuid } as SNTag)) {
            return
          }
          if (!hasFolders) {
            premiumModal.activate(TAG_FOLDERS_FEATURE_NAME)
            return
          }

          void navigationController.assignParent(draggedTagUuid, tag.uuid)
          return
        } else if (draggedNoteUuid) {
          const currentTag = navigationController.selected
          const shouldSwapTags = currentTag instanceof SNTag && currentTag.uuid !== tag.uuid
          const note = application.items.findSureItem<SNNote>(draggedNoteUuid)
          await linkingController.linkItems(note, tag)
          if (shouldSwapTags) {
            await linkingController.unlinkItems(note, currentTag)
          }
          return
        }
      },
      [application.items, hasFolders, linkingController, navigationController, premiumModal, tag],
    )

    return (
      <>
        <div
          role="button"
          tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
          className={classNames(
            'tag group px-3.5 py-0.5 focus-visible:!shadow-inner md:py-0',
            (isSelected || isContextMenuOpenForTag) && 'selected',
            isBeingDraggedOver && 'is-drag-over',
          )}
          onClick={selectCurrentTag}
          onKeyDown={(event) => {
            if (event.key === KeyboardKey.Enter || event.key === KeyboardKey.Space) {
              selectCurrentTag().catch(console.error)
            } else if (event.key === KeyboardKey.Left) {
              setTagExpanded(false)
            } else if (event.key === KeyboardKey.Right) {
              setTagExpanded(true)
            }
          }}
          ref={tagRef}
          style={{
            paddingLeft: `${level * PADDING_PER_LEVEL_PX + PADDING_BASE_PX}px`,
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            onContextMenu(tag, type, e.clientX, e.clientY)
          }}
          draggable={!navigationController.isSearching}
          onDragStart={onDragStart}
          onDragEnter={onDragEnter}
          onDragExit={removeDragIndicator}
          onDragOver={onDragOver}
          onDragLeave={removeDragIndicator}
          onDrop={onDrop}
        >
          <div className="tag-info" title={title}>
            <div onClick={selectCurrentTag} className={'tag-icon draggable mr-2'}>
              <Icon
                type={tag.iconString as IconType}
                className={classNames(
                  'cursor-pointer group-hover:text-text',
                  isSelected ? 'text-info' : 'text-neutral',
                )}
              />
            </div>

            {isEditing && (
              <input
                className={
                  'title editing overflow-hidden text-mobile-navigation-list-item focus:shadow-none focus:outline-none lg:text-navigation-list-item'
                }
                id={`react-tag-${tag.uuid}-${type}`}
                onBlur={onBlur}
                onInput={onInput}
                value={title}
                onKeyDown={onKeyDown}
                spellCheck={false}
                ref={inputRef}
              />
            )}

            {!isEditing && (
              <>
                <div
                  className={
                    'title overflow-hidden text-left text-mobile-navigation-list-item focus:shadow-none focus:outline-none lg:text-navigation-list-item'
                  }
                  id={`react-tag-${tag.uuid}-${type}`}
                >
                  {title}
                </div>
              </>
            )}

            <div className="flex items-center">
              {isSelected && (
                <a
                  role="button"
                  className={'mr-2 cursor-pointer border-0 bg-transparent hover:bg-contrast focus:shadow-inner'}
                  onClick={toggleContextMenu}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  ref={menuButtonRef}
                >
                  <Icon type="more" className="text-neutral" />
                </a>
              )}

              {hasChildren && (
                <a
                  role="button"
                  className={`focus:shadow-inner ${showChildren ? 'cursor-n-resize' : 'cursor-s-resize'} ${
                    showChildren ? 'opened' : 'closed'
                  } `}
                  onClick={toggleChildren}
                >
                  <Icon
                    className={'text-neutral'}
                    size="large"
                    type={showChildren ? 'menu-arrow-down-alt' : 'menu-arrow-right'}
                  />
                </a>
              )}
              <div
                onClick={hasChildren ? toggleChildren : undefined}
                className={`count text-base lg:text-sm ${
                  hasChildren ? (showChildren ? 'cursor-n-resize' : 'cursor-s-resize') : ''
                }`}
              >
                {noteCounts.get()}
              </div>
            </div>
          </div>

          {tag.conflictOf && <div className="-mt-1 text-[0.625rem] font-bold text-danger">Conflicted Copy</div>}
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
