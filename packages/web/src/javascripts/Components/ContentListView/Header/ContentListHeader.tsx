import { WebApplication } from '@/Application/Application'
import { Disclosure, DisclosurePanel } from '@reach/disclosure'
import { memo, useCallback, useRef, useState } from 'react'
import Icon from '../../Icon/Icon'
import { DisplayOptionsMenuPositionProps } from './DisplayOptionsMenuProps'
import DisplayOptionsMenuPortal from './DisplayOptionsMenuPortal'
import StyledDisplayOptionsButton from './StyledDisplayOptionsButton'

type Props = {
  application: {
    getPreference: WebApplication['getPreference']
    setPreference: WebApplication['setPreference']
  }
  panelTitle: string
  addButtonLabel: string
  addNewItem: () => void
  isFilesSmartView: boolean
  optionsSubtitle?: string
}

const ContentListHeader = ({
  application,
  panelTitle,
  addButtonLabel,
  addNewItem,
  isFilesSmartView,
  optionsSubtitle,
}: Props) => {
  const [displayOptionsMenuPosition, setDisplayOptionsMenuPosition] = useState<DisplayOptionsMenuPositionProps>()
  const displayOptionsContainerRef = useRef<HTMLDivElement>(null)
  const displayOptionsButtonRef = useRef<HTMLButtonElement>(null)

  const [showDisplayOptionsMenu, setShowDisplayOptionsMenu] = useState(false)

  const toggleDisplayOptionsMenu = useCallback(() => {
    if (displayOptionsButtonRef.current) {
      const buttonBoundingRect = displayOptionsButtonRef.current.getBoundingClientRect()
      setDisplayOptionsMenuPosition({
        top: buttonBoundingRect.bottom,
        left: buttonBoundingRect.right - buttonBoundingRect.width,
      })
    }

    setShowDisplayOptionsMenu((show) => !show)
  }, [])

  return (
    <div className="section-title-bar-header">
      <div className="flex flex-col">
        <div className="text-lg font-semibold title">{panelTitle}</div>
        {optionsSubtitle && <div className="text-xs color-passive-0">{optionsSubtitle}</div>}
      </div>
      <div className="flex">
        <div className="relative" ref={displayOptionsContainerRef}>
          <Disclosure open={showDisplayOptionsMenu} onChange={toggleDisplayOptionsMenu}>
            <StyledDisplayOptionsButton pressed={showDisplayOptionsMenu} ref={displayOptionsButtonRef}>
              <Icon type="sort-descending" className="w-5 h-5" />
            </StyledDisplayOptionsButton>
            <DisclosurePanel>
              {showDisplayOptionsMenu && displayOptionsMenuPosition && (
                <DisplayOptionsMenuPortal
                  application={application}
                  closeDisplayOptionsMenu={toggleDisplayOptionsMenu}
                  containerRef={displayOptionsContainerRef}
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
          className="flex justify-center items-center min-w-8 h-8 ml-3 bg-info hover:brightness-130 color-info-contrast border-1 border-solid border-transparent rounded-full cursor-pointer"
          title={addButtonLabel}
          aria-label={addButtonLabel}
          onClick={addNewItem}
        >
          <Icon type="add" className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default memo(ContentListHeader)
