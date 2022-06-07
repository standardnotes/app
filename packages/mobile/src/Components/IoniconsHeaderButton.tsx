import React, { useContext } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import { HeaderButton, HeaderButtonProps } from 'react-navigation-header-buttons'
import { ThemeContext } from 'styled-components'

export const IoniconsHeaderButton = (passMeFurther: HeaderButtonProps) => {
  // the `passMeFurther` variable here contains props from <Item .../> as well as <HeaderButtons ... />
  // and it is important to pass those props to `HeaderButton`
  // then you may add some information like icon size or color (if you use icons)
  const theme = useContext(ThemeContext)
  return (
    <HeaderButton
      IconComponent={Icon}
      iconSize={30}
      color={passMeFurther.disabled ? 'gray' : theme.stylekitInfoColor}
      {...passMeFurther}
    />
  )
}
