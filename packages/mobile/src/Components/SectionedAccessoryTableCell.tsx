import React, { useContext } from 'react'
import { Platform } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import { ThemeContext } from 'styled-components'
import styled, { css } from 'styled-components/native'
import { SectionedTableCellTouchableHighlight } from './/SectionedTableCell'

type Props = {
  testID?: string
  disabled?: boolean
  onPress: () => void
  onLongPress?: () => void
  iconName?: string
  selected?: () => boolean
  leftAlignIcon?: boolean
  color?: string
  bold?: boolean
  tinted?: boolean
  dimmed?: boolean
  text: string
  first?: boolean
  last?: boolean
}

const TouchableContainer = styled(SectionedTableCellTouchableHighlight).attrs(props => ({
  underlayColor: props.theme.stylekitBorderColor,
}))`
  flex-direction: column;
  padding-top: 0px;
  padding-bottom: 0px;
  min-height: 47px;
  background-color: transparent;
`
const ContentContainer = styled.View<Pick<Props, 'leftAlignIcon'>>`
  flex: 1;
  justify-content: ${props => {
    return props.leftAlignIcon ? 'flex-start' : 'space-between'
  }};
  flex-direction: row;
  align-items: center;
`
const IconContainer = styled.View`
  width: 30px;
  max-width: 30px;
`
type LabelProps = Pick<Props, 'bold' | 'tinted' | 'dimmed' | 'selected' | 'color'>
const Label = styled.Text<LabelProps>`
  min-width: 80%;
  color: ${props => {
    let color = props.theme.stylekitForegroundColor
    if (props.tinted) {
      color = props.theme.stylekitInfoColor
    }
    if (props.dimmed) {
      color = props.theme.stylekitNeutralColor
    }
    if (props.color) {
      color = props.color
    }
    return color
  }};
  font-size: ${props => props.theme.mainTextFontSize}px;
  ${({ bold, selected }) =>
    ((selected && selected() === true) || bold) &&
    css`
      font-weight: bold;
    `};
`

export const SectionedAccessoryTableCell: React.FC<Props> = props => {
  const themeContext = useContext(ThemeContext)
  const onPress = () => {
    if (props.disabled) {
      return
    }

    props.onPress()
  }

  const onLongPress = () => {
    if (props.disabled) {
      return
    }

    if (props.onLongPress) {
      props.onLongPress()
    }
  }

  const checkmarkName = Platform.OS === 'android' ? 'md-checkbox' : 'ios-checkmark-circle'
  const iconName = props.iconName ? props.iconName : props.selected && props.selected() ? checkmarkName : null

  const left = props.leftAlignIcon
  let iconSize = left ? 25 : 30
  let color = left ? themeContext.stylekitForegroundColor : themeContext.stylekitInfoColor

  if (Platform.OS === 'android') {
    iconSize -= 5
  }

  if (props.color) {
    color = props.color
  }
  let icon: any = null

  if (iconName) {
    icon = (
      <IconContainer key={iconName}>
        <Icon name={iconName} size={iconSize} color={color} />
      </IconContainer>
    )
  }

  const textWrapper = (
    <Label
      tinted={props.tinted}
      dimmed={props.dimmed}
      bold={props.bold}
      selected={props.selected}
      color={props.color}
      key={1}
    >
      {props.text}
    </Label>
  )

  return (
    <TouchableContainer first={props.first} last={props.last} onPress={onPress} onLongPress={onLongPress}>
      <ContentContainer>{props.leftAlignIcon ? [icon, textWrapper] : [textWrapper, icon]}</ContentContainer>
    </TouchableContainer>
  )
}
