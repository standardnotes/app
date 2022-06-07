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
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'

type Props = {
  viewControllerManager: ViewControllerManager
  tag: SNTag
}

const NoteTag = ({ viewControllerManager, tag }: Props) => {
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
    (event) => {
      if (tagClicked && event.target !== deleteTagRef.current) {
        setTagClicked(false)
        void viewControllerManager.navigationController.setSelectedTag(tag)
      } else {
        setTagClicked(true)
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
    return tags[0].uuid === tag.uuid ? 0 : -1
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
      className="sn-tag pl-1 pr-2 mr-2"
      onClick={onTagClick}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={getTabIndex()}
      title={longTitle}
    >
      <Icon type="hashtag" className="sn-icon--small color-info mr-1" />
      <span className="whitespace-nowrap overflow-hidden overflow-ellipsis max-w-290px">
        {prefixTitle && <span className="color-passive-1">{prefixTitle}</span>}
        {title}
      </span>
      {showDeleteButton && (
        <a
          ref={deleteTagRef}
          type="button"
          className="ml-2 -mr-1 border-0 p-0 bg-transparent cursor-pointer flex"
          onBlur={onBlur}
          onClick={onDeleteTagClick}
          tabIndex={-1}
        >
          <Icon type="close" className="sn-icon--small color-neutral hover:color-info" />
        </a>
      )}
    </button>
  )
}

export default observer(NoteTag)
