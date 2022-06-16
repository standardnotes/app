import React from 'react'
import styled, { css } from 'styled-components/native'

type Props = {
  onPress: () => void
  label: string
  primary?: boolean
  fullWidth?: boolean
  last?: boolean
}

const PrimaryButtonContainer = styled.TouchableOpacity.attrs({
  activeOpacity: 0.84,
})<{
  fullWidth?: boolean
  last?: boolean
}>`
  background-color: ${({ theme }) => theme.stylekitInfoColor};
  padding: 12px 24px;
  border-radius: 4px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.stylekitInfoColor};
  margin-bottom: ${({ fullWidth, last }) => (fullWidth && !last ? '16px' : 0)};
  ${({ fullWidth }) =>
    !fullWidth &&
    css`
      align-self: center;
    `};
`

const SecondaryButtonContainer = styled.TouchableHighlight.attrs(({ theme }) => ({
  activeOpacity: 0.84,
  underlayColor: theme.stylekitBorderColor,
}))<{
  fullWidth?: boolean
  last?: boolean
}>`
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
  padding: 12px 24px;
  border-radius: 4px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.stylekitBorderColor};
  margin-bottom: ${({ fullWidth, last }) => (fullWidth && !last ? '16px' : 0)};
  ${({ fullWidth }) =>
    !fullWidth &&
    css`
      align-self: center;
    `};
`

const ButtonLabel = styled.Text<{ primary?: boolean }>`
  text-align: center;
  text-align-vertical: center;
  font-weight: bold;
  color: ${({ theme, primary }) => {
    return primary ? theme.stylekitInfoContrastColor : theme.stylekitForegroundColor
  }};
  font-size: ${props => props.theme.mainTextFontSize}px;
`

export const Button: React.FC<Props> = ({ onPress, label, primary, fullWidth, last }: Props) => {
  if (primary) {
    return (
      <PrimaryButtonContainer onPress={onPress} fullWidth={fullWidth} last={last}>
        <ButtonLabel primary={primary}>{label}</ButtonLabel>
      </PrimaryButtonContainer>
    )
  } else {
    return (
      <SecondaryButtonContainer onPress={onPress} fullWidth={fullWidth} last={last}>
        <ButtonLabel primary={primary}>{label}</ButtonLabel>
      </SecondaryButtonContainer>
    )
  }
}
