import { Props as TableCellProps, SectionedTableCellTouchableHighlight } from '@Root/Components/SectionedTableCell'
import React from 'react'
import styled, { css } from 'styled-components/native'

type Props = {
  testID?: string
  disabled?: boolean
  onPress: () => void
  title: string
  subTitle: string
  currentSession: boolean
}

const Container = styled(SectionedTableCellTouchableHighlight).attrs(props => ({
  underlayColor: props.theme.stylekitBorderColor,
}))<TableCellProps>`
  padding-top: ${12}px;
  justify-content: center;
`
const ButtonContainer = styled.View``

type ButtonLabelProps = Pick<Props, 'disabled'>
const ButtonLabel = styled.Text<ButtonLabelProps>`
  color: ${props => {
    let color = props.theme.stylekitForegroundColor
    if (props.disabled) {
      color = 'gray'
    }
    return color
  }};
  font-weight: bold;
  font-size: ${props => props.theme.mainTextFontSize}px;
  ${({ disabled }) =>
    disabled &&
    css`
      opacity: 0.6;
    `}
`
export const SubTitleText = styled.Text<{ current: boolean }>`
  font-size: 14px;
  margin-top: 4px;
  color: ${({ theme, current }) => {
    return current ? theme.stylekitInfoColor : theme.stylekitForegroundColor
  }};
  opacity: 0.8;
  line-height: 21px;
`

export const SessionCell: React.FC<Props> = props => (
  <Container testID={props.testID} disabled={props.disabled} onPress={props.onPress}>
    <ButtonContainer>
      <ButtonLabel disabled={props.disabled}>{props.title}</ButtonLabel>
      <SubTitleText current={props.currentSession}>
        {props.currentSession ? 'Current session' : 'Signed in on ' + props.subTitle}
      </SubTitleText>
    </ButtonContainer>
  </Container>
)
