import { Circle } from '@Root/Components/Circle'
import React, { useContext } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import { ThemeContext } from 'styled-components'
import {
  CellContent,
  IconAscii,
  IconCircleContainer,
  IconContainerLeft,
  IconContainerRight,
  IconGraphicContainer,
  RegularText,
  SubText,
  SubTextContainer,
  Text,
  TextContainer,
  Touchable,
} from './SideMenuCell.styled'
import { SideMenuOption, SideMenuOptionIconDescriptionType } from './SideMenuSection'

const renderIcon = (desc: SideMenuOption['iconDesc'], color: string) => {
  if (!desc) {
    return null
  }

  if (desc.type === SideMenuOptionIconDescriptionType.Icon && desc.name) {
    return (
      <IconGraphicContainer>
        <Icon name={desc.name} size={desc.size || 20} color={color} />
      </IconGraphicContainer>
    )
  }
  if (desc.type === SideMenuOptionIconDescriptionType.Ascii) {
    return <IconAscii>{desc.value}</IconAscii>
  }
  if (desc.type === SideMenuOptionIconDescriptionType.Circle) {
    return (
      <IconCircleContainer>
        <Circle backgroundColor={desc.backgroundColor} borderColor={desc.borderColor} />
      </IconCircleContainer>
    )
  }
  if (desc.type === SideMenuOptionIconDescriptionType.CustomComponent) {
    return desc.value
  }
  return <RegularText>*</RegularText>
}

export const SideMenuCell: React.FC<SideMenuOption> = props => {
  const theme = useContext(ThemeContext)
  const colorForTextClass = (textClass: SideMenuOption['textClass']) => {
    if (!textClass) {
      return undefined
    }

    return {
      info: theme.stylekitInfoColor,
      danger: theme.stylekitDangerColor,
      warning: theme.stylekitWarningColor,
    }[textClass]
  }

  const hasIcon = props.iconDesc
  const iconSide = hasIcon && props.iconDesc?.side ? props.iconDesc.side : hasIcon ? 'left' : null
  return (
    <Touchable
      isSubtext={Boolean(props.subtext)}
      onPress={props.onSelect}
      onLongPress={props.onLongPress}
      style={[props.style || {}]}
    >
      <CellContent iconSide={iconSide} style={props.cellContentStyle || {}}>
        {iconSide === 'left' && (
          <IconContainerLeft>{renderIcon(props.iconDesc, theme.stylekitInfoColor)}</IconContainerLeft>
        )}

        <TextContainer selected={props.selected} isSubtext={Boolean(props.subtext)}>
          {props.subtext && (
            <SubTextContainer>
              <SubText>{props.subtext}</SubText>
            </SubTextContainer>
          )}
          <Text textColor={colorForTextClass(props.textClass)}>{props.text}</Text>
        </TextContainer>

        {props.children}

        {iconSide === 'right' && (
          <IconContainerRight>{renderIcon(props.iconDesc, theme.stylekitInfoColor)}</IconContainerRight>
        )}
      </CellContent>
    </Touchable>
  )
}
