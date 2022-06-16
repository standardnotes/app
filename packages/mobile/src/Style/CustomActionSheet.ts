import { ActionSheetOptions, useActionSheet } from '@expo/react-native-action-sheet'
import React, { useContext } from 'react'
import { findNodeHandle } from 'react-native'
import { ThemeContext } from 'styled-components'

export type CustomActionSheetOption =
  | {
      text: string
      key?: string
      callback?: () => void
      destructive?: boolean
    }
  | {
      text: string
      key?: string
      callback?: (option: CustomActionSheetOption) => void
      destructive?: boolean
    }

type TShowActionSheetParams = {
  title: string
  options: CustomActionSheetOption[]
  onCancel?: () => void
  anchor?: React.Component<any, any>
  styles?: Partial<ActionSheetOptions>
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const createActionSheetOptions = () => {}

export const useCustomActionSheet = () => {
  const { showActionSheetWithOptions } = useActionSheet()
  const theme = useContext(ThemeContext)

  const showActionSheet = ({
    title,
    options,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onCancel = () => {},
    anchor,
    styles = {},
  }: TShowActionSheetParams) => {
    const cancelOption: CustomActionSheetOption[] = [
      {
        text: 'Cancel',
        callback: onCancel,
        key: 'CancelItem',
        destructive: false,
      },
    ]
    const tempOptions = options.concat(cancelOption)
    const destructiveIndex = tempOptions.findIndex(item => item.destructive)
    const cancelIndex = tempOptions.length - 1

    showActionSheetWithOptions(
      {
        options: tempOptions.map(option => option.text),
        destructiveButtonIndex: destructiveIndex,
        cancelButtonIndex: cancelIndex,
        title,
        containerStyle: {
          backgroundColor: theme.stylekitBorderColor,
          ...styles?.containerStyle,
        },
        textStyle: {
          color: theme.stylekitForegroundColor,
          ...styles.textStyle,
        },
        titleTextStyle: {
          color: theme.stylekitForegroundColor,
          ...styles.titleTextStyle,
        },
        anchor: anchor ? findNodeHandle(anchor) ?? undefined : undefined,
      },
      buttonIndex => {
        const option = tempOptions[buttonIndex!]
        option.callback && option.callback(option)
      },
    )
  }

  return { showActionSheet }
}
