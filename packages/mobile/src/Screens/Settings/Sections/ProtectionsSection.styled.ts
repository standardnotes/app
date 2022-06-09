import { SectionedTableCell } from '@Root/Components/SectionedTableCell'
import styled from 'styled-components/native'

export const BaseView = styled.View``

export const StyledSectionedTableCell = styled(SectionedTableCell)`
  padding-top: 12px;
`

export const SubText = styled.Text`
  color: ${({ theme }) => theme.stylekitNeutralColor};
  font-size: 14px;
  padding: 12px 14px;
`

export const Subtitle = styled.Text`
  color: ${({ theme }) => theme.stylekitNeutralColor};
  font-size: 14px;
  margin-top: 4px;
`

export const Title = styled.Text`
  color: ${({ theme }) => theme.stylekitForegroundColor};
  font-size: 16px;
  font-weight: bold;
`
