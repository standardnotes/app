import React from 'react'
import { Platform } from 'react-native'
import styled from 'styled-components/native'

type Props = {
  subtitleColor?: string
  title: string
  subtitle?: string
}

const Container = styled.View`
  /* background-color: ${props => props.theme.stylekitContrastBackgroundColor}; */
  flex: 1;
  justify-content: center;

  ${Platform.OS === 'android' && 'align-items: flex-start; min-width: 100px;'}
`
const Title = styled.Text`
  color: ${props => props.theme.stylekitForegroundColor};
  font-weight: bold;
  font-size: 18px;
  text-align: center;
`
const SubTitle = styled.Text.attrs(() => ({
  adjustsFontSizeToFit: true,
  numberOfLines: 1,
}))<{ color?: string }>`
  color: ${props => props.color ?? props.theme.stylekitForegroundColor};
  opacity: ${props => (props.color ? 1 : 0.6)};
  font-size: ${Platform.OS === 'android' ? 13 : 12}px;
  ${Platform.OS === 'ios' && 'text-align: center'}
`

export const HeaderTitleView: React.FC<Props> = props => (
  <Container>
    <Title>{props.title}</Title>
    {props.subtitle && props.subtitle.length > 0 ? (
      <SubTitle color={props.subtitleColor}>{props.subtitle}</SubTitle>
    ) : undefined}
  </Container>
)
