import React from 'react'
import { Platform } from 'react-native'
import styled, { css } from 'styled-components/native'
import { Props as TableCellProps, SectionedTableCellTouchableHighlight } from './SectionedTableCell'

type Props = {
  testID?: string
  maxHeight?: number
  leftAligned?: boolean
  bold?: boolean
  disabled?: boolean
  important?: boolean
  onPress: () => void
  first?: boolean
  last?: boolean
  title?: string
}

type ContainerProps = Pick<Props, 'maxHeight'> & TableCellProps
const Container = styled(SectionedTableCellTouchableHighlight).attrs(props => ({
  underlayColor: props.theme.stylekitBorderColor,
}))<ContainerProps>`
  padding-top: ${12}px;
  justify-content: center;
  ${({ maxHeight }) =>
    maxHeight &&
    css`
      max-height: 50px;
    `};
`
const ButtonContainer = styled.View``

type ButtonLabelProps = Pick<Props, 'leftAligned' | 'bold' | 'disabled' | 'important'>
const ButtonLabel = styled.Text<ButtonLabelProps>`
  text-align: ${props => (props.leftAligned ? 'left' : 'center')};
  text-align-vertical: center;
  color: ${props => {
    let color = Platform.OS === 'android' ? props.theme.stylekitForegroundColor : props.theme.stylekitInfoColor
    if (props.disabled) {
      color = 'gray'
    } else if (props.important) {
      color = props.theme.stylekitDangerColor
    }
    return color
  }};
  font-size: ${props => props.theme.mainTextFontSize}px;
  ${({ bold }) =>
    bold &&
    css`
      font-weight: bold;
    `}
  ${({ disabled }) =>
    disabled &&
    css`
      opacity: 0.6;
    `}
`

export const ButtonCell: React.FC<Props> = props => (
  <Container
    first={props.first}
    last={props.last}
    maxHeight={props.maxHeight}
    testID={props.testID}
    disabled={props.disabled}
    onPress={props.onPress}
  >
    <ButtonContainer>
      <ButtonLabel
        important={props.important}
        disabled={props.disabled}
        bold={props.bold}
        leftAligned={props.leftAligned}
      >
        {props.title}
      </ButtonLabel>
      {props.children && props.children}
    </ButtonContainer>
  </Container>
)
