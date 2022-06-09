import { SnIcon } from '@Root/Components/SnIcon'
import { Text } from '@Screens/SideMenu/SideMenuCell.styled'
import { hexToRGBA } from '@Style/Utils'
import { StyleSheet } from 'react-native'
import styled from 'styled-components/native'

export const uploadedFileItemStyles = StyleSheet.create({
  lockIcon: {
    marginLeft: 8,
  },
})

export const FileDataContainer = styled.View`
  align-items: flex-start;
  flex-direction: row;
  padding-top: 12px;
`
export const FileIconContainer = styled.View`
  margin-top: 2px;
  margin-right: 16px;
`
export const FileDetailsWithExtraIconsContainer = styled.View`
  flex-direction: row;
  flex-shrink: 1;
  flex-grow: 1;
  align-items: center;
  border-bottom-color: ${({ theme }) => hexToRGBA(theme.stylekitBorderColor, 0.75)};
  border-bottom-width: 1px;
  padding-bottom: 12px;
`
export const LockIconStyled = styled(SnIcon)`
  background-color: green;
  display: none;
`
export const FileDetailsContainer = styled.View`
  flex-shrink: 1;
`
export const FileName = styled(Text)`
  font-weight: normal;
  font-size: 16px;
  margin-bottom: 4px;
`
export const FileDateAndSizeContainer = styled.View`
  flex-direction: row;
  align-items: center;
`
export const FileDateAndSize = styled.Text`
  color: ${({ theme }) => {
    return theme.stylekitForegroundColor
  }};
  opacity: 0.5;
  font-weight: normal;
  font-size: 12px;
`
