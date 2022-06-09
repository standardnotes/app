import { SectionedTableCell } from '@Components/SectionedTableCell'
import { StyleSheet } from 'react-native'
import styled, { DefaultTheme } from 'styled-components/native'

export const useFilesInPreferencesStyles = (theme: DefaultTheme) => {
  return StyleSheet.create({
    progressBarContainer: {
      backgroundColor: theme.stylekitSecondaryContrastBackgroundColor,
      height: 8,
      borderRadius: 8,
      marginTop: 6,
    },
    progressBar: {
      backgroundColor: theme.stylekitInfoColor,
      borderRadius: 8,
    },
  })
}

export const StyledSectionedTableCell = styled(SectionedTableCell)`
  padding-top: 12px;
`
export const Title = styled.Text`
  color: ${({ theme }) => theme.stylekitForegroundColor};
  font-size: 16px;
  font-weight: bold;
`
export const SubTitle = styled.Text`
  margin-top: 4px;
  font-size: 14px;
  color: ${({ theme }) => theme.stylekitContrastForegroundColor};
  opacity: 0.6;
`
