import { calculateSubmenuStyle, SubmenuStyle } from '@/Utils/CalculateSubmenuStyle'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController'
import { NoteTagsController } from '@/Controllers/NoteTagsController'

type Props = {
  navigationController: NavigationController
  notesController: NotesController
  noteTagsController: NoteTagsController
}

const AddTagOption: FunctionComponent<Props> = ({ navigationController, notesController, noteTagsController }) => {
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>({
    right: 0,
    bottom: 0,
    maxHeight: 'auto',
  })

  const [closeOnBlur] = useCloseOnBlur(menuContainerRef, setIsMenuOpen)

  const toggleTagsMenu = useCallback(() => {
    if (!isMenuOpen) {
      const menuPosition = calculateSubmenuStyle(menuButtonRef.current)
      if (menuPosition) {
        setMenuStyle(menuPosition)
      }
    }

    setIsMenuOpen(!isMenuOpen)
  }, [isMenuOpen])

  const recalculateMenuStyle = useCallback(() => {
    const newMenuPosition = calculateSubmenuStyle(menuButtonRef.current, menuRef.current)

    if (newMenuPosition) {
      setMenuStyle(newMenuPosition)
    }
  }, [])

  useEffect(() => {
    if (isMenuOpen) {
      setTimeout(() => {
        recalculateMenuStyle()
      })
    }
  }, [isMenuOpen, recalculateMenuStyle])

  return (
    <div ref={menuContainerRef}>
      <Disclosure open={isMenuOpen} onChange={toggleTagsMenu}>
        <DisclosureButton
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsMenuOpen(false)
            }
          }}
          onBlur={closeOnBlur}
          ref={menuButtonRef}
          className="sn-dropdown-item justify-between"
        >
          <div className="flex items-center">
            <Icon type="hashtag" className="mr-2 color-neutral" />
            Add tag
          </div>
          <Icon type="chevron-right" className="color-neutral" />
        </DisclosureButton>
        <DisclosurePanel
          ref={menuRef}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsMenuOpen(false)
              menuButtonRef.current?.focus()
            }
          }}
          style={{
            ...menuStyle,
            position: 'fixed',
          }}
          className="sn-dropdown min-w-80 flex flex-col py-2 max-h-120 max-w-xs fixed overflow-y-auto"
        >
          {navigationController.tags.map((tag) => (
            <button
              key={tag.uuid}
              className="sn-dropdown-item sn-dropdown-item--no-icon max-w-80"
              onBlur={closeOnBlur}
              onClick={() => {
                notesController.isTagInSelectedNotes(tag)
                  ? notesController.removeTagFromSelectedNotes(tag).catch(console.error)
                  : notesController.addTagToSelectedNotes(tag).catch(console.error)
              }}
            >
              <span
                className={`whitespace-nowrap overflow-hidden overflow-ellipsis
                      ${notesController.isTagInSelectedNotes(tag) ? 'font-bold' : ''}`}
              >
                {noteTagsController.getLongTitle(tag)}
              </span>
            </button>
          ))}
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}

export default observer(AddTagOption)
