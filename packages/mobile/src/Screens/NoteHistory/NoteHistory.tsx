import SegmentedControl from '@react-native-community/segmented-control'
import { ApplicationContext } from '@Root/ApplicationContext'
import { HistoryStackNavigationProp } from '@Root/HistoryStack'
import { SCREEN_NOTE_HISTORY, SCREEN_NOTE_HISTORY_PREVIEW } from '@Root/Screens/screens'
import { NoteHistoryEntry, SNNote } from '@standardnotes/snjs'
import { ThemeServiceContext } from '@Style/ThemeService'
import React, { useContext, useState } from 'react'
import { Dimensions, Platform } from 'react-native'
import { NavigationState, Route, SceneRendererProps, TabBar, TabView } from 'react-native-tab-view'
import { ThemeContext } from 'styled-components'
import { IosTabBarContainer } from './NoteHistory.styled'
import { RemoteHistory } from './RemoteHistory'
import { SessionHistory } from './SessionHistory'

const initialLayout = { width: Dimensions.get('window').width }

type Props = HistoryStackNavigationProp<typeof SCREEN_NOTE_HISTORY>
export const NoteHistory = (props: Props) => {
  // Context
  const application = useContext(ApplicationContext)
  const theme = useContext(ThemeContext)
  const themeService = useContext(ThemeServiceContext)

  // State
  const [note] = useState<SNNote>(() => application?.items.findItem(props.route.params.noteUuid) as SNNote)
  const [routes] = React.useState([
    { key: 'session', title: 'Session' },
    { key: 'remote', title: 'Remote' },
  ])
  const [index, setIndex] = useState(0)

  const openPreview = (_uuid: string, revision: NoteHistoryEntry, title: string) => {
    props.navigation.navigate(SCREEN_NOTE_HISTORY_PREVIEW, {
      title,
      revision,
      originalNoteUuid: note.uuid,
    })
  }

  const renderScene = ({ route }: { route: { key: string; title: string } }) => {
    switch (route.key) {
      case 'session':
        return <SessionHistory onPress={openPreview} note={note} />
      case 'remote':
        return <RemoteHistory onPress={openPreview} note={note} />
      default:
        return null
    }
  }

  const renderTabBar = (
    tabBarProps: SceneRendererProps & {
      navigationState: NavigationState<Route>
    },
  ) => {
    return Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 13 ? (
      <IosTabBarContainer>
        <SegmentedControl
          backgroundColor={theme.stylekitContrastBackgroundColor}
          appearance={themeService?.keyboardColorForActiveTheme()}
          fontStyle={{
            color: theme.stylekitForegroundColor,
          }}
          values={routes.map((route) => route.title)}
          selectedIndex={tabBarProps.navigationState.index}
          onChange={(event) => {
            setIndex(event.nativeEvent.selectedSegmentIndex)
          }}
        />
      </IosTabBarContainer>
    ) : (
      <TabBar
        {...tabBarProps}
        indicatorStyle={{ backgroundColor: theme.stylekitInfoColor }}
        inactiveColor={theme.stylekitBorderColor}
        activeColor={theme.stylekitInfoColor}
        style={{
          backgroundColor: theme.stylekitBackgroundColor,
          shadowColor: theme.stylekitShadowColor,
        }}
        labelStyle={{ color: theme.stylekitInfoColor }}
      />
    )
  }

  return (
    <TabView
      renderTabBar={renderTabBar}
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
    />
  )
}
