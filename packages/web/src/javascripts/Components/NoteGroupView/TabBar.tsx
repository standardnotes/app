import React, { useState, useEffect, useRef } from 'react'
import { WebApplication } from '@/Application/WebApplication'
import { NoteViewController } from '../NoteView/Controller/NoteViewController'
import { FileViewController } from '../NoteView/Controller/FileViewController'

type TabBarProps = {
  application: WebApplication
  activeControllerIndex: number
  splitControllerIndex: number | undefined
  focusedPane: 'primary' | 'secondary'
  controllers: (NoteViewController | FileViewController)[]
}

export const TabBar: React.FC<TabBarProps> = ({
  application,
  activeControllerIndex,
  splitControllerIndex,
  focusedPane,
  controllers,
}) => {
  const itemControllerGroup = application.itemControllerGroup
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    index: number
  } | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (controllers.length === 0) {
    return null
  }

  const handleTabClick = (index: number) => {
    // If split screen is active, determine which pane we are clicking in
    // For simplicity, clicking a tab will focus that index as the primary tab
    if (splitControllerIndex !== undefined && index === splitControllerIndex) {
      itemControllerGroup.focusedPane = 'secondary'
    } else {
      itemControllerGroup.activeControllerIndex = index
      itemControllerGroup.focusedPane = 'primary'
    }
    itemControllerGroup.notifyObservers()
  }

  const handleCloseClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    itemControllerGroup.closeTab(index)
  }

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      index,
    })
  }

  const handleCloseTab = () => {
    if (contextMenu !== null) {
      itemControllerGroup.closeTab(contextMenu.index)
      setContextMenu(null)
    }
  }

  const handleCloseOthers = () => {
    if (contextMenu !== null) {
      const targetController = controllers[contextMenu.index]
      for (const controller of [...controllers]) {
        if (controller !== targetController) {
          itemControllerGroup.closeItemController(controller, { notify: false })
        }
      }
      itemControllerGroup.activeControllerIndex = 0
      itemControllerGroup.splitControllerIndex = undefined
      itemControllerGroup.focusedPane = 'primary'
      itemControllerGroup.notifyObservers()
      setContextMenu(null)
    }
  }

  const handleSplitTab = () => {
    if (contextMenu !== null) {
      itemControllerGroup.splitTab(contextMenu.index)
      setContextMenu(null)
    }
  }

  const getTabTitle = (controller: NoteViewController | FileViewController) => {
    if (controller instanceof NoteViewController) {
      return controller.item?.title || 'Untitled note'
    } else {
      return (controller.item as any)?.title || (controller.item as any)?.name || 'Untitled file'
    }
  }

  return (
    <div className="tab-bar-container">
      <div className="tab-bar-tabs">
        {controllers.map((controller, index) => {
          const isPrimaryActive = activeControllerIndex === index
          const isSecondaryActive = splitControllerIndex === index
          const isFocused = (focusedPane === 'primary' && isPrimaryActive) || 
                            (focusedPane === 'secondary' && isSecondaryActive)
          const isOpened = isPrimaryActive || isSecondaryActive

          let tabClassName = 'tab-item'
          if (isOpened) {
            tabClassName += ' tab-item-active'
          }
          if (isFocused) {
            tabClassName += ' tab-item-focused'
          }

          return (
            <div
              key={controller.runtimeId}
              className={tabClassName}
              onClick={() => handleTabClick(index)}
              onContextMenu={(e) => handleContextMenu(e, index)}
            >
              <span className="tab-title-text">{getTabTitle(controller)}</span>
              {controllers.length > 1 && (
                <button
                  className="tab-close-btn"
                  onClick={(e) => handleCloseClick(e, index)}
                  title="Close tab"
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}

        <button
          className="tab-add-btn"
          onClick={() => itemControllerGroup.openNewTemplateTab()}
          title="New tab"
        >
          ＋
        </button>
      </div>

      <div className="tab-bar-actions">
        <button
          className={`tab-action-btn ${splitControllerIndex !== undefined ? 'tab-action-btn-active' : ''}`}
          onClick={() => itemControllerGroup.toggleSplitScreen()}
          title={splitControllerIndex !== undefined ? "Merge Editor Panes" : "Split Editor Panes"}
        >
          {splitControllerIndex !== undefined ? (
            // Merge/Close Split icon
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
              <path d="M17 12h-3M7 12h3" />
            </svg>
          ) : (
            // Split icon
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
          )}
        </button>
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          className="tab-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="context-menu-item" onClick={handleCloseTab}>
            Close Tab
          </div>
          <div className="context-menu-item" onClick={handleCloseOthers}>
            Close Other Tabs
          </div>
          <div className="context-menu-item" onClick={handleSplitTab}>
            Split Screen
          </div>
        </div>
      )}
    </div>
  )
}
