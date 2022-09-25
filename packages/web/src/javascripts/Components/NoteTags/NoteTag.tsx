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
import { SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'

type Props = {
  noteTagsController: NoteTagsController
  navigationController: NavigationController
  tag: SNTag
}

const NoteTag = ({ noteTagsController, navigationController, tag }: Props) => {
  const { toggleAppPane } = useResponsiveAppPane()

  const noteTags = noteTagsController

  const { autocompleteInputFocused, focusedTagUuid, tags } = noteTags

  const [showDeleteButton, setShowDeleteButton] = useState(false)
  const [tagClicked, setTagClicked] = useState(false)
  const deleteTagRef = useRef<HTMLAnchorElement>(null)

  const tagRef = useRef<HTMLButtonElement>(null)

  const title = tag.title
  const prefixTitle = noteTags.getPrefixTitle(tag)
  const longTitle = noteTags.getLongTitle(tag)

  const deleteTag = useCallback(() => {
    noteTagsController.focusPreviousTag(tag)
    noteTagsController.removeTagFromActiveNote(tag).catch(console.error)
  }, [noteTagsController, tag])

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
        await navigationController.setSelectedTag(tag)
        toggleAppPane(AppPaneId.Items)
      } else {
        setTagClicked(true)
        tagRef.current?.focus()
      }
    },
    [tagClicked, navigationController, tag, toggleAppPane],
  )

  const onFocus = useCallback(() => {
    noteTagsController.setFocusedTagUuid(tag.uuid)
    setShowDeleteButton(true)
  }, [noteTagsController, tag])

  const onBlur: FocusEventHandler = useCallback(
    (event) => {
      const relatedTarget = event.relatedTarget as Node
      if (relatedTarget !== deleteTagRef.current) {
        noteTagsController.setFocusedTagUuid(undefined)
        setShowDeleteButton(false)
      }
    },
    [noteTagsController],
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
      const tagIndex = noteTagsController.getTagIndex(tag, tags)
      switch (event.key) {
        case 'Backspace':
          deleteTag()
          break
        case 'ArrowLeft':
          noteTagsController.focusPreviousTag(tag)
          break
        case 'ArrowRight':
          if (tagIndex === tags.length - 1) {
            noteTagsController.setAutocompleteInputFocused(true)
          } else {
            noteTagsController.focusNextTag(tag)
          }
          break
        default:
          return
      }
    },
    [noteTagsController, deleteTag, tag, tags],
  )

  useEffect(() => {
    if (focusedTagUuid === tag.uuid) {
      tagRef.current?.focus()
    }
  }, [noteTagsController, focusedTagUuid, tag])

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
