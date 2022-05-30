import { AppState } from '@/UIModels/AppState'
import { calculateSubmenuStyle, SubmenuStyle } from '@/Utils/CalculateSubmenuStyle'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'

type Props = {
  appState: AppState
}

const AddTagOption: FunctionComponent<Props> = ({ appState }) => {
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
          {appState.tags.tags.map((tag) => (
            <button
              key={tag.uuid}
              className="sn-dropdown-item sn-dropdown-item--no-icon max-w-80"
              onBlur={closeOnBlur}
              onClick={() => {
                appState.notes.isTagInSelectedNotes(tag)
                  ? appState.notes.removeTagFromSelectedNotes(tag).catch(console.error)
                  : appState.notes.addTagToSelectedNotes(tag).catch(console.error)
              }}
            >
              <span
                className={`whitespace-nowrap overflow-hidden overflow-ellipsis
                      ${appState.notes.isTagInSelectedNotes(tag) ? 'font-bold' : ''}`}
              >
                {appState.noteTags.getLongTitle(tag)}
              </span>
            </button>
          ))}
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}

export default observer(AddTagOption)
