import { RouteProp } from '@react-navigation/native'
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack'
import { HeaderTitleView } from '@Root/Components/HeaderTitleView'
import { IoniconsHeaderButton } from '@Root/Components/IoniconsHeaderButton'
import { NoteHistory } from '@Root/Screens/NoteHistory/NoteHistory'
import { NoteHistoryPreview } from '@Root/Screens/NoteHistory/NoteHistoryPreview'
import { SCREEN_NOTE_HISTORY, SCREEN_NOTE_HISTORY_PREVIEW } from '@Root/Screens/screens'
import { NoteHistoryEntry } from '@standardnotes/snjs'
import { ICON_CHECKMARK } from '@Style/Icons'
import { ThemeService } from '@Style/ThemeService'
import React, { useContext } from 'react'
import { Platform } from 'react-native'
import { HeaderButtons, Item } from 'react-navigation-header-buttons'
import { ThemeContext } from 'styled-components'
import { HeaderTitleParams } from './App'

type HistoryStackNavigatorParamList = {
  [SCREEN_NOTE_HISTORY]: (HeaderTitleParams & { noteUuid: string }) | (undefined & { noteUuid: string })
  [SCREEN_NOTE_HISTORY_PREVIEW]: HeaderTitleParams & {
    revision: NoteHistoryEntry
    originalNoteUuid: string
  }
}

export type HistoryStackNavigationProp<T extends keyof HistoryStackNavigatorParamList> = {
  navigation: StackNavigationProp<HistoryStackNavigatorParamList, T>
  route: RouteProp<HistoryStackNavigatorParamList, T>
}

const MainStack = createStackNavigator<HistoryStackNavigatorParamList>()

export const HistoryStack = () => {
  const theme = useContext(ThemeContext)

  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.stylekitContrastBackgroundColor,
        },
      }}
      initialRouteName={SCREEN_NOTE_HISTORY}
    >
      <MainStack.Screen
        name={SCREEN_NOTE_HISTORY}
        options={({ route }) => ({
          title: 'Note history',
          headerBackTitleVisible: false,
          headerLeft: ({ disabled, onPress }) => (
            <HeaderButtons HeaderButtonComponent={IoniconsHeaderButton}>
              <Item
                testID="headerButton"
                disabled={disabled}
                title={Platform.OS === 'ios' ? 'Done' : ''}
                iconName={Platform.OS === 'ios' ? undefined : ThemeService.nameForIcon(ICON_CHECKMARK)}
                onPress={onPress}
              />
            </HeaderButtons>
          ),
          headerTitle: ({ children }) => {
            return (
              <HeaderTitleView
                title={route.params?.title ?? (children || '')}
                subtitle={route.params?.subTitle}
                subtitleColor={route.params?.subTitleColor}
              />
            )
          },
        })}
        component={NoteHistory}
      />
      <MainStack.Screen
        name={SCREEN_NOTE_HISTORY_PREVIEW}
        options={({ route }) => ({
          title: 'Preview',
          headerBackTitleVisible: false,
          headerTitle: ({ children }) => {
            return (
              <HeaderTitleView
                title={route.params?.title ?? (children || '')}
                subtitle={route.params?.subTitle || undefined}
                subtitleColor={route.params?.subTitleColor || undefined}
              />
            )
          },
        })}
        component={NoteHistoryPreview}
      />
    </MainStack.Navigator>
  )
}
