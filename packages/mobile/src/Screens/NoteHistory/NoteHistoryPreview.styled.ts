import { Platform } from 'react-native'
import styled, { css } from 'styled-components/native'

const PADDING = 14
const NOTE_TITLE_HEIGHT = 50

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
`

export const StyledTextView = styled.Text`
  padding-top: 10px;
  color: ${({ theme }) => theme.stylekitForegroundColor};
  padding-left: ${({ theme }) => theme.paddingLeft - (Platform.OS === 'ios' ? 5 : 0)}px;
  padding-right: ${({ theme }) => theme.paddingLeft - (Platform.OS === 'ios' ? 5 : 0)}px;
  /* padding-bottom: 10px; */
  ${Platform.OS === 'ios' &&
  css`
    font-size: 17px;
  `}
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
  /* ${Platform.OS === 'ios' && 'padding-bottom: 10px'}; */
`

export const TextContainer = styled.ScrollView``

export const TitleContainer = styled.View`
  border-bottom-color: ${({ theme }) => theme.stylekitBorderColor};
  border-bottom-width: 1px;
  align-content: center;
  justify-content: center;
  height: ${NOTE_TITLE_HEIGHT}px;
  padding-top: ${Platform.OS === 'ios' ? 5 : 12}px;
  padding-left: ${PADDING}px;
  padding-right: ${PADDING}px;
`

export const Title = styled.Text`
  font-weight: 600;
  font-size: 16px;
  color: ${({ theme }) => theme.stylekitForegroundColor};
`
