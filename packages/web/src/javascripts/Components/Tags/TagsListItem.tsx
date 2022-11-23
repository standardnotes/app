import Icon from '@/Components/Icon/Icon'
import { FOCUSABLE_BUT_NOT_TABBABLE, TAG_FOLDERS_FEATURE_NAME } from '@/Constants/Constants'
import { KeyboardKey } from '@standardnotes/ui-services'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import '@reach/tooltip/styles.css'
import { IconType, SNTag } from '@standardnotes/snjs'
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
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { classNames } from '@standardnotes/utils'
import { useFileDragNDrop } from '../FileDragNDropProvider/FileDragNDropProvider'
import { LinkingController } from '@/Controllers/LinkingController'
import { TagListSectionType } from './TagListSection'
import { log, LoggingDomain } from '@/Logging'
import { TagDragDataFormat } from './DragNDrop'
import { usePremiumModal } from '@/Hooks/usePremiumModal'

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

    const [title, setTitle] = useState(tag.title || '')
    const [subtagTitle, setSubtagTitle] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const subtagInputRef = useRef<HTMLInputElement>(null)
    const menuButtonRef = useRef<HTMLAnchorElement>(null)

    const isSelected = navigationController.selected === tag && navigationController.selectedLocation === type
    const isEditing = navigationController.editingTag === tag && navigationController.selectedLocation === type
    const isAddingSubtag = navigationController.addingSubtagTo === tag && navigationController.selectedLocation === type
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
      await navigationController.setSelectedTag(tag, type, {
        userTriggered: true,
      })
      toggleAppPane(AppPaneId.Items)
    }, [navigationController, tag, type, toggleAppPane])

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

    const onDragStart: DragEventHandler<HTMLDivElement> = useCallback(
      (event) => {
        event.dataTransfer.setData(TagDragDataFormat, tag.uuid)
      },
      [tag.uuid],
    )

    const onDragEnter: DragEventHandler<HTMLDivElement> = useCallback((event): void => {
      if (event.dataTransfer.types.includes(TagDragDataFormat)) {
        event.preventDefault()
        setIsBeingDraggedOver(true)
      }
    }, [])

    const removeDragIndicator = useCallback(() => {
      setIsBeingDraggedOver(false)
    }, [])

    const onDragOver: DragEventHandler<HTMLDivElement> = useCallback((event): void => {
      if (event.dataTransfer.types.includes(TagDragDataFormat)) {
        event.preventDefault()
      }
    }, [])

    const onDrop: DragEventHandler<HTMLDivElement> = useCallback(
      (event): void => {
        setIsBeingDraggedOver(false)
        const draggedTagUuid = event.dataTransfer.getData(TagDragDataFormat)
        if (!draggedTagUuid) {
          return
        }
        if (!navigationController.isValidTagParent(tag, { uuid: draggedTagUuid } as SNTag)) {
          return
        }
        if (!hasFolders) {
          premiumModal.activate(TAG_FOLDERS_FEATURE_NAME)
          return
        }
        if (draggedTagUuid) {
          void navigationController.assignParent(draggedTagUuid, tag.uuid)
        }
      },
      [hasFolders, navigationController, premiumModal, tag],
    )

    return (
      <>
        <div
          role="button"
          tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
          className={classNames('tag px-3.5', isSelected && 'selected', isBeingDraggedOver && 'is-drag-over')}
          onClick={selectCurrentTag}
          ref={tagRef}
          style={{
            paddingLeft: `${level * PADDING_PER_LEVEL_PX + PADDING_BASE_PX}px`,
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            onContextMenu(tag, e.clientX, e.clientY)
          }}
          draggable={true}
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
                className={`cursor-pointer ${isSelected ? 'text-info' : 'text-neutral'}`}
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
