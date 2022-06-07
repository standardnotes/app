import { StyleSheet } from 'react-native'
import { DefaultTheme } from 'styled-components/native'

export const useToastStyles = (theme: DefaultTheme) => {
  return (props: { [key: string]: unknown }) => {
    return StyleSheet.create({
      info: {
        borderLeftColor: theme.stylekitInfoColor,
        height: props.percentComplete !== undefined ? 70 : 60,
      },
      animatedViewContainer: {
        height: 8,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: theme.stylekitInfoColor,
        marginRight: 8,
        marginLeft: 12,
        marginTop: -16,
      },
      animatedView: {
        backgroundColor: theme.stylekitInfoColor,
      },
      success: {
        borderLeftColor: theme.stylekitSuccessColor,
      },
      error: {
        borderLeftColor: theme.stylekitWarningColor,
      },
    })
  }
}
