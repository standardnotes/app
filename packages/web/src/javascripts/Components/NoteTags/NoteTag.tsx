import Icon from '@/Components/Icon/Icon'
import {
  FocusEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'

type Props = {
  viewControllerManager: ViewControllerManager
  tag: SNTag
}

const NoteTag = ({ viewControllerManager, tag }: Props) => {
  const { toggleAppPane } = useResponsiveAppPane()

  const noteTags = viewControllerManager.noteTagsController

  const { autocompleteInputFocused, focusedTagUuid, tags } = noteTags

  const [showDeleteButton, setShowDeleteButton] = useState(false)
  const [tagClicked, setTagClicked] = useState(false)
  const deleteTagRef = useRef<HTMLAnchorElement>(null)

  const tagRef = useRef<HTMLButtonElement>(null)

  const title = tag.title
  const prefixTitle = noteTags.getPrefixTitle(tag)
  const longTitle = noteTags.getLongTitle(tag)

  const deleteTag = useCallback(() => {
    viewControllerManager.noteTagsController.focusPreviousTag(tag)
    viewControllerManager.noteTagsController.removeTagFromActiveNote(tag).catch(console.error)
  }, [viewControllerManager, tag])

  const onDeleteTagClick: MouseEventHandler = useCallback(
    (event) => {
      event.stopPropagation()
      deleteTag()
    },
    [deleteTag],
  )

  const onTagClick: MouseEventHandler = useCallback(
    async (event) => {
      if (tagClicked && event.target !== deleteTagRef.current) {
        setTagClicked(false)
        await viewControllerManager.navigationController.setSelectedTag(tag)
        toggleAppPane(AppPaneId.Items)
      } else {
        setTagClicked(true)
        tagRef.current?.focus()
      }
    },
    [viewControllerManager, tagClicked, tag],
  )

  const onFocus = useCallback(() => {
    viewControllerManager.noteTagsController.setFocusedTagUuid(tag.uuid)
    setShowDeleteButton(true)
  }, [viewControllerManager, tag])

  const onBlur: FocusEventHandler = useCallback(
    (event) => {
      const relatedTarget = event.relatedTarget as Node
      if (relatedTarget !== deleteTagRef.current) {
        viewControllerManager.noteTagsController.setFocusedTagUuid(undefined)
        setShowDeleteButton(false)
      }
    },
    [viewControllerManager],
  )

  const getTabIndex = useCallback(() => {
    if (focusedTagUuid) {
      return focusedTagUuid === tag.uuid ? 0 : -1
    }
    if (autocompleteInputFocused) {
      return -1
    }
    return tags[0]?.uuid === tag.uuid ? 0 : -1
  }, [autocompleteInputFocused, tags, tag, focusedTagUuid])

  const onKeyDown: KeyboardEventHandler = useCallback(
    (event) => {
      const tagIndex = viewControllerManager.noteTagsController.getTagIndex(tag, tags)
      switch (event.key) {
        case 'Backspace':
          deleteTag()
          break
        case 'ArrowLeft':
          viewControllerManager.noteTagsController.focusPreviousTag(tag)
          break
        case 'ArrowRight':
          if (tagIndex === tags.length - 1) {
            viewControllerManager.noteTagsController.setAutocompleteInputFocused(true)
          } else {
            viewControllerManager.noteTagsController.focusNextTag(tag)
          }
          break
        default:
          return
      }
    },
    [viewControllerManager, deleteTag, tag, tags],
  )

  useEffect(() => {
    if (focusedTagUuid === tag.uuid) {
      tagRef.current?.focus()
    }
  }, [viewControllerManager, focusedTagUuid, tag])

  return (
    <button
      ref={tagRef}
      className="mt-2 mr-2 flex h-6 cursor-pointer items-center rounded border-0 bg-passive-4-opacity-variant py-2 pl-1 pr-2 text-xs text-text hover:bg-contrast focus:bg-contrast"
      onClick={onTagClick}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={getTabIndex()}
      title={longTitle}
    >
      <Icon type="hashtag" className="mr-1 text-info" size="small" />
      <span className="max-w-290px overflow-hidden overflow-ellipsis whitespace-nowrap">
        {prefixTitle && <span className="text-passive-1">{prefixTitle}</span>}
        {title}
      </span>
      {showDeleteButton && (
        <a
          ref={deleteTagRef}
          role="button"
          className="ml-2 -mr-1 flex cursor-pointer border-0 bg-transparent p-0"
          onBlur={onBlur}
          onClick={onDeleteTagClick}
          tabIndex={-1}
        >
          <Icon type="close" className="text-neutral hover:text-info" size="small" />
        </a>
      )}
    </button>
  )
}

export default observer(NoteTag)
