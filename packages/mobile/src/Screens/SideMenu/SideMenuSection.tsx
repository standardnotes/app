import React, { ReactElement, useMemo, useState } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { SideMenuCell } from './SideMenuCell'
import { CollapsedLabel, Header, Root, Title } from './SideMenuSection.styled'

export enum SideMenuOptionIconDescriptionType {
  Icon = 'icon',
  Ascii = 'ascii',
  Circle = 'circle',
  CustomComponent = 'custom-component',
}

export type SideMenuOption = {
  text: string
  subtext?: string
  textClass?: 'info' | 'danger' | 'warning'
  key?: string
  iconDesc?: {
    type: SideMenuOptionIconDescriptionType
    side?: 'left' | 'right'
    name?: string
    value?: string | ReactElement
    backgroundColor?: string
    borderColor?: string
    size?: number
  }
  dimmed?: boolean
  selected?: boolean
  onSelect?: () => void | Promise<void>
  onLongPress?: () => void
  style?: StyleProp<ViewStyle>
  cellContentStyle?: StyleProp<ViewStyle>
}

type Props = {
  title: string
  customCollapsedLabel?: string
  collapsed?: boolean
  options?: SideMenuOption[]
}

export const SideMenuSection: React.FC<Props> = React.memo(props => {
  const [collapsed, setCollapsed] = useState(Boolean(props.collapsed))
  const options = useMemo(() => {
    return props.options || []
  }, [props.options])
  const collapsedLabel =
    props.customCollapsedLabel ||
    (options.length > 0 ? 'Tap to expand ' + options.length + ' options' : 'Tap to expand')
  return (
    <Root>
      <Header collapsed={collapsed} onPress={() => setCollapsed(!collapsed)}>
        <>
          <Title>{props.title}</Title>
          {collapsed && <CollapsedLabel>{collapsedLabel}</CollapsedLabel>}
        </>
      </Header>

      {!collapsed && (
        <>
          {options.map(option => {
            return (
              <SideMenuCell
                text={option.text}
                textClass={option.textClass}
                subtext={option.subtext}
                key={option.text + option.subtext + option.key}
                iconDesc={option.iconDesc}
                dimmed={option.dimmed}
                selected={option.selected}
                onSelect={option.onSelect}
                onLongPress={option.onLongPress}
              />
            )
          })}
          {props.children}
        </>
      )}
    </Root>
  )
})
