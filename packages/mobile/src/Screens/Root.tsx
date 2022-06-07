import { AppStateEventType, AppStateType, TabletModeChangeData } from '@Lib/ApplicationState'
import { useIsLocked } from '@Lib/SnjsHelperHooks'
import { ApplicationContext } from '@Root/ApplicationContext'
import { NoteViewController } from '@standardnotes/snjs'
import { ThemeService } from '@Style/ThemeService'
import { hexToRGBA } from '@Style/Utils'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import { ThemeContext } from 'styled-components'
import { Compose } from './Compose/Compose'
import { Notes } from './Notes/Notes'
import { ComposeContainer, Container, ExpandTouchable, iconNames, NotesContainer } from './Root.styled'

export const Root = () => {
  const application = useContext(ApplicationContext)
  const theme = useContext(ThemeContext)
  const [isLocked] = useIsLocked()

  const [, setWidth] = useState<number | undefined>(undefined)
  const [height, setHeight] = useState<number | undefined>(undefined)
  const [, setX] = useState<number | undefined>(undefined)
  const [noteListCollapsed, setNoteListCollapsed] = useState<boolean>(false)
  const [activeNoteView, setActiveNoteView] = useState<NoteViewController | undefined>()
  const [isInTabletMode, setIsInTabletMode] = useState<boolean | undefined>(application?.getAppState().isInTabletMode)
  const [keyboardHeight, setKeyboardHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    const removeStateObserver = application?.getAppState().addStateChangeObserver(state => {
      if (state === AppStateType.GainingFocus) {
        void application.sync.sync()
      }
    })
    const removeApplicationStateEventHandler = application
      ?.getAppState()
      .addStateEventObserver((event: AppStateEventType, data: TabletModeChangeData | undefined) => {
        if (event === AppStateEventType.TabletModeChange) {
          const eventData = data as TabletModeChangeData
          if (eventData.new_isInTabletMode && !eventData.old_isInTabletMode) {
            setIsInTabletMode(true)
          } else if (!eventData.new_isInTabletMode && eventData.old_isInTabletMode) {
            setIsInTabletMode(false)
          }
        }
        if (event === AppStateEventType.KeyboardChangeEvent) {
          // need to refresh the height of the keyboard when it opens so that we can change the position
          // of the sidebar collapse icon
          if (application?.getAppState().isInTabletMode) {
            setKeyboardHeight(application?.getAppState().getKeyboardHeight())
          }
        }
      })
    const removeNoteObserver = application?.editorGroup.addActiveControllerChangeObserver(activeController => {
      setActiveNoteView(activeController)
    })

    return () => {
      if (removeApplicationStateEventHandler) {
        removeApplicationStateEventHandler()
      }
      if (removeStateObserver) {
        removeStateObserver()
      }
      if (removeNoteObserver) {
        removeNoteObserver()
      }
    }
  }, [application])

  const collapseIconName = useMemo(() => {
    const collapseIconPrefix = ThemeService.platformIconPrefix()

    return collapseIconPrefix + '-' + iconNames[collapseIconPrefix][noteListCollapsed ? 0 : 1]
  }, [noteListCollapsed])

  const onLayout = (e: LayoutChangeEvent) => {
    const tempWidth = e.nativeEvent.layout.width
    /**
          If you're in tablet mode, but on an iPad where this app is running side by
          side by another app, we only want to show the Compose window and not the
          list, because there isn't enough space.
        */
    const MinWidthToSplit = 450
    if (application?.getAppState().isTabletDevice) {
      if (tempWidth < MinWidthToSplit) {
        application?.getAppState().setTabletModeEnabled(false)
      } else {
        application?.getAppState().setTabletModeEnabled(true)
      }
    }
    setWidth(tempWidth)
    setHeight(e.nativeEvent.layout.height)
    setX(e.nativeEvent.layout.x)
    setIsInTabletMode(application?.getAppState().isInTabletMode)
    setKeyboardHeight(application?.getAppState().getKeyboardHeight())
  }

  const toggleNoteList = () => {
    setNoteListCollapsed(value => !value)
  }

  const collapseIconBottomPosition = (keyboardHeight ?? 0) > (height ?? 0) / 2 ? (keyboardHeight ?? 0) + 40 : '50%'

  if (isLocked) {
    return null
  }

  return (
    <Container testID="rootView" onLayout={onLayout}>
      <NotesContainer notesListCollapsed={noteListCollapsed} isInTabletMode={isInTabletMode}>
        <Notes keyboardHeight={keyboardHeight} isInTabletMode={isInTabletMode} />
      </NotesContainer>
      {activeNoteView && !activeNoteView.dealloced && isInTabletMode && (
        <ComposeContainer>
          <Compose noteUuid={activeNoteView.note.uuid} />
          <ExpandTouchable style={{ bottom: collapseIconBottomPosition }} onPress={toggleNoteList}>
            <Icon name={collapseIconName} size={24} color={hexToRGBA(theme.stylekitInfoColor, 0.85)} />
          </ExpandTouchable>
        </ComposeContainer>
      )}
    </Container>
  )
}
