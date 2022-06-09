import React from 'react'
import styled, { css } from 'styled-components/native'

export type Option = { selected: boolean; key: string; title: string }

type Props = {
  testID?: string
  title: string
  first?: boolean
  height?: number
  onPress: (option: Option) => void
  options: Option[]
  leftAligned?: boolean
}
type ContainerProps = Omit<Props, 'title' | 'onPress' | 'options'>

export const Container = styled.View<ContainerProps>`
  border-bottom-color: ${props => props.theme.stylekitBorderColor};
  border-bottom-width: 1px;
  padding-left: ${props => props.theme.paddingLeft}px;
  padding-right: ${props => props.theme.paddingLeft}px;
  background-color: ${props => props.theme.stylekitBackgroundColor};
  ${({ first, theme }) =>
    first &&
    css`
      border-top-color: ${theme.stylekitBorderColor};
      border-top-width: ${1}px;
    `};
  ${({ height }) =>
    height &&
    css`
      height: ${height}px;
    `};
  flex-direction: row;
  justify-content: center;
  align-items: center;
  max-height: 45px;
`

const Title = styled.Text<{ leftAligned?: boolean }>`
  font-size: ${props => props.theme.mainTextFontSize}px;
  color: ${props => props.theme.stylekitForegroundColor};
  text-align: ${props => (props.leftAligned ? 'left' : 'center')};
  width: 42%;
  min-width: 0px;
`

const OptionsContainer = styled.View`
  width: 58%;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.stylekitBackgroundColor};
`

const ButtonTouchable = styled.TouchableHighlight.attrs(props => ({
  underlayColor: props.theme.stylekitBorderColor,
}))`
  border-left-color: ${props => props.theme.stylekitBorderColor};
  border-left-width: 1px;
  flex-grow: 1;
  padding: 10px;
  padding-top: 12px;
`

const ButtonTitle = styled.Text<{ selected: boolean }>`
  color: ${props => {
    return props.selected ? props.theme.stylekitInfoColor : props.theme.stylekitNeutralColor
  }};
  font-size: 16px;
  text-align: center;
  width: 100%;
`

export const SectionedOptionsTableCell: React.FC<Props> = props => (
  <Container first={props.first}>
    <Title leftAligned={props.leftAligned}>{props.title}</Title>
    <OptionsContainer>
      {props.options.map(option => {
        return (
          <ButtonTouchable key={option.title} onPress={() => props.onPress(option)}>
            <ButtonTitle selected={option.selected}>{option.title}</ButtonTitle>
          </ButtonTouchable>
        )
      })}
    </OptionsContainer>
  </Container>
)
