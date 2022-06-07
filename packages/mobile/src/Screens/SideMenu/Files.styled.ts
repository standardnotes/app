import { SnIcon } from '@Root/Components/SnIcon'
import { SideMenuCell } from '@Root/Screens/SideMenu/SideMenuCell'
import { Platform, StyleSheet } from 'react-native'
import styled from 'styled-components/native'

export const styles = StyleSheet.create({
  cellContentStyle: {
    flexShrink: 0,
  },
  learnMoreIcon: {
    marginTop: Platform.OS === 'ios' ? -6 : -3,
  },
})
export const SNIconStyled = styled(SnIcon)`
  margin-left: 8px;
`
export const FilesContainer = styled.View`
  margin-top: 10px;
`
export const FileItemContainer = styled.View`
  margin-bottom: 18px;
`
export const IconsContainer = styled.View`
  flex-direction: row;
  margin-top: ${() => (Platform.OS === 'ios' ? 0 : '5px')};
`
export const SideMenuCellStyled = styled(SideMenuCell)`
  min-height: 22px;
`
export const SideMenuCellAttachNewFile = styled(SideMenuCellStyled)`
  margin-bottom: 14px;
`
export const SideMenuCellShowAllFiles = styled(SideMenuCellStyled)`
  margin-bottom: 8px;
`
