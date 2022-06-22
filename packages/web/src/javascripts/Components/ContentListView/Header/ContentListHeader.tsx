import { WebApplication } from '@/Application/Application'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { memo, useCallback, useRef, useState } from 'react'
import Icon from '../../Icon/Icon'
import { DisplayOptionsMenuPositionProps } from './DisplayOptionsMenuProps'
import DisplayOptionsMenuPortal from './DisplayOptionsMenuPortal'

type Props = {
  application: {
    getPreference: WebApplication['getPreference']
    setPreference: WebApplication['setPreference']
  }
  panelTitle: string
  addButtonLabel: string
  addNewItem: () => void
  isFilesSmartView: boolean
}

const ContentListHeader = ({ application, panelTitle, addButtonLabel, addNewItem, isFilesSmartView }: Props) => {
  const [displayOptionsMenuPosition, setDisplayOptionsMenuPosition] = useState<DisplayOptionsMenuPositionProps>()
  const displayOptionsMenuRef = useRef<HTMLDivElement>(null)
  const displayOptionsButtonRef = useRef<HTMLButtonElement>(null)

  const [showDisplayOptionsMenu, setShowDisplayOptionsMenu] = useState(false)

  const [closeDisplayOptMenuOnBlur] = useCloseOnBlur(displayOptionsMenuRef, setShowDisplayOptionsMenu)

  const toggleDisplayOptionsMenu = useCallback(() => {
    if (displayOptionsButtonRef.current) {
      const buttonBoundingRect = displayOptionsButtonRef.current.getBoundingClientRect()
      setDisplayOptionsMenuPosition({
        top: buttonBoundingRect.bottom,
        left: buttonBoundingRect.right - buttonBoundingRect.width,
      })
    }

    setShowDisplayOptionsMenu(!showDisplayOptionsMenu)
  }, [showDisplayOptionsMenu])

  return (
    <div className="section-title-bar-header">
      <div className="text-lg font-semibold title">{panelTitle}</div>
      <div className="relative" ref={displayOptionsMenuRef}>
        <Disclosure open={showDisplayOptionsMenu} onChange={toggleDisplayOptionsMenu}>
          <DisclosureButton
            className={`flex justify-center items-center min-w-8 h-8
            ${
              showDisplayOptionsMenu ? 'bg-contrast' : 'bg-transparent'
            } bg-color-padding hover:bg-contrast focus:bg-contrast color-neutral
            border-1 border-solid border-main rounded-full cursor-pointer`}
            onBlur={closeDisplayOptMenuOnBlur}
            ref={displayOptionsButtonRef}
          >
            <Icon type="sort-descending" className="w-5 h-5" />
          </DisclosureButton>
          <DisclosurePanel onBlur={closeDisplayOptMenuOnBlur}>
            {showDisplayOptionsMenu && displayOptionsMenuPosition && (
              <DisplayOptionsMenuPortal
                application={application}
                closeDisplayOptionsMenu={toggleDisplayOptionsMenu}
                closeOnBlur={closeDisplayOptMenuOnBlur}
                isOpen={showDisplayOptionsMenu}
                isFilesSmartView={isFilesSmartView}
                top={displayOptionsMenuPosition.top}
                left={displayOptionsMenuPosition.left}
              />
            )}
          </DisclosurePanel>
        </Disclosure>
      </div>
      <button
        className="flex justify-center items-center min-w-8 h-8 ml-2 bg-info hover:brightness-130 color-info-contrast border-1 border-solid border-transparent rounded-full cursor-pointer"
        title={addButtonLabel}
        aria-label={addButtonLabel}
        onClick={addNewItem}
      >
        <Icon type="add" className="w-5 h-5" />
      </button>
    </div>
  )
}

export default memo(ContentListHeader)
