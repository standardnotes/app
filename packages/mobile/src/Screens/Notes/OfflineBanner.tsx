import { useNavigation } from '@react-navigation/native'
import { SCREEN_SETTINGS } from '@Root/Screens/screens'
import { ICON_FORWARD, ICON_USER } from '@Style/Icons'
import { ThemeService } from '@Style/ThemeService'
import React from 'react'
import {
  BoldText,
  CenterContainer,
  Container,
  ForwardIcon,
  SubText,
  TextContainer,
  Touchable,
  UserIcon,
} from './OfflineBanner.styled'

const NOT_BACKED_UP_TEXT = 'Data not backed up'
const SIGN_IN_TEXT = 'Sign in or register to backup your notes'

export const OfflineBanner: React.FC = () => {
  const navigation = useNavigation()
  const onPress = () => {
    navigation.navigate(SCREEN_SETTINGS as never)
  }

  return (
    <Touchable onPress={onPress}>
      <Container>
        <CenterContainer>
          <UserIcon name={ThemeService.nameForIcon(ICON_USER)} />
        </CenterContainer>
        <TextContainer>
          <BoldText>{NOT_BACKED_UP_TEXT}</BoldText>
          <SubText>{SIGN_IN_TEXT}</SubText>
        </TextContainer>
        <CenterContainer>
          <ForwardIcon name={ThemeService.nameForIcon(ICON_FORWARD)} />
        </CenterContainer>
      </Container>
    </Touchable>
  )
}
