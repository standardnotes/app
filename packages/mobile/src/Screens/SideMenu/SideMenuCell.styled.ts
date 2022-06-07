import { Platform } from 'react-native'
import styled, { css } from 'styled-components/native'

export const Touchable = styled.TouchableOpacity<{ isSubtext: boolean }>`
  min-height: ${props => (props.isSubtext ? 52 : 42)}px;
`
export const CellContent = styled.View<{
  iconSide: 'right' | 'left' | null
}>`
  flex: 1;
  flex-direction: row;
  align-items: center;
  ${({ iconSide }) =>
    iconSide === 'right' &&
    css`
      justify-content: space-between;
    `}
`
const IconContainer = styled.View`
  justify-content: center;
`
export const IconContainerLeft = styled(IconContainer)`
  margin-right: 6px;
`
export const IconContainerRight = styled(IconContainer)`
  justify-content: space-between;
  margin-left: 6px;
  margin-right: 4px;
  height: 100%;
`
export const TextContainer = styled.View<{
  isSubtext: boolean
  selected?: boolean
}>`
  min-height: ${props => (props.isSubtext ? 38 : 24)}px;
  margin-left: 6px;
  flex-shrink: 1;
  ${({ selected, theme }) =>
    selected &&
    css`
      border-bottom-color: ${theme.stylekitInfoColor};
      border-bottom-width: 2px;
    `}
`
const BaseText = styled.Text`
  ${() =>
    Platform.OS === 'android' &&
    css`
      font-family: 'Roboto';
    `}
`
export const Text = styled(BaseText)<{ textColor?: string }>`
  color: ${({ theme, textColor }) => textColor ?? theme.stylekitContrastForegroundColor};
  font-weight: bold;
  font-size: 15px;
  padding-bottom: 0px;
`
export const SubTextContainer = styled.View``
export const SubText = styled(BaseText)`
  color: ${({ theme }) => theme.stylekitContrastForegroundColor};
  opacity: 0.75;
  font-size: 12px;
  margin-top: -5px;
  margin-bottom: 3px;
`
export const IconGraphicContainer = styled.View`
  margin-top: -3px;
  width: 20px;
  flex: 1;
  justify-content: center;
  align-items: center;
`
export const IconCircleContainer = styled(IconGraphicContainer)`
  margin-top: -5px;
`
export const IconAscii = styled.Text`
  font-size: 15px;
  font-weight: bold;
  color: ${({ theme }) => theme.stylekitNeutralColor};
  opacity: 0.6;
  margin-top: -4px;
`
export const RegularText = styled.Text``
