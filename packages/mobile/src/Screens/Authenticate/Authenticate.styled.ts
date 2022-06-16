import { SectionedTableCell } from '@Root/Components/SectionedTableCell'
import { TableSection } from '@Root/Components/TableSection'
import styled, { css } from 'styled-components/native'

export const StyledKeyboardAvoidingView = styled.KeyboardAvoidingView`
  flex: 1;
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
`

export const BaseView = styled.View``

export const StyledSectionedTableCell = styled(SectionedTableCell)`
  padding-top: 4px;
`

export const Title = styled.Text`
  color: ${({ theme }) => theme.stylekitForegroundColor};
  font-size: 14px;
  font-weight: bold;
`

export const Subtitle = styled.Text`
  color: ${({ theme }) => theme.stylekitNeutralColor};
  font-size: 14px;
  margin-top: 4px;
`

export const Input = styled.TextInput.attrs(({ theme }) => ({
  placeholderTextColor: theme.stylekitNeutralColor,
}))`
  font-size: ${({ theme }) => theme.mainTextFontSize}px;
  padding: 0px;
  color: ${({ theme }) => theme.stylekitForegroundColor};
  height: 100%;
`

export const SectionContainer = styled.View``

export const SourceContainer = styled.View``

export const SessionLengthContainer = styled.View``

export const StyledTableSection = styled(TableSection)<{ last?: boolean }>`
  ${({ last }) =>
    last &&
    css`
      margin-bottom: 0px;
    `};
`
