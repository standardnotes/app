import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import styled from 'styled-components/native'

export const useUploadedFilesListStyles = () => {
  const insets = useSafeAreaInsets()

  return StyleSheet.create({
    centeredView: {
      justifyContent: 'flex-start',
      alignItems: 'center',
      flexShrink: 1,
      flexGrow: 1,
      paddingBottom: insets.bottom,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    headerTabContainer: {
      flexDirection: 'row',
    },
    noAttachmentsIconContainer: {
      alignItems: 'center',
      marginTop: 24,
    },
    noAttachmentsIcon: {
      marginTop: 24,
      marginBottom: 24,
    },
  })
}

export const UploadFilesListContainer = styled.View`
  margin-top: 12px;
  padding-right: 16px;
  padding-left: 16px;
  width: 100%;
  height: 100%;
`
export const HeaderTabItem = styled.View<{
  isActive: boolean
  isLeftTab?: boolean
}>`
  align-items: center;
  padding: 8px;
  flex-grow: 1;
  background-color: ${({ theme, isActive }) => {
    return isActive ? theme.stylekitInfoColor : theme.stylekitInfoContrastColor
  }};
  border-width: 1px;
  border-color: ${({ theme }) => theme.stylekitInfoColor};
  border-top-right-radius: ${({ isLeftTab }) => (isLeftTab ? 0 : '8px')};
  border-bottom-right-radius: ${({ isLeftTab }) => (isLeftTab ? 0 : '8px')};
  border-top-left-radius: ${({ isLeftTab }) => (isLeftTab ? '8px' : 0)};
  border-bottom-left-radius: ${({ isLeftTab }) => (isLeftTab ? '8px' : 0)};
  margin-left: ${({ isLeftTab }) => (isLeftTab ? 0 : '-1px')};
`
export const TabText = styled.Text<{ isActive: boolean }>`
  font-weight: bold;
  color: ${({ isActive, theme }) => {
    return isActive ? theme.stylekitInfoContrastColor : theme.stylekitInfoColor
  }};
`
