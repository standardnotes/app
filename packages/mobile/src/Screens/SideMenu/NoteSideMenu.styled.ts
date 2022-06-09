import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import styled, { DefaultTheme } from 'styled-components/native'

export const SafeAreaContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
  color: ${({ theme }) => theme.stylekitForegroundColor};
`

export const StyledList = styled(ScrollView)`
  padding: 15px;
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
`

export const useStyles = (theme: DefaultTheme) => {
  return useMemo(
    () =>
      StyleSheet.create({
        sections: {
          padding: 15,
          backgroundColor: theme.stylekitBackgroundColor,
        },
      }),
    [theme.stylekitBackgroundColor],
  )
}
