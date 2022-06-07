import { useFocusEffect } from '@react-navigation/native'
import { ApplicationContext } from '@Root/ApplicationContext'
import { AppStackNavigationProp } from '@Root/AppStack'
import { Button } from '@Root/Components/Button'
import { SCREEN_SETTINGS, SCREEN_VIEW_PROTECTED_NOTE } from '@Root/Screens/screens'
import React, { useCallback, useContext } from 'react'
import { Container, Text, Title } from './ViewProtectedNote.styled'

type Props = AppStackNavigationProp<typeof SCREEN_VIEW_PROTECTED_NOTE>

export const ViewProtectedNote = ({
  route: {
    params: { onPressView },
  },
  navigation,
}: Props) => {
  const application = useContext(ApplicationContext)

  const onPressGoToSettings = () => {
    navigation.navigate(SCREEN_SETTINGS)
  }

  const checkProtectionSources = useCallback(() => {
    const hasProtectionSources = application?.hasProtectionSources()
    if (hasProtectionSources) {
      onPressView()
    }
  }, [application, onPressView])

  useFocusEffect(checkProtectionSources)

  return (
    <Container>
      <Title>This note is protected</Title>
      <Text>Add a passcode or biometrics lock, or create an account, to require authentication to view this note.</Text>
      <Button label="Go to Settings" primary={true} fullWidth={true} onPress={onPressGoToSettings} />
      <Button label="View" fullWidth={true} last={true} onPress={onPressView} />
    </Container>
  )
}
