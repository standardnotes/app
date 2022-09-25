import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { observer } from 'mobx-react-lite'
import { useCallback, useRef, useState } from 'react'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'

type Props = {
  noteTagsController: NoteTagsController
  onClickPreprocessing?: () => Promise<void>
}

const NoteTagsPanel = ({ noteTagsController, onClickPreprocessing }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { tags } = noteTagsController

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsOpen(willMenuOpen)
  }, [onClickPreprocessing, isOpen])

  return (
    <>
      <button
        className="bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast"
        title="Note options menu"
        aria-label="Note options menu"
        onClick={toggleMenu}
        ref={buttonRef}
      >
        <Icon type="hashtag" />
      </button>
      <Popover togglePopover={toggleMenu} anchorElement={buttonRef.current} open={isOpen} className="pb-2">
        <div className="sticky top-0 border-b border-border bg-default px-2.5 py-2.5">
          <input
            type="text"
            className="w-full rounded border border-solid border-border bg-default py-1.5 px-3 text-sm text-text"
            placeholder="Create or search tag..."
            // value={searchQuery}
            onInput={(e) => {
              // setSearchQuery((e.target as HTMLInputElement).value)
            }}
            // ref={searchInputRef}
          />
        </div>
        <div>
          {tags.map((tag) => (
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
          ))}
        </div>
      </Popover>
    </>
  )
}

export default observer(NoteTagsPanel)
