import { ApplicationContext } from '@Root/ApplicationContext'
import { LoadingContainer, LoadingText } from '@Root/Screens/Notes/NoteList.styled'
import { ButtonType, RemoteSession, SessionStrings, UuidString } from '@standardnotes/snjs'
import { useCustomActionSheet } from '@Style/CustomActionSheet'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { FlatList, ListRenderItem, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemeContext } from 'styled-components'
import { SessionCell } from './SessionCell'

const useSessions = (): [
  RemoteSession[],
  () => void,
  () => void,
  boolean,
  (uuid: UuidString) => Promise<void>,
  string,
] => {
  // Context
  const application = useContext(ApplicationContext)

  // State
  const [sessions, setSessions] = useState<RemoteSession[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const getSessions = useCallback(async () => {
    const response = await application?.getSessions()

    if (!response) {
      setErrorMessage('An unknown error occurred while loading sessions.')
      return
    }

    if ('error' in response || !response.data) {
      if (response.error?.message) {
        setErrorMessage(response.error.message)
      } else {
        setErrorMessage('An unknown error occurred while loading sessions.')
      }
    } else {
      const newSessions = response.data as RemoteSession[]
      setSessions(newSessions)
      setErrorMessage('')
    }
  }, [application])

  const refreshSessions = useCallback(async () => {
    setRefreshing(true)
    await getSessions()
    setRefreshing(false)
  }, [getSessions])

  useEffect(() => {
    void refreshSessions()
  }, [application, refreshSessions])

  async function revokeSession(uuid: UuidString) {
    const response = await application?.revokeSession(uuid)
    if (response && 'error' in response) {
      if (response.error?.message) {
        setErrorMessage(response.error?.message)
      } else {
        setErrorMessage('An unknown error occurred while revoking the session.')
      }
    } else {
      setSessions(sessions.filter((session) => session.uuid !== uuid))
    }
  }

  return [sessions, getSessions, refreshSessions, refreshing, revokeSession, errorMessage]
}

export const ManageSessions: React.FC = () => {
  // Context
  const application = useContext(ApplicationContext)
  const { showActionSheet } = useCustomActionSheet()
  const theme = useContext(ThemeContext)
  const insets = useSafeAreaInsets()

  const [sessions, getSessions, refreshSessions, refreshing, revokeSession, errorMessage] = useSessions()

  const onItemPress = (item: RemoteSession) => {
    showActionSheet({
      title: item.device_info,
      options: [
        {
          text: 'Revoke',
          destructive: true,
          callback: () => showRevokeSessionAlert(item),
        },
      ],
    })
  }

  const showRevokeSessionAlert = useCallback(
    async (item: RemoteSession) => {
      const confirmed = await application?.alertService.confirm(
        SessionStrings.RevokeText,
        SessionStrings.RevokeTitle,
        SessionStrings.RevokeConfirmButton,
        ButtonType.Danger,
        SessionStrings.RevokeCancelButton,
      )
      if (confirmed) {
        try {
          await revokeSession(item.uuid)
          getSessions()
        } catch (e) {
          void application?.alertService.alert('Action failed. Please try again.')
        }
      }
    },
    [application?.alertService, getSessions, revokeSession],
  )

  const RenderItem: ListRenderItem<RemoteSession> | null | undefined = ({ item }) => {
    return (
      <SessionCell
        onPress={() => onItemPress(item)}
        title={item.device_info}
        subTitle={item.updated_at.toLocaleDateString()}
        currentSession={item.current}
        disabled={item.current}
      />
    )
  }

  if (errorMessage) {
    return (
      <LoadingContainer>
        <LoadingText>{errorMessage}</LoadingText>
      </LoadingContainer>
    )
  }

  return (
    <FlatList<RemoteSession>
      keyExtractor={(item) => item.uuid}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      initialNumToRender={7}
      windowSize={7}
      data={sessions}
      refreshControl={
        <RefreshControl
          tintColor={theme.stylekitContrastForegroundColor}
          refreshing={refreshing}
          onRefresh={refreshSessions}
        />
      }
      renderItem={RenderItem}
    />
  )
}
