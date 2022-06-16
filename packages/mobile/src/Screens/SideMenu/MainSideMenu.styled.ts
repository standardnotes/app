import { useMemo } from 'react'
import { Platform, SafeAreaView, StatusBar, StyleSheet } from 'react-native'
import styled, { css, DefaultTheme } from 'styled-components/native'

// We want top color to be different from bottom color of safe area.
// See https://stackoverflow.com/questions/47725607/react-native-safeareaview-background-color-how-to-assign-two-different-backgro
export const FirstSafeAreaView = styled(SafeAreaView)`
  flex: 0;
  background-color: ${({ theme }) => theme.stylekitContrastBackgroundColor};
  ${Platform.OS === 'android' &&
  css`
    margin-top: ${StatusBar.currentHeight}px;
  `};
`
export const MainSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
  color: ${({ theme }) => theme.stylekitForegroundColor};
`

/** Styled doesn't support FlatList types */
export const useStyles = (theme: DefaultTheme) => {
  return useMemo(
    () =>
      StyleSheet.create({
        sections: {
          padding: 15,
          flex: 1,
          backgroundColor: theme.stylekitBackgroundColor,
        },
      }),
    [theme.stylekitBackgroundColor],
  )
}
