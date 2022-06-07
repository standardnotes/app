import React from 'react'
import { Platform } from 'react-native'
import styled from 'styled-components/native'

type Props = {
  title?: string
  subtitle?: string
  buttonText?: string
  buttonAction?: () => void
  buttonStyles?: any
  tinted?: boolean
  backgroundColor?: string
}

const Container = styled.View<Pick<Props, 'backgroundColor'>>`
  /* flex: 1; */
  /* flex-grow: 0; */
  justify-content: space-between;
  flex-direction: row;
  padding-right: ${props => props.theme.paddingLeft}px;
  padding-bottom: 10px;
  padding-top: 10px;
  background-color: ${props => props.backgroundColor ?? props.theme.stylekitBackgroundColor};
`
const TitleContainer = styled.View``
const Title = styled.Text<Pick<Props, 'tinted'>>`
  background-color: ${props => props.theme.stylekitBackgroundColor};
  font-size: ${props => {
    return Platform.OS === 'android' ? props.theme.mainTextFontSize - 2 : props.theme.mainTextFontSize - 4
  }}px;
  padding-left: ${props => props.theme.paddingLeft}px;
  color: ${props => {
    if (props.tinted) {
      return props.theme.stylekitInfoColor
    }

    return Platform.OS === 'android' ? props.theme.stylekitInfoColor : props.theme.stylekitNeutralColor
  }};
  font-weight: ${Platform.OS === 'android' ? 'bold' : 'normal'};
`
const SubTitle = styled.Text`
  background-color: ${props => props.theme.stylekitBackgroundColor};
  font-size: ${props => props.theme.mainTextFontSize - 5}px;
  margin-top: 4px;
  padding-left: ${props => props.theme.paddingLeft}px;
  color: ${props => props.theme.stylekitNeutralColor};
`
const ButtonContainer = styled.TouchableOpacity`
  flex: 1;
  align-items: flex-end;
  justify-content: center;
`
const Button = styled.Text`
  color: ${props => props.theme.stylekitInfoColor};
`

export const SectionHeader: React.FC<Props> = props => (
  <Container>
    <TitleContainer>
      {!!props.title && (
        <Title>
          {Platform.select({
            ios: props.title.toUpperCase(),
            android: props.title,
          })}
        </Title>
      )}
      {!!props.subtitle && <SubTitle>{props.subtitle}</SubTitle>}
    </TitleContainer>
    {!!props.buttonText && (
      <ButtonContainer onPress={props.buttonAction}>
        <Button style={props.buttonStyles}>{props.buttonText}</Button>
      </ButtonContainer>
    )}
  </Container>
)
