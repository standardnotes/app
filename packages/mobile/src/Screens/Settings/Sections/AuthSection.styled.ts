import styled from 'styled-components/native'

const PADDING = 14

export const RegistrationDescription = styled.Text`
  color: ${({ theme }) => theme.stylekitForegroundColor};
  font-size: ${({ theme }) => theme.mainTextFontSize}px;
  padding-left: ${PADDING}px;
  padding-right: ${PADDING}px;
  margin-bottom: ${PADDING}px;
`

export const RegistrationInput = styled.TextInput.attrs(({ theme }) => ({
  underlineColorAndroid: 'transparent',
  placeholderTextColor: theme.stylekitNeutralColor,
}))`
  font-size: ${({ theme }) => theme.mainTextFontSize}px;
  padding: 0px;
  color: ${({ theme }) => theme.stylekitForegroundColor};
  height: 100%;
`

export const RegularView = styled.View``
