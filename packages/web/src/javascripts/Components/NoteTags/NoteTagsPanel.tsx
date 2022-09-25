import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { MediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { splitQueryInString } from '@/Utils'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, FormEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'

type Props = {
  noteTagsController: NoteTagsController
  onClickPreprocessing?: () => Promise<void>
}

const NoteTagsPanel = ({ noteTagsController, onClickPreprocessing }: Props) => {
  const isDesktopScreen = useMediaQuery(MediaQueryBreakpoints.md)

  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { tags, autocompleteTagResults, autocompleteSearchQuery, autocompleteTagHintVisible } = noteTagsController
  const isSearching = autocompleteSearchQuery.length > 0
  const visibleTagsList = isSearching ? autocompleteTagResults : tags

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsOpen(willMenuOpen)
  }, [onClickPreprocessing, isOpen])

  const onSearchQueryChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const query = event.target.value

    if (query === '') {
      noteTagsController.clearAutocompleteSearch()
    } else {
      noteTagsController.setAutocompleteSearchQuery(query)
      noteTagsController.searchActiveNoteAutocompleteTags()
    }
  }

  const onFormSubmit: FormEventHandler = async (event) => {
    event.preventDefault()
    if (autocompleteSearchQuery !== '') {
      await noteTagsController.createAndAddNewTag()
    }
  }

  useEffect(() => {
    if (isDesktopScreen) {
      setIsOpen(false)
    }
  }, [isDesktopScreen])

  return (
    <>
      <button
        className="bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast md:hidden"
        title="Note options menu"
        aria-label="Note options menu"
        onClick={toggleMenu}
        ref={buttonRef}
      >
        <Icon type="hashtag" />
      </button>
      <Popover togglePopover={toggleMenu} anchorElement={buttonRef.current} open={isOpen} className="pb-2">
        <form onSubmit={onFormSubmit} className="sticky top-0 border-b border-border bg-default px-2.5 py-2.5">
          <input
            type="text"
            className="w-full rounded border border-solid border-border bg-default py-1.5 px-3 text-sm text-text"
            placeholder="Create or search tag..."
            value={autocompleteSearchQuery}
            onChange={onSearchQueryChange}
            ref={(node) => {
              if (isOpen && node) {
                node.focus()
              }
            }}
          />
        </form>
        <div className="pt-2.5">
          {visibleTagsList.map((tag) => {
            return isSearching ? (
              <button
                onClick={async () => {
                  await noteTagsController.addTagToActiveNote(tag)
                  noteTagsController.clearAutocompleteSearch()
                  noteTagsController.setAutocompleteInputFocused(true)
                }}
                className="max-w-80 flex w-full items-center border-0 bg-transparent px-3 py-2 text-left text-menu-item text-text hover:bg-info-backdrop focus:bg-info-backdrop"
              >
                {splitQueryInString(noteTagsController.getLongTitle(tag), autocompleteSearchQuery).map(
                  (substring, index) => (
                    <span
                      key={index}
                      className={`${
                        substring.toLowerCase() === autocompleteSearchQuery.toLowerCase()
                          ? 'whitespace-pre-wrap font-bold'
                          : 'whitespace-pre-wrap '
                      }`}
                    >
                      {substring}
                    </span>
                  ),
                )}
              </button>
            ) : (
              <div
                key={tag.uuid}
                className="max-w-80 flex w-full items-center justify-between border-0 bg-transparent px-3 py-2 text-left text-menu-item text-text"
              >
                <span className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                  {noteTagsController.getLongTitle(tag)}
                </span>
                <button
                  onClick={() => {
                    noteTagsController.removeTagFromActiveNote(tag).catch(console.error)
                  }}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-danger hover:bg-info-backdrop focus:bg-info-backdrop"
                >
                  <Icon type="trash" size="small" />
                </button>
              </div>
            )
          })}
          {autocompleteTagHintVisible && (
            <button
              onClick={async () => {
                await noteTagsController.createAndAddNewTag()
              }}
              className="max-w-80 flex w-full items-center border-0 bg-transparent px-3 py-2 text-left text-menu-item text-text hover:bg-info-backdrop focus:bg-info-backdrop"
            >
              <span>Create new tag:</span>
              <span className="ml-2 flex items-center rounded bg-contrast py-1 pl-1 pr-2 text-xs text-text">
                <Icon type="hashtag" className="mr-1 text-neutral" size="small" />
                <span className="max-w-40 overflow-hidden overflow-ellipsis whitespace-nowrap">
                  {autocompleteSearchQuery}
                </span>
              </span>
            </button>
          )}
        </div>
      </Popover>
    </>
  )
}

export default observer(NoteTagsPanel)
