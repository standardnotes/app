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
    <div className="section-title-bar-header gap-1">
      <div className="flex flex-grow flex-col">
        <div className="text-lg font-semibold text-text">{panelTitle}</div>
        {optionsSubtitle && <div className="text-xs text-passive-0">{optionsSubtitle}</div>}
      </div>
      <div className="flex">
        <div className="relative" ref={displayOptionsContainerRef}>
          <Disclosure open={showDisplayOptionsMenu} onChange={toggleDisplayOptionsMenu}>
            <StyledDisplayOptionsButton $pressed={showDisplayOptionsMenu} ref={displayOptionsButtonRef}>
              <Icon type="sort-descending" />
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
          className="ml-3 flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-transparent bg-info text-info-contrast hover:brightness-125"
          title={addButtonLabel}
          aria-label={addButtonLabel}
          onClick={addNewItem}
        >
          <Icon type="add" />
        </button>
      </div>
    </div>
  )
}

export default memo(ContentListHeader)
